var express = require('express');
const {response} = require('../app');
const userHelpers = require('../helpers/userHelpers');
const adminHelpers = require('../helpers/adminHelpers')
var router = express.Router();
const verifyLogin = (req,res,next)=>{
    if(req.session.admin){
        next()
    }else{
        res.redirect('/admin/adminlog')
    }
}

router.get('/adminlog',(req,res)=>{
    res.render('partials/admin-login',{adminlog:true})
})

router.post('/adminlog',(req,res)=>{
    adminHelpers.adminLogin(req.body).then((response)=>{
        if(response.status){
            req.session.admin = response.admin;
            req.session.admin.loggedIn = true;
            res.redirect('/admin')
        }else{
            res.redirect('/admin/adminlog')
        }
    }).catch((response)=>{
        console.log(response);
        res.redirect('/admin/adminlog')
    })
})

router.get('/',verifyLogin,(req,res)=>{
    res.render('admin/admin-home',{admin:true})
})

router.get('/adminout',(req,res)=>{
    req.session.admin = null;
    res.redirect('/admin/adminlog')
})

router.get('/products',(req,res)=>{
    res.render('admin/admin-products',{admin:true})
})

router.get('/addproducts',(req,res)=>{
    res.render('admin/add-product',{admin:true})
})

module.exports = router;