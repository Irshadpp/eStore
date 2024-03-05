require('dotenv').config();
const session = require('express-session');

const passport = require('passport');

const googleStrategy = require('passport-google-oauth2');

passport.serializeUser(function(user, done){
    done(null,user);
});

passport.deserializeUser(function(user, done){
    done(null,user);
})

passport.use(new googleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_SECRET_ID,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
    passReqToCallback: true
},function(request, accessToken, refreshToken, profile, done){
    return done(null,profile);
}
));