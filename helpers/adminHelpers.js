var db = require('../config/connection');
var collection = require('../config/collections');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
var objectId = require('mongodb').ObjectID;
const { resolve } = require('path');
const { response } = require('express');


module.exports = {

    adminLogin:(adminData)=>{
        return new Promise(async(resolve,reject)=>{
            let response = {};
            let admin = await db.get().collection(collection.USER_COLLECTION).findOne({Email:adminData.Email})
            if(admin.Role == 'Admin'){
                bcrypt.compare(adminData.Password, admin.Password).then((admin)=>{
                    if(admin){
                        response.admin = admin;
                        response.status = true;
                        resolve(response);
                    }else{
                        resolve({status:false})
                    }
                })
            }else{
                reject(error)
            }
        })
    },

    getAllOrders:()=>{
        return new Promise(async(resolve,reject)=>{
            let orders = await db.get().collection(collection.ORDER_COLLECTION).find().toArray()
            resolve(orders)
        })
    },

    changeOrderStatus:(id,status)=>{
        console.log("iddd",id);
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.ORDER_COLLECTION).updateOne({_id:objectId(id)},{
                $set:{status:status}
            })
            resolve()
        })
    },

    productCount:()=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
            .then((products)=>{
                resolve(products.length)
            })
        })
    },

    orderCount:()=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.ORDER_COLLECTION).find().toArray()
            .then((orders)=>{
                resolve(orders.length)
            })
        })
    },

    usersCount:()=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.USER_COLLECTION).find().toArray()
            .then((users)=>{
                resolve(users.length)
            })
        })
    },

    getAllUsers:()=>{
        return new Promise(async(resolve,reject)=>{
            let users = await db.get().collection(collection.USER_COLLECTION).find().toArray()
                resolve(users)
            
        })
    },

    blockUser:(id)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.USER_COLLECTION).updateOne({_id:objectId(id)},{
                $set:{
                    State:'false'
                }
            }).then(()=>{
                console.log("done");
                resolve()
            })
        })
    },

    activateUser:(id)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.USER_COLLECTION).updateOne({_id:objectId(id)},{
                $set:{
                    State:'true'
                }
            }).then(()=>{
                console.log('done');
                resolve()
            })
        })
    },

    getReport:(start, end)=>{
        return new Promise(async(resolve,reject)=>{
            let report = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match:{date:{$gte:start, $lte:end}}
                },
                {
                    $project:{
                        deliveryDetails:1,
                        paymentmethod:1,
                        products:1,
                        totalamount:1,
                        status:1,
                        date:1
                    }
                }
            ]).toArray()
            console.log("report",report);
            resolve(report)
        })
    }
}