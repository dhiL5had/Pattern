const { verify } = require('crypto');
var express = require('express');
const {response} = require('../app');
var router = express.Router();
const productHelpers = require('../helpers/productHelpers');
const userHelpers = require('../helpers/userHelpers');
const {check , validationResult} = require('express-validator');
const { ESTALE } = require('constants');
const { rejects } = require('assert');
const passport = require('passport');
const { getProductDetails } = require('../helpers/productHelpers');
require('../auth');

const verifyLogin = (req,res,next)=>{
    let user = req.session.user;
    if(user){
        next()
    }else{
        res.redirect('/login')
    }
}

router.get('/',(req,res)=>{
    let user = req.session.user;
        productHelpers.getAllProducts().then((products)=>{
            console.log(products);
            res.render('user/home',{user,products})
            })
    })
   

router.get('/login',(req,res)=>{
    if(req.session.user){
        res.redirect('/')
    }else{
        res.render('user/login')
    }
})

router.post('/login',
[
    check('Email').notEmpty().isEmail().normalizeEmail(),
    check('Password').notEmpty().isLength(6,16)
],
(req,res)=>{
    const errors = validationResult(req)
    if(errors.errors.length >=1){
        res.redirect('loginError')
    }else{
        userHelpers.doLogin(req.body).then((response)=>{
            if(response.email){
                response.email = false;
                res.json({email:'emailError'})
            }if(response.State){
                response.State = false;
                res.json({state:'blocked'})
            }if(response.passError){     
                response.passError = false;
                res.json({pass:'Invalid'})
            }
            else if(response.login){
                req.session.user = response.user._id;
                req.session.user.loggedIn = true;
                res.json({login:true})
            }else{
                res.redirect('/login')
            }
        })
    }
})

router.get('/signup',(req,res)=>{
    if(req.session.user){
        res.redirect('/')
    }else{
        res.render('user/signup')
    }
})

router.post('/signup',
[
    check('Name').notEmpty(),
    check('Email').notEmpty().normalizeEmail(),
    check('Phone').notEmpty().isNumeric().isLength(10),
    check('Password').notEmpty().isLength(6,16),
],
(req,res)=>{
    const errors = validationResult(req);
    if(errors.errors.length >=1){
        res.send('signupError')
    }else{
         userHelpers.doSignup(req.body).then((response)=>{
            if(response.email){
                response.email = false;
                res.json({email:'emailError'})
            }
            if(response.phone){
                response = false;
                res.json({phone:'phoneError'})
            }else{
                req.session.user = response._id
                req.session.user.loggedIn = true;
                response.signup = true
                res.json(response)
            }
            
    })
}
})

router.get('/google',passport.authenticate('google',{scope:['profile','email']}));

router.get('/google/cb',passport.authenticate('google',{failureRedirect:'/login',session: false}),
(req,res)=>{
    req.session.user = req.user._id;
    req.session.user.loggedIn = true
    res.redirect('/');
})

router.get('/facebook',passport.authenticate('facebook',{scope:'email'}))

router.get('/facebook/cb',passport.authenticate('facebook',{failureRedirect:'/login',session: false}),
(req,res)=>{
    res.redirect('/');
})

router.get('/logout',(req,res)=>{
    req.session.user = null;
    res.redirect('/')
})

router.get('/productdetails/:id',(req,res)=>{
    let proId = req.params.id;
    productHelpers.getProductDetails(proId).then((product)=>{
    res.render('user/productdetails',{product})
    }).catch(()=>{
        res.redirect('/');
    })
})

router.get('/wishlist',(req,res)=>{
    res.render('user/wishlist')
})

router.get('/cart',(req,res)=>{
    res.render('user/cart')
})

router.get('/placeorder',(req,res)=>{
    res.render('user/placeorder')
})

router.get('/orders',(req,res)=>{
    res.render('user/orders')
})

router.get('/checkout',(req,res)=>{
    res.render('user/checkout')
})



module.exports = router;