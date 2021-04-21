var express = require('express');
const {
    response
} = require('../app');
const userHelpers = require('../helpers/userHelpers');
const adminHelpers = require('../helpers/adminHelpers')
const productHelpers = require('../helpers/productHelpers')
var router = express.Router();
const verifyLogin = (req, res, next) => {
    if (req.session.admin) {
        next()
    } else {
        res.redirect('/admin/adminlog')
    }
}

router.get('/', verifyLogin, (req, res) => {
    res.render('admin/dashboard', {
        admin: true
    })
})

router.get('/adminlog', (req, res) => {
    if (req.session.admin) {
        res.redirect('/admin')
    } else {
        res.render('partials/admin-login', {
            adminlog: true
        })
    }
    res.render('partials/admin-login', {
        adminlog: true
    })
})

router.post('/adminlog', (req, res) => {
    adminHelpers.adminLogin(req.body).then((response) => {
        if (response.status) {
            req.session.admin = response.admin;
            req.session.admin.loggedIn = true;
            res.redirect('/admin')
        } else {
            res.redirect('/admin/adminlog')
        }
    }).catch((response) => {
        console.log(response);
        res.redirect('/admin/adminlog')
    })
})

router.get('/adminout', (req, res) => {
    req.session.admin = null;
    res.redirect('/admin/adminlog')
})

router.get('/products', (req, res) => {
    productHelpers.getAllProducts().then((products) => {
        res.render('admin/products', {
            admin: true,
            products
        })
    })

})

router.get('/addproduct', (req, res) => {
    res.render('admin/addproduct', {
        admin: true
    })
})

router.post('/addproduct', (req, res) => {
    productHelpers.addProduct(req.body, (id) => {
        let image = req.files.image;
        console.log("image",image);
        image.mv('./public/products/' + id + '.jpg', (err) => {
            if (!err) {
                res.redirect("/admin/products")
            } else {
                console.log(err);
            }
        });
    });
})

router.get('/editproduct/:id', async(req, res) => {
    let product = await productHelpers.getProductDetails(req.params.id)
    res.render('admin/editproduct', {
        admin: true, product
    })
})

router.post('/editproduct/:id',(req,res)=>{
    let id = req.params.id;
    productHelpers.updateProduct(req.body,id).then(()=>{
        res.redirect('/admin/products')
        if(req.files.image){
            let image = req.files.image
            image.mv('./public/products/'+id+'.jpg')
        }
    })
})

router.get('/deleteproduct/:id',(req,res)=>{
    let proId = req.params.id;
    productHelpers.deleteProduct(proId).then(()=>{
        res.redirect('/admin/products')
    })
})

router.get('/allusers',async(req,res)=>{
    let users = await userHelpers.getAllUsers();
        res.render('admin/allusers',{admin:true,users})
})

router.post('/activateuser/:id',(req,res)=>{
    userHelpers.activateUser(req.params.id).then(()=>{
        res.redirect('/admin/allusers')
    })
 
})

router.post('/blockuser/:id',(req,res)=>{
    userHelpers.blockUser(req.params.id).then(()=>{
        res.redirect('/admin/allusers')
    })
})

module.exports = router;