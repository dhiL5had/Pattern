var express = require('express');
const {response} = require('../app');
const multer = require('multer')
const path = require('path')
const userHelpers = require('../helpers/userHelpers');
const adminHelpers = require('../helpers/adminHelpers')
const {check , validationResult} = require('express-validator');
const productHelpers = require('../helpers/productHelpers')
var router = express.Router();
const base64ToImage = require('base64-to-image');
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
    productHelpers.getCategories().then((categories)=>{
    res.render('admin/addproduct', {admin: true,categories})
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
     req.body.Price = parseInt(req.body.Price)
     req.body.Quantity = parseInt(req.body.Quantity)

    const errors = validationResult(req);
    if(errors.errors.length >=1){
        res.redirect('/admin/addproduct',{err:'Please try again'})
    }else{
        let data = {
            Name :req.body.Name,
            Price:req.body.Price,
            Category:req.body.Category,
            Quantity:req.body.Quantity,
            Description:req.body.Description,
        }
    productHelpers.addProduct(data, (id) => {
        var path = './public/images/products/';
        var prop1 = { fileName:id+1, type:"jpg"}
        var prop2 = { fileName:id+2, type:"jpg"}
        var prop3 = { fileName:id+3, type:"jpg"}

        var img1 = req.body.viewImg1;
        base64ToImage(img1,path,prop1)

        var img2 = req.body.viewImg2;
        base64ToImage(img2,path,prop2)

        var img3 = req.body.viewImg3;
        base64ToImage(img3,path,prop3)

        res.redirect('/admin/products')
    });
}
})

router.get('/editproduct/:id', async(req, res) => {
    let product = await productHelpers.getProductDetails(req.params.id)
    productHelpers.getCategories().then((categories)=>{
    res.render('admin/editproduct', {
        admin: true, product,categories
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
    if(errors.errors.length >=1){
        res.redirect('/admin/addproduct')
    }else{
        let data = {
            Name :req.body.Name,
            Price:req.body.Price,
            Category:req.body.Category,
            Quantity:req.body.Quantity,
            Description:req.body.Description,
        }
    let id = req.params.id;
    productHelpers.updateProduct(data,id).then(()=>{
        var path = './public/images/products/';
        var prop1 = { fileName:id+1, type:"jpg"}
        var prop2 = { fileName:id+2, type:"jpg"}
        var prop3 = { fileName:id+3, type:"jpg"}
        if(req.body.viewImg1){
            var img1 = req.body.viewImg1;
            base64ToImage(img1,path,prop1)
        }
        if(req.body.viewImg2){
            var img2 = req.body.viewImg2;
            base64ToImage(img2,path,prop2)
        }
        if(req.body.viewImg3){
            var img3 = req.body.viewImg3;
            base64ToImage(img3,path,prop3)
        }
        res.redirect('/admin/products');
    })
    }
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

router.get('/addcategory',(req,res)=>{
    productHelpers.getCategories().then((categories)=>{
    res.render('admin/addcategory',{admin:true,categories})
    }).catch(()=>{
        res.render('admin/addcategory',{admin:true})
    })
})

router.post('/addcategory',(req,res)=>{
    productHelpers.addcategory(req.body).then(()=>{
        res.redirect('/admin/addcategory')
    })
})

router.get('/deletecategory/:id',(req,res)=>{
    productHelpers.deleteCategory(req.params.id).then(()=>{
        res.redirect('/admin/addcategory')
    })
})
module.exports = router;