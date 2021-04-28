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
const { route } = require('./admin');
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
    let user = req.session.user;
    productHelpers.getProductDetails(req.params.id).then((product)=>{
    res.render('user/productdetails',{user,product})
    })
})

router.get('/addtowishlist/:id',(req,res)=>{
        userHelpers.addToWishlist(req.params.id,req.session.user).then(()=>{
            res.redirect('/wishlist')
}).catch(()=>{
    res.redirect('/wishlist');
})
})

router.get('/wishlist',verifyLogin,(req,res)=>{
    let user = req.session.user;
    userHelpers.getWishProducts(user).then((wish)=>{
        res.render('user/wishlist',{wish,user})
    }).catch(()=>{
        res.render('user/wishlist',{user})
    })
})

router.get('/deletewish/:id',(req,res)=>{
    let prod = req.params.id;
    let user = req.session.user;
    console.log('product',prod);
    userHelpers.deleteWish(prod,user).then(()=>{
        res.redirect('/wishlist')
    })
})

router.get('/cart',verifyLogin,(req,res)=>{
    let user = req.session.user;
    // userHelpers.getCartProducts(user).then((cart)=>{
    //     res.render('user/cart',{cart,user})
    // })
    res.render('user/cart',{user})
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