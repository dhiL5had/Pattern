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
    }

}