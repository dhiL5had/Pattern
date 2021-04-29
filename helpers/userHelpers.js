var db = require('../config/connection');
var collection = require('../config/collections');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
var objectId = require('mongodb').ObjectID;
const { resolve } = require('path');
const { response } = require('express');
const { resolveSoa } = require('dns');

module.exports = {

    doSignup: (userData) => {
        return new Promise(async (resolve, reject) => {
            let emailexist = 0;
            emailexist = await db.get().collection(collection.USER_COLLECTION).findOne({ Email: userData.Email })
            let phoneexist = 0;
            phoneexist = await db.get().collection(collection.USER_COLLECTION).findOne({ Phone: userData.Phone })
            if (emailexist != null) {
                emailexist = null;
                response.email = true
                if (phoneexist != null) {
                    phoneexist = null;
                    response.phone = true
                    resolve(response)
                }
                resolve(response)
            } else if (phoneexist != null) {
                phoneexist = null;
                response.phone = true
                if (emailexist != null) {
                    emailexist = null;
                    response.email = true
                    resolve(response)
                }
                resolve(response)
            } else if (emailexist == null && phoneexist == null) {
                userData.State = true;
                userData.Password = await bcrypt.hash(userData.Password, 10);
                db.get().collection(collection.USER_COLLECTION).insertOne(userData)
                    .then((data) => {
                        resolve(data.ops[0])
                    })
            }
        })
    },
    googleSignup: (userData) => {

        return new Promise(async (resolve, reject) => {
            let response = {};
            let emailexist = 0;
            emailexist = await db.get().collection(collection.USER_COLLECTION).findOne({ Email: userData.Email })
            if (emailexist) {
                response = emailexist;
                resolve(response)
            } else {
                userData.Phone = "";
                userData.State = true;
                db.get().collection(collection.USER_COLLECTION).insertOne(userData)
                    .then((response) => {
                        resolve(response)
                    })
            }
        })

    },

    doLogin: (userData) => {
        return new Promise(async (resolve, reject) => {
            let response = {};
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ Email: userData.Email })
            if (user == null) {
                response.email = true
                resolve(response)
            }
            if (user.State == false) {
                response.State = true
                resolve(response)
            }
            else if (user.State) {
                bcrypt.compare(userData.Password, user.Password).then((pass) => {
                    if (pass) {
                        response.user = user;
                        response.login = true;
                        resolve(response);
                    } else {
                        response.passError = true
                        resolve(response)
                    }
                })
            } else {
                resolve({ status: false })
            }
        }).catch(() => {
            reject()
        })
    },

    getAllUsers: () => {
        return new Promise(async (resolve, reject) => {
            let users = await db.get().collection(collection.USER_COLLECTION).find().toArray().then((users) => {
                resolve(users)
            })
        })
    },

    activateUser: (userId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(userId) },
                {
                    $set: {
                        State: true
                    }
                }
            ).then(() => {
                resolve()
            })
        })
    },

    blockUser: (userId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(userId) },
                {
                    $set: {
                        State: false
                    }
                }
            ).then(() => {
                resolve()
            })
        })
    },
    addToWishlist: (proId, userId) => {

        return new Promise(async (resolve, reject) => {
            let wishlist = await db.get().collection(collection.WISHLIST_COLLECTION).findOne({ user: objectId(userId) })
            if (wishlist) {
                console.log("wishhhh", wishlist);
                var wishExist = wishlist.products.findIndex(product => product.item == proId)
                console.log("exists", wishExist);
                if (wishExist != -1) {
                    reject()
                } else {
                    db.get().collection(collection.WISHLIST_COLLECTION).updateOne({ user: objectId(userId) },
                        {
                            $push: { products: { item: objectId(proId) } }
                        }).then((response) => {
                            resolve()
                        })
                }
            } else {
                let wishObj = {
                    user: objectId(userId),
                    products: [{ item: objectId(proId) }]
                }
                db.get().collection(collection.WISHLIST_COLLECTION).insertOne(wishObj).then((response) => {
                    resolve()
                })
            }
        })
    },

    getWishProducts: (userId) => {
        return new Promise(async (resolve, reject) => {
            let wishlist = await db.get().collection(collection.WISHLIST_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                }
            ]).toArray()

            if (wishlist.length > 0) {
                resolve(wishlist)
            } else {
                reject()

            }
        })
    },

    deleteWish: (proId, userId) => {
        console.log('product', proId);
        return new Promise((resolve, reject) => {
            console.log("im here");
            db.get().collection(collection.WISHLIST_COLLECTION).updateOne({ user: objectId(userId) },
                {
                    $pull: { products: { item: objectId(proId) } }
                })
                .then((response) => {
                    // console.log('response',response);
                    resolve()
                })
        })
    },

    addToCart: (proId, userId) => {
        let proObj = {
            item: objectId(proId),
            quantity: 1
        }
        return new Promise(async (resolve, reject) => {
            let wish = await db.get().collection(collection.WISHLIST_COLLECTION).findOne({ user: objectId(userId) })
            if (wish) {
                var wishExist = wish.products.findIndex(product => product.item == proId)
                if (wishExist != 1) {
                    db.get().collection(collection.WISHLIST_COLLECTION).updateOne({ user: objectId },
                        {
                            $pull: { products: { item: objectId(proId) } }
                        })
                }
            }
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            if (cart) {
                var cartExist = cart.products.findIndex(product => product.item == proId)
                if (cartExist != -1) {
                    db.get().collection(collection.CART_COLLECTION).updateOne({ user: objectId(userId), 'products.item': objectId(proId) },
                        {
                            $inc: { 'products.$.quantity': 1 }
                        }).then(() => {
                            resolve()
                        })
                } else {
                    db.get().collection(collection.CART_COLLECTION).updateOne({ user: objectId(userId) },
                        {
                            $push: { products: proObj }
                        }).then(() => {
                            resolve()
                        })
                }
            } else {
                let cartObj = {
                    user: objectId(userId),
                    products: [proObj]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then(() => {
                    resolve()
                })
            }
        })
    },

    getCartProducts: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cartItems = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] },
                        prototal:{$multiply:[{$arrayElemAt:['$product.Price',0]},'$quantity']}
                    }
                }
            ]).toArray()
            if (cartItems.length > 0) {
                resolve(cartItems)
            } else {
                reject()
            }
        })
    },

    getTotalAmount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let total = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }
                },
                {
                    $unwind: '$products'

                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: { $multiply: ['$quantity', '$product.Price'] } }
                    }
                }
            ]).toArray();
            resolve(total[0].total)
        })
    },

    getProductTotal: (userId,proId) => {
        return new Promise(async (resolve, reject) => {
            let prototal = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId)}
                },
                {
                    $unwind: '$products'

                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $match: { item: objectId(proId)}
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        total: { $sum: { $multiply: ['$quantity', '$product.Price'] } }
                    }
                }
            ]).toArray();
            resolve(prototal[0].total)
        })
    },

    changeProductQuantity: (product) => {
        return new Promise((resolve, reject) => {
            if (product.count == -1 && product.quantity == 1){
                resolve({ minus: true })
            } else {
                db.get().collection(collection.CART_COLLECTION).updateOne({_id: objectId(product.cart), 'products.item': objectId(product.product) },
                    {
                        $inc: { 'products.$.quantity': product.count }
                    }).then((response) => {
                        resolve({ changed: true })
                    })
            }
        })
    },

    removeProduct: (product) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CART_COLLECTION).updateOne({ _id: objectId(product.cart) },
                {
                    $pull: { products: { item: objectId(product.product) } }
                }).then((response) => {
                    resolve({ removed: true })
                })
        })
    }


}