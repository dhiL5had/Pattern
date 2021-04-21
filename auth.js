const passport = require('passport');

const GoogleStrategy = require('passport-google-oauth20').Strategy;
const facebookStrategy = require('passport-facebook').Strategy;
const userHelpers = require('./helpers/userHelpers');

passport.serializeUser((user,done)=>{
  done(null,user.id)
})

passport.deserializeUser((id,done)=>{
  done(null,id)
})


passport.use(new GoogleStrategy({
    clientID:process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL:"http://localhost:3001/google/cb",
    passReqToCallback:true
  },
  function(request,accessToken, refreshToken, profile,done) {
       var userData ={
         Name: profile._json.name,
         Email:profile._json.email,
       }
       userHelpers.googleSignup(userData).then((response)=>{
       return done(null,response)
       })
      }
));

passport.use(new facebookStrategy({

  clientID:process.env.FACEBOOK_APPID,
  clientSecret:process.env.FACEBOOK_APPSECRET,
  callbackURL:"http://localhost:3001/facebook/cb",
  profileFields:['id','displayName','name','gender','email']
},
function(token, refreshToken, profile, done){
  return done(null,profile)
}
))