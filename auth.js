const passport = require('passport');

const GoogleStrategy = require('passport-google-oauth20').Strategy;
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
