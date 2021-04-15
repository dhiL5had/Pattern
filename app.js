var express = require('express')
var app = express()
var fs = require('fs')
var path = require('path')
var handlebars = require('handlebars'); 
var hbs = require('express-handlebars');
var userRouter = require('./routes/user')
var adminRouter = require('./routes/admin')
var fileUpload = require('express-fileupload')
var session = require('express-session')
var db = require('./config/connection')

app.set('views',path.join(__dirname,'views'));
app.set('view engine','hbs');
app.engine('hbs', hbs({extname:'hbs',defaultLayout:'layout', layoutsDir:__dirname+'/views/layout/', partialsDir:__dirname+'/views/partials/'}));
app.use(express.json())
app.use(express.urlencoded({extended: false}))
app.use(express.static(path.join(__dirname,'public')));
app.use(fileUpload())
app.use(session({secret:"key",cookie:{maxAge:6000000}}))

app.use('/',userRouter)
app.use('/admin',adminRouter)

app.use(function(req, res, next) {
    res.render('user/404')
  });

db.connect((err)=>{
    if(err){
        console.log("connection Erro "+err);
    }else{
        console.log("Database Connected Successfully");
    }
})

var port = (process.env.PORT || '3001');
app.listen(port,()=>{
})