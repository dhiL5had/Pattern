const db = require('../config/connection');
const collection = require('../config/collections');
const bcrypt = require('bcrypt');
const Razorpay = require('razorpay');
const instance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});
const paypal = require('paypal-rest-sdk');
const crypto = require('crypto');
const objectId = require('mongodb').ObjectID;
const { resolve } = require('path');
const { response } = require('express');
const { resolveSoa } = require('dns');
const { options } = require('../routes/admin');
const { ESTALE } = require('constants');
const { stringify } = require('querystring');

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
                userData.Address = [];
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
        console.log("im here also");
        return new Promise(async (resolve, reject) => {
            let users = await db.get().collection(collection.USER_COLLECTION).find().toArray()
            resolve(users)
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

    getCartCount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let count = 0;
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            if (cart) {
                count = cart.products.length;
            } else {
                resolve(count)
            }
            resolve(count)
        })
    },

    getWishCount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let count = 0;
            let wish = await db.get().collection(collection.WISHLIST_COLLECTION).findOne({ user: objectId(userId) })
            if (wish) {
                count = wish.products.length;
            } else {
                resolve(count)
            }
            resolve(count)
        })
    },

    addToWishlist: (proId, userId) => {

        return new Promise(async (resolve, reject) => {
            let wishlist = await db.get().collection(collection.WISHLIST_COLLECTION).findOne({ user: objectId(userId) })
            let cartlist = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            if (wishlist) {
                var wishExist = wishlist.products.findIndex(product => product.item == proId)
                var cartExist = cartlist.products.findIndex(product => product.item == proId)
                if (wishExist != -1) {
                    reject()
                } else if (cartExist == -1) {
                    db.get().collection(collection.WISHLIST_COLLECTION).updateOne({ user: objectId(userId) },
                        {
                            $push: { products: { item: objectId(proId) } }
                        }).then((response) => {
                            resolve()
                        })
                } else {
                    reject()
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
        return new Promise((resolve, reject) => {
            db.get().collection(collection.WISHLIST_COLLECTION).updateOne({ user: objectId(userId) },
                {
                    $pull: { products: { item: objectId(proId) } }
                })
                .then((response) => {
                    resolve()
                })
        })
    },

    addToCart: (proId, userId) => {
        let response = {}
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
                    response.exist = true;
                    resolve(response)
                } else {
                    db.get().collection(collection.CART_COLLECTION).updateOne({ user: objectId(userId) },
                        {
                            $push: { products: proObj }
                        }).then(() => {
                            response.cplus = true;
                            resolve(response)
                        })
                }
            } else {
                let cartObj = {
                    user: objectId(userId),
                    products: [proObj]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then(() => {
                    response.cplus = true;
                    resolve(response)
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
                        prototal: { $multiply: [{ $arrayElemAt: ['$product.Price', 0] }, '$quantity'] }
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

    getProductTotal: (userId, proId) => {
        return new Promise(async (resolve, reject) => {
            let prototal = await db.get().collection(collection.CART_COLLECTION).aggregate([
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
                    $match: { item: objectId(proId) }
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
            if (product.count == -1 && product.quantity == 1) {
                resolve({ minus: true })
            } else {
                db.get().collection(collection.CART_COLLECTION).updateOne({ _id: objectId(product.cart), 'products.item': objectId(product.product) },
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
    },

    getProductList: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            resolve(cart.products)
        })
    },

    addAddress: (data, userId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(userId) },
                {
                    $push: { Address: data }
                }).then(() => {
                    resolve()
                })
        })
    },

    // getAddresses:(userId)=>{
    //     return new Promise(async(resolve,reject)=>{
    //        let user =await db.get().collection(collection.USER_COLLECTION).findOne({_id:objectId(userId)})
    //        resolve(user.Address)
    //     })
    // },

    placeOrder: (order, products, total) => {
        return new Promise((resolve, reject) => {
            let paymentstatus = order.paymentmethod == 'COD' ? 'placed' : 'pending';
            let orderObj = {
                deliveryDetails: {
                    address: order.address,
                    city: order.city,
                    state: order.state,
                    pincode: order.pincode,
                    mobile: order.mobile
                },
                userId: objectId(order.userid),
                paymentmethod: order.paymentmethod,
                products: products,
                totalamount: total,
                status: paymentstatus,
                date: new Date()
            }

            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response) => {
                db.get().collection(collection.CART_COLLECTION).removeOne({ user: objectId(order.userid) })
                products.forEach(item => {
                    db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ item: objectId(item.item) },
                        {
                            $inc: { 'products.$.Quantity': item.quantity }
                        })
                });
                // console.log(response);
                resolve(response.ops[0]._id)
            })
        })
    },

    generateRazorpay: (orderId, total) => {
        return new Promise((resolve, reject) => {
            var options = {
                amount: total * 100,
                currency: "INR",
                receipt: "" + orderId
            }
            instance.orders.create(options, (err, order) => {
                console.log(order);
                if (err) {
                    console.log(err);
                } else {
                    resolve(order)
                }
            })
        })
    },

    verifyPayment: (details) => {
        return new Promise((resolve, reject) => {
            let hmac = crypto.createHmac('sha256', 'qsxNz9Gozz060UEHmSF53Z1E')
            console.log(details);
            hmac.update(details['payment.razorpay_payment_id'] + '|' + details.order.response.id)
            hmac.digest('hex');
            resolve()
        })
    },

    changePaymentStatus: (orderId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(orderId) },
                {
                    $set: {
                        status: 'placed'
                    }
                }).then(() => {
                    resolve()
                })
        })
    },

    getAllOrders: (userId) => {
        return new Promise(async (resolve, reject) => {
            let orders = await db.get().collection(collection.ORDER_COLLECTION).find({ userId: objectId(userId) }).toArray()
            resolve(orders)
        })
    },

    cancelOrder: (id) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION).removeOne({ _id: objectId(id) })
            resolve()
        })
    },

    getOrderProducts: (orderId) => {
        return new Promise(async (resolve, reject) => {
            let orderItems = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: { _id: objectId(orderId) }
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
                }
            ]).toArray()
            resolve(orderItems)
        })
    }


}