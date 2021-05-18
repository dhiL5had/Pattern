var db = require('../config/connection')
var collection = require('../config/collections')
var objectId = require('mongodb').ObjectID;
const { PRODUCT_COLLECTION } = require('../config/collections');
const { response } = require('express');

module.exports = {
    getAllProducts: () => {
        return new Promise(async (resolve, reject) => {
            let products = await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
            resolve(products)
        })

    },

    addProduct: (product, proId) => {
        return new Promise((resolve, reject) => {
            db.get().collection('products').insertOne(product).then((data) => {
                proId(data.ops[0]._id)
            })
        })
    },

    getProductDetails: (proId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: objectId(proId) }).then((product) => {
                resolve(product)
            })
        })
    },

    getSameCategory: (category) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).find({ Category: category }).toArray()
                .then((catproducts) => {
                    resolve(catproducts)
                })
        })
    },

    getOfferProducts: () => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).find({ Offer: { $exists: true } }).toArray().then((products) => {
                resolve(products)
            })
        })
    },

    updateProduct: (proData, proId) => {
        return new Promise((resolve, reject) => {
            if (proData.Offer) {
                db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objectId(proId) },
                    {
                        $set: {
                            Name: proData.Name,
                            Category: proData.Category,
                            Quantity: proData.Quantity,
                            Description: proData.Description,
                            Price: proData.Price,
                            Offer: proData.Offer,
                            ActualPrice: proData.ActualPrice

                        }
                    }).then(() => {
                        resolve()
                    })
            } else {
                db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objectId(proId) },
                    {
                        $set: {
                            Name: proData.Name,
                            Price: proData.Price,
                            Category: proData.Category,
                            Quantity: proData.Quantity,
                            Description: proData.Description,

                        },

                        $unset: {
                            Offer: '',
                            ActualPrice: ''
                        }
                    }).then(() => {
                        resolve()
                    })
            }
        })
    }
    ,

    deleteProduct: (proId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).removeOne({ _id: objectId(proId) }).then(() => {
                resolve()
            })
        })

    },

    addcategory: (categ) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CATEGORY_COLLECTION).insertOne(categ).then(() => {
                resolve()
            })
        })
    },

    getCategories: () => {
        return new Promise(async (resolve, reject) => {
            let categories = await db.get().collection(collection.CATEGORY_COLLECTION).find().toArray()
            if (categories.length > 0) {
                resolve(categories)
            } else {
                reject()
            }
        })
    },
    deleteCategory: (categ) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CATEGORY_COLLECTION).removeOne({ "newcategory": categ }).then(() => {
                resolve()
            })
        })
    },

    addCatOff: (offer, category) => {
        return new Promise(async (resolve, reject) => {
            let catproducts = await db.get().collection(collection.PRODUCT_COLLECTION).find({ Category: category }).toArray()
            catproducts.forEach(product => {
                console.log(product);
                if (product.ActualPrice) {
                    let offerPrice = product.ActualPrice - (product.ActualPrice * offer) / 100;
                    db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objectId(product._id) }, {
                        $set: {
                            Offer: offer,
                            Price: Math.round(offerPrice)
                        }
                    })
                    console.log('OfferPrice', offerPrice);
                } else {
                    let offerPrice = product.Price - (product.Price * offer) / 100;
                    db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objectId(product._id) }, {
                        $set: {
                            ActualPrice: product.Price,
                            Offer: offer,
                            Price: Math.round(offerPrice)
                        }
                    })

                }
                db.get().collection(collection.CATEGORY_COLLECTION).updateOne({ newcategory: category }, { $set: { Offer: offer } })
            });
            resolve()
        })
    },

    removeCatOff: (category) => {
        return new Promise(async (resolve, reject) => {
            let catProducts = await db.get().collection(collection.PRODUCT_COLLECTION).find({ Category: category }).toArray()
            catProducts.forEach(product => {
                console.log(product);
                db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objectId(product._id) }, {
                    $set: {
                        Price: product.ActualPrice,
                    },
                    $unset: {
                        Offer: ''
                        // ActualPrice:''
                    }
                })
            })
            console.log("I'm hereeeee");
            db.get().collection(collection.CATEGORY_COLLECTION).updateOne({ newcategory: category }, { $unset: { Offer: '' } })
            resolve()
        })
    }
}