var db = require('../config/connection');
var collection = require('../config/collections');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
var objectId = require('mongodb').ObjectID;
const { resolve } = require('path');
const { response } = require('express');

module.exports = {

    doSignup:(userData)=>{
        return new Promise(async(resolve,reject)=>{
            userData.Password = await bcrypt.hash(userData.Password, 10);
            db.get().collection(collection.USER_COLLECTION).insertOne(userData)
            .then((data)=>{
                resolve(data.ops[0])
            })
        })
    },

    doLogin:(userData)=>{
        return new Promise(async(resolve,reject)=>{
            let response = {};
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({Email:userData.Email})
            if(user){
                bcrypt.compare(userData.Password, user.Password).then((status)=>{
                    if(status){
                        response.user = user;
                        response.status = true;
                        resolve(response);
                    }else{
                        resolve({status:true})
                    }
                })
            }else{
                resolve({status:false})
            }
        })
    }
    

}