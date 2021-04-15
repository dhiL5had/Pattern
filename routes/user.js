const { verify } = require('crypto');
var express = require('express');
const {response} = require('../app');
var router = express.Router();
const productHelpers = require('../helpers/productHelpers');
const userHelpers = require('../helpers/userHelpers');

const verifyLogin = (req,res,next)=>{
    if(req.session.user){
        next()
    }else{
        res.redirect('/login')
    }
}

router.get('/',(req,res)=>{
    let user = req.session.user;
    res.render('user/view-products',{user})
})

router.get('/product-details',(req,res)=>{
    res.render('user/product-details')
})

router.get('/login',(req,res)=>{
    if(req.session.user){
        res.redirect('/')
    }else{
        res.render('user/user-login')
    }
    res.render('user/user-login')
})

router.post('/login',(req,res)=>{
    userHelpers.doLogin(req.body).then((response)=>{
        if(response.status){
            req.session.user = response.user;
            req.session.user.loggedIn = true;
            res.redirect('/')
        }else{
            res.redirect('/login')
        }
    })
})

router.get('/signup',(req,res)=>{
    res.render('user/user-signup')
})

router.post('/signup',(req,res)=>{
    userHelpers.doSignup(req.body).then((response)=>{
        req.session.user = response
        req.session.user.loggedIn = true;
        res.redirect('/');
    })
})

router.get('/logout',(req,res)=>{
    req.session.user = null;
    res.redirect('/')
})

router.get('/whishlist',(req,res)=>{
    res.render('user/user-whishlist')
})

router.get('/cart',(req,res)=>{
    res.render('user/user-cart')
})

router.get('/placeorder',(req,res)=>{
    res.render('user/user-placeorder')
})

router.get('/orders',(req,res)=>{
    res.render('user/user-orders')
})

router.get('/checkout',(req,res)=>{
    res.render('user/user-checkout')
})



module.exports = router;