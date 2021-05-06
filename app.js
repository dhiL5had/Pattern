require('dotenv').config()
const express = require('express')
const app = express()
const fs = require('fs')
const path = require('path')
const handlebars = require('handlebars'); 
const hbs = require('express-handlebars');
const userRouter = require('./routes/user')
const adminRouter = require('./routes/admin')
const fileUpload = require('express-fileupload')
const session = require('express-session')
const db = require('./config/connection')
const cookieParser = require('cookie-parser');
const cookieSession = require('cookie-session')
const passport = require('passport');
const { profile } = require('console');

require('./auth');

app.set('views',path.join(__dirname,'views'));
app.set('view engine','hbs');
app.engine('hbs', hbs({extname:'hbs',defaultLayout:'layout', layoutsDir:__dirname+'/views/layout/', partialsDir:__dirname+'/views/partials/'}));
app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(express.static(path.join(__dirname,'public')));
app.use(fileUpload());
app.use(cookieSession({ name:'Pattern-session',secret:"key",cookie:{maxAge:24 * 60 * 1000}}))
app.use(cookieParser())

app.use('/',userRouter)
app.use('/admin',adminRouter)

app.use(passport.initialize());
app.use(passport.session());

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