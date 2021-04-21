var db = require('../config/connection');
var collection = require('../config/collections');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
var objectId = require('mongodb').ObjectID;
const { resolve } = require('path');
const { response } = require('express');

module.exports = {

    doSignup:(userData)=>{
        return new Promise(async(resolve, reject)=>{
            let emailexist = 0;
            emailexist = await db.get().collection(collection.USER_COLLECTION).findOne({Email:userData.Email})
            let phoneexist = 0;
            phoneexist = await db.get().collection(collection.USER_COLLECTION).findOne({Phone:userData.Phone})
            if(emailexist !=null){
                emailexist = null;
                response.email = true
                if(phoneexist !=null){
                    phoneexist = null;
                    response.phone = true
                    resolve(response)
                }
                resolve(response)
            }else if(phoneexist !=null){
                    phoneexist = null;
                    response.phone = true
                    if(emailexist !=null){
                        emailexist = null;
                        response.email = true
                        resolve(response)
                    }
                    resolve(response)
            }else if(emailexist == null && phoneexist == null){
                userData.State = true;
                userData.Password = await bcrypt.hash(userData.Password, 10);
                db.get().collection(collection.USER_COLLECTION).insertOne(userData)
                .then((data)=>{
                    resolve(data.ops[0])
                })
            }
        })
    },
    googleSignup:(userData)=>{

        return new Promise(async(resolve,reject)=>{
            let response = {};
            let emailexist = 0;
            emailexist = await db.get().collection(collection.USER_COLLECTION).findOne({Email:userData.Email})
            if(emailexist){
                    response  = emailexist;
                    resolve(response)
            }else{
                userData.Phone = "";
                userData.State = true;
                db.get().collection(collection.USER_COLLECTION).insertOne(userData)
                .then((response)=>{
                    resolve(response)
                })
            }
        })

    },

    doLogin:(userData)=>{
        return new Promise(async(resolve,reject)=>{
            let response = {};
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({Email:userData.Email})
            if(user == null){
                response.email = true
                resolve(response)
            }
            if(user.State == false){
                response.State = true
                resolve(response)
            }
            else if(user.State){
                bcrypt.compare(userData.Password, user.Password).then((pass)=>{
                    if(pass){
                        response.user = user;
                        response.login = true;
                        resolve(response);
                    }else{
                        response.passError = true
                        resolve(response)
                    }
            })
            }else{
                resolve({status:false})
            }
        }).catch(()=>{
            reject()
        })
    },

    getAllUsers:()=>{
        return new Promise(async(resolve,reject)=>{
            let users = await db.get().collection(collection.USER_COLLECTION).find().toArray().then((users)=>{
                resolve(users)
            })
        })
    },

    activateUser:(userId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.USER_COLLECTION).updateOne({_id:objectId(userId)},
            {
                $set:{
                    State:true
                }
            }
            ).then(()=>{
                resolve()
            })
        })
    },

    blockUser:(userId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.USER_COLLECTION).updateOne({_id:objectId(userId)},
            {
                $set:{
                    State:false
                }
            }
            ).then(()=>{
                resolve()
            })
        })
    }
    

}