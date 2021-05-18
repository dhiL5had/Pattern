var express = require('express');
const userHelpers = require('../helpers/userHelpers');
const adminHelpers = require('../helpers/adminHelpers');
const productHelpers = require('../helpers/productHelpers');
const { check, validationResult } = require('express-validator');
var router = express.Router();
const jwt = require('jsonwebtoken');
require('dotenv').config();
const base64ToImage = require('base64-to-image');

const authenticateToken = (req, res, next) => {
    const token = req.cookies.JWT
    if (token == null) return res.redirect('/admin/adminlog')

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.redirect('/admin/adminlog')
        req.user = user;
        next()
    })
}


router.get('/', authenticateToken, (req, res) => {
    adminHelpers.productCount().then((proCount) => {
        adminHelpers.orderCount().then((orCount) => {
            adminHelpers.usersCount().then((userCount) => {
                res.render('admin/dashboard', {
                    admin: true, proCount, orCount, userCount
                })
            })
        })
    })
})

router.get('/adminlog', (req, res) => {
    const token = req.cookies.JWT
    if (token == null) return res.render('partials/admin-login', { adminlog: true })

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.render('partials/admin-login', { adminlog: true })
        req.user = user;
        res.redirect('/admin')
    })

})

router.post('/adminlog', (req, res) => {
    adminHelpers.adminLogin(req.body).then((response) => {
        if (response.status) {
            const token = jwt.sign({
                user: response.admin
            }, process.env.JWT_SECRET, { expiresIn: "1h" });
            res.cookie('JWT', token, {
                maxAge: 3600000,
                httpOnly: true,
            })
            res.redirect('/admin')
        } else {
            res.redirect('/admin/adminlog')
        }
    }).catch((response) => {
        res.redirect('/admin/adminlog')
    })
})

router.get('/adminout', (req, res) => {
    res.clearCookie('JWT');
    res.redirect('/admin/adminlog')
})

router.get('/products', authenticateToken, (req, res) => {
    productHelpers.getAllProducts().then((products) => {
        res.render('admin/products', {
            admin: true,
            products
        })
    })
})

router.get('/addproduct', authenticateToken, (req, res) => {
    productHelpers.getCategories().then((categories) => {
        res.render('admin/addproduct', { admin: true, categories })
    })
})

router.post('/addproduct',
    [
        check('Name').notEmpty(),
        check('Price').notEmpty(),
        check('Category').notEmpty(),
        check('Quantity').notEmpty(),
        check('Description').notEmpty(),
        check('viewImg1').notEmpty(),
        check('viewImg2').notEmpty(),
        check('viewImg3').notEmpty()
    ],
    (req, res) => {
        const errors = validationResult(req);
        if (errors.errors.length >= 1) {
            res.send({ error: 'Please check the form and enter data correctley' })
        } else {
            let data = {
                Name: req.body.Name,
                Category: req.body.Category,
                Quantity: parseInt(req.body.Quantity),
                Description: req.body.Description,
            }
            if (req.body.offerPrice !== '') {
                data.ActualPrice = parseInt(req.body.Price);
                data.Offer = parseInt(req.body.offer);
                data.Price = parseInt(req.body.offerPrice);
            } else {
                data.Price = parseInt(req.body.Price);
            }
            productHelpers.addProduct(data, (id) => {
                var path = './public/images/products/';
                var prop1 = { fileName: id + 1, type: "jpg" }
                var prop2 = { fileName: id + 2, type: "jpg" }
                var prop3 = { fileName: id + 3, type: "jpg" }

                var img1 = req.body.viewImg1;
                base64ToImage(img1, path, prop1)

                var img2 = req.body.viewImg2;
                base64ToImage(img2, path, prop2)

                var img3 = req.body.viewImg3;
                base64ToImage(img3, path, prop3)

                res.redirect('/admin/products')
            });
        }
    })

router.get('/editproduct/:id', authenticateToken, async (req, res) => {
    let product = await productHelpers.getProductDetails(req.params.id)
    productHelpers.getCategories().then((categories) => {
        res.render('admin/editproduct', {
            admin: true, product, categories
        })
    })
})

router.post('/editproduct/:id',
    [
        check('Name').notEmpty(),
        check('Price').isNumeric().notEmpty(),
        check('Category').notEmpty(),
        check('Quantity').notEmpty(),
        check('Description').notEmpty(),
    ],
    (req, res) => {
        const errors = validationResult(req);
        if (errors.errors.length >= 1) {
            res.send({ Error: 'please check the form and enter the data correctly' })
        } else {
            let data = {
                Name: req.body.Name,
                Category: req.body.Category,
                Quantity: parseInt(req.body.Quantity),
                Description: req.body.Description,
            }
            if (req.body.offer !== '' && req.body.offerPrice !== '' && req.body.offerPrice !== '0') {
                data.ActualPrice = parseInt(req.body.Price);
                data.Offer = parseInt(req.body.offer);
                data.Price = parseInt(req.body.offerPrice);
            } else {
                data.Price = parseInt(req.body.Price);
            }
            let id = req.params.id;
            productHelpers.updateProduct(data, id).then(() => {
                var path = './public/images/products/';
                var prop1 = { fileName: id + 1, type: "jpg" }
                var prop2 = { fileName: id + 2, type: "jpg" }
                var prop3 = { fileName: id + 3, type: "jpg" }
                if (req.body.viewImg1) {
                    var img1 = req.body.viewImg1;
                    base64ToImage(img1, path, prop1)
                }
                if (req.body.viewImg2) {
                    var img2 = req.body.viewImg2;
                    base64ToImage(img2, path, prop2)
                }
                if (req.body.viewImg3) {
                    var img3 = req.body.viewImg3;
                    base64ToImage(img3, path, prop3)
                }
                res.redirect('/admin/products');
            })
        }
    })

router.get('/deleteproduct/:id', (req, res) => {
    let proId = req.params.id;
    productHelpers.deleteProduct(proId).then(() => {
        res.redirect('/admin/products')
    })
})

router.get('/allusers', authenticateToken, async (req, res) => {
    adminHelpers.getAllUsers().then((users) => {
        for (let i = 0; i < users.length; i++) {
            if (users[i].State == 'true' || users[i].State == true) {

                users[i].valid = true;
            }
        }

        res.render('admin/allusers', { admin: true, users })
    })
})

router.post('/activateuser/:id', (req, res) => {
    adminHelpers.activateUser(req.params.id).then(() => {
        res.redirect('/admin/allusers')
    })

})

router.post('/blockuser/:id', (req, res) => {
    adminHelpers.blockUser(req.params.id).then(() => {
        res.redirect('/admin/allusers')
    })
})

router.get('/addcategory', authenticateToken, (req, res) => {
    productHelpers.getCategories().then((categories) => {
      
        res.render('admin/addcategory', { admin: true, categories })
    }).catch(() => {
            res.render('admin/addcategory', { admin: true })
        })
})

router.post('/addcategory', (req, res) => {
    productHelpers.addcategory(req.body).then(() => {
        res.redirect('/admin/addcategory')
    })
})

router.get('/deletecategory/:id', (req, res) => {
    productHelpers.deleteCategory(req.params.id).then(() => {
        res.redirect('/admin/addcategory')
    })
})

router.get('/allorders', authenticateToken, (req, res) => {
    adminHelpers.getAllOrders().then((orders) => {
        res.render('admin/orders', { admin: true, orders })
    })
})

router.post('/changestatus/', (req, res) => {
    let data = req.body.status.split(',')
    let [status, id] = data;
    adminHelpers.changeOrderStatus(id, status).then(() => {
        res.json({ changed: true })
    })
})

router.get('/orderedproducts/:id', async (req, res) => {
    let order = req.params.id;
    // userHelpers.getOrderProducts(order).then((products)=>{
    res.render('admin/orderedproducts', { admin: true })
    // })
})

router.get('/offers', authenticateToken, (req, res) => {
    productHelpers.getOfferProducts().then((offproducts) => {
        res.render('admin/offers', { admin: true, offproducts })
    })
})

router.get('/addoffer/:cat', authenticateToken, (req, res) => {
    let category = req.params.cat;

    res.render('admin/addoffer', { admin: true, category })
})

router.post('/catOffer/:cat', (req, res) => {
    let category = req.params.cat;
    let offer = parseInt(req.body.Offer);
    productHelpers.addCatOff(offer, category).then(() => {
        res.redirect('/admin/offers')
    })
})

router.get('/removeoffer/:cat', (req, res) => {
    console.log("Hello mr. perera");
    productHelpers.removeCatOff(req.params.cat).then(() => {
        res.redirect('/admin/addcategory')
    })
})

module.exports = router;