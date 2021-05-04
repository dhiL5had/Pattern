const { verify } = require('crypto');
var express = require('express');
const { response } = require('../app');
var router = express.Router();
const fetch = require('node-fetch')
const productHelpers = require('../helpers/productHelpers');
const userHelpers = require('../helpers/userHelpers');
const { check, validationResult } = require('express-validator');
const { ESTALE } = require('constants');
const { rejects } = require('assert');
const passport = require('passport');
const { getProductDetails } = require('../helpers/productHelpers');
const { route } = require('./admin');
const jwt = require('jsonwebtoken');
require('../auth');

const verifyLogin = (req, res, next) => {
    let user = req.session.user;
    if (user != null) {
        next()
    } else {
        res.redirect('/login')
    }
}

router.get('/', (req, res) => {
    let user = req.session.user;
    if (user) {
        productHelpers.getAllProducts().then((products) => {
            productHelpers.getCategories().then((categories) => {
                userHelpers.getCartCount(user).then((cartCount) => {
                    userHelpers.getWishCount(user).then((wishCount) => {
                        res.render('user/home', { user, products, categories, cartCount, wishCount })
                    })
                })
            })
        })
    } else {
        productHelpers.getAllProducts().then((products) => {
            productHelpers.getCategories().then((categories) => {
                res.render('user/home', { user, products, categories })
            })
        })
    }

})

router.post('/getcatproducts', (req, res) => {
    productHelpers.getSameCategory(req.body.category).then((catproducts) => {
        res.json({ catproducts })
    })
})


router.get('/login', (req, res) => {
    if (req.session.user) {
        res.redirect('/')
    } else {
        res.render('user/login')
    }
})

router.post('/login',
    [
        check('Email').notEmpty().isEmail().normalizeEmail(),
        check('Password').notEmpty().isLength(6, 16)
    ],
    (req, res) => {
        const errors = validationResult(req)
        if (errors.errors.length >= 1) {
            res.redirect('loginError')
        } else {
            userHelpers.doLogin(req.body).then((response) => {
                if (response.email) {
                    response.email = false;
                    res.json({ email: 'emailError' })
                } if (response.State) {
                    response.State = false;
                    res.json({ state: 'blocked' })
                } if (response.passError) {
                    response.passError = false;
                    res.json({ pass: 'Invalid' })
                }
                else if (response.login) {
                    console.log("i'm hereeeeee");

                    req.session.user = response.user._id;
                    req.session.user.loggedIn = true;

                    // const token = jwt.sign({
                    //     user:response.user._id
                    // },process.env.JWT_SECRET,{expiresIn:"1h"});

                    // console.log(token);

                    res.json({ login: true })
                } else {
                    res.redirect('/login')
                }
            })
        }
    })

router.get('/signup', (req, res) => {
    if (req.session.user) {
        res.redirect('/')
    } else {
        res.render('user/signup')
    }
})

router.post('/signup',
    [
        check('Name').notEmpty(),
        check('Email').notEmpty().normalizeEmail(),
        check('Phone').notEmpty().isNumeric().isLength(10),
        check('Password').notEmpty().isLength(6, 16),
    ],
    (req, res) => {
        const errors = validationResult(req);
        if (errors.errors.length >= 1) {
            res.send('signupError')
        } else {
            userHelpers.doSignup(req.body).then((response) => {
                if (response.email) {
                    response.email = false;
                    res.json({ email: 'emailError' })
                }
                if (response.phone) {
                    response = false;
                    res.json({ phone: 'phoneError' })
                } else {
                    req.session.user = response._id
                    req.session.user.loggedIn = true;
                    response.signup = true
                    res.json(response)
                }

            })
        }
    })

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/cb', passport.authenticate('google', { failureRedirect: '/login', session: false }),
    (req, res) => {
        req.session.user = req.user._id;
        req.session.user.loggedIn = true
        res.redirect('/');
    })

router.get('/facebook', passport.authenticate('facebook', { scope: 'email' }))

router.get('/facebook/cb', passport.authenticate('facebook', { failureRedirect: '/login', session: false }),
    (req, res) => {
        res.redirect('/');
    })

router.get('/logout', (req, res) => {
    req.session.user = null;
    res.redirect('/')
})

router.get('/productdetails/:id', (req, res) => {
    let user = req.session.user;
    productHelpers.getProductDetails(req.params.id).then((product) => {
        productHelpers.getSameCategory(product.Category).then((catproducts) => {
            userHelpers.getCartCount(user).then((cartCount) => {
                userHelpers.getWishCount(user).then((wishCount) => {
                    res.render('user/productdetails', { user, product, catproducts, cartCount, wishCount })
                })
            })
        })
    })
})

router.post('/addtowishlist', verifyLogin, (req, res) => {
    userHelpers.addToWishlist(req.body.product, req.session.user).then(() => {
        res.json({ wplus: true })
    })
})

router.get('/wishlist', verifyLogin, (req, res) => {
    let user = req.session.user;
    userHelpers.getWishProducts(user).then((wish) => {
        userHelpers.getCartCount(user).then((cartCount) => {
            userHelpers.getWishCount(user).then((wishCount) => {
                res.render('user/wishlist', { wish, user, cartCount, wishCount })
            })
        })
    }).catch(() => {
        userHelpers.getCartCount(user).then((cartCount) => {
            userHelpers.getWishCount(user).then((wishCount) => {
                res.render('user/wishlist', { user, cartCount, wishCount })
            })
        })
    })
})

router.get('/deletewish/:id', (req, res) => {
    let prod = req.params.id;
    let user = req.session.user;
    userHelpers.deleteWish(prod, user).then(() => {
        res.redirect('/wishlist')
    })
})

router.post('/addtocart', verifyLogin, (req, res) => {
    let product = req.body.product;
    let user = req.session.user;
    userHelpers.addToCart(product, user).then((response) => {
        res.json(response)
    })
})

router.get('/cart', verifyLogin, (req, res) => {
    let user = req.session.user;
    userHelpers.getCartProducts(user).then((cart) => {
        userHelpers.getCartCount(user).then((cartCount) => {
            userHelpers.getWishCount(user).then(async (wishCount) => {
                let total = await userHelpers.getTotalAmount(user)
                res.render('user/cart', { cart, user, total, cartCount, wishCount })
            })
        })
    }).catch(() => {
        res.render('user/cart', { user })
    })
})

router.post('/changequantity', (req, res) => {
    req.body.count = parseInt(req.body.count);
    req.body.quantity = parseInt(req.body.quantity)
    userHelpers.changeProductQuantity(req.body).then(async (response) => {
        response.prototal = await userHelpers.getProductTotal(req.session.user, req.body.product)
        response.total = await userHelpers.getTotalAmount(req.session.user)
        res.json(response)
    })
})

router.post('/removeproduct', (req, res) => {
    userHelpers.removeProduct(req.body).then((response) => {
        res.json(response)
    })
})

router.post('/pincheck', async (req, res) => {
    let pin = req.body.pin
    let fetch_response = await fetch(`https://api.postalpincode.in/pincode/${pin}`)
    let json = await fetch_response.json();
    if (json[0].Message == 'No records found') {
        res.json({ pin: false })
    } else {
        let city = json[0].PostOffice[0].Name;
        let state = json[0].PostOffice[0].State;
        res.json({ city, state });
    }
})

router.get('/placeorder', verifyLogin, (req, res) => {
    let user = req.session.user;
    userHelpers.getCartProducts(user).then((response) => {
        userHelpers.getTotalAmount(user).then((total) => {
            res.render('user/placeorder', { user, total })
        })
    }).catch(() => {
        res.redirect('/')
    })
})

router.post('/placeorder', async (req, res) => {
    let user = req.session.user;
    req.body.userid = user;
    let address = {
        address: req.body.address,
        city: req.body.city,
        state: req.body.state,
        pin: req.body.pincode,
    }
    if (req.body.saveaddress === 'checked') {
        userHelpers.addAddress(address, user).then(()=>{})
    }
    let products = await userHelpers.getProductList(user)
    let totalPrice = await userHelpers.getTotalAmount(user);
    userHelpers.placeOrder(req.body, products, totalPrice).then((orderId) => {
        if(req.body.paymentmethod == "COD"){
            res.json({paySuccess:true})
        }else if(req.body.paymentmethod == 'Razorpay'){
            userHelpers.generateRazorpay(orderId, totalPrice).then((response)=>{
                res.json({response, razorpay:true})
            })
        }
    })
})

router.post('/verifypayment',(req,res)=>{
    console.log(req.body);
    userHelpers.verifyPayment(req.body).then(()=>{
        userHelpers.changePaymentStatus(req.body.order.response.receipt).then(()=>{
            res.json({status:true})
        })
    }).catch((err)=>{
        console.log(err);
        res.json({status:false})
})
})

router.get('/ordersuccess',(req,res)=>{
    res.render('user/ordersuccess')
})


router.get('/orders', verifyLogin, async(req, res) => {
    let user = req.session.user;
    let orders = await userHelpers.getAllOrders(user)
    res.render('user/orders', { user ,orders})
})

router.get('/cancelorder/:id',(req,res)=>{
    let id = req.params.id;
    userHelpers.cancelOrder(id).then(()=>{
        res.redirect('/orders')
    })
})

router.get('/profile', verifyLogin, (req, res) => {
    let user = req.session.user;
    res.render('user/profile', { user })
})



module.exports = router;