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
        db.get().collection('products').insertOne(product).then((data) => {
            proId(data.ops[0]._id)
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

    getOfferProducts:()=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).find().toArray().then((products)=>{
                resolve(products)
            })
        })
    },

    updateProduct: (proData, proId) => {
        console.log("edit Pro",proData);
        return new Promise((resolve, reject) => {
            if(proData.Offer){
                db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:objectId(proId)},
                {
                    $set: {
                        Name: proData.Name,
                        Category: proData.Category,
                        Quantity: proData.Quantity,
                        Description: proData.Description,
                        Price:proData.Price,
                        Offer:proData.Offer,
                        ActualPrice:proData.ActualPrice

                    }
                }).then(() => {
                    resolve()
                })
            }else{
                db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objectId(proId) },
                    {
                        $set: {
                            Name: proData.Name,
                            Price: proData.Price,
                            Category: proData.Category,
                            Quantity: proData.Quantity,
                            Description: proData.Description,
    
                        },

                        $unset:{
                            Offer:'',
                            ActualPrice:''
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
    }


}