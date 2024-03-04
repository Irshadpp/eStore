var express = require('express');
var router = express();
const passport = require('passport');
const indexController = require('../controller/indexController');
const indexAuth = require('../middlewares/indexAuth');



router.set('views','./views/user');

// indexpage loading
router.get('/', indexAuth.isLogout, indexController.loadIndex);


//login and signup loading
router.get('/login',indexAuth.isLogout, indexController.loadLogin);
router.get('/signup', indexAuth.isLogout, indexController.loadSignup);

router.get('/forgotPassword', indexAuth.isLogout, indexController.forgotPasswordLoad);
router.post('/forgotPassword', indexAuth.isLogout, indexController.handleForgotPassword);
router.get('/fPasswordOtp', indexAuth.isLogout, indexController.fPasswordOtpLoad);
router.post('/fPasswordOtp', indexAuth.isLogout, indexController.fPasswordVerifyOtp);
router.get('/changePassword', indexAuth.isLogout, indexController.changePasswordLoad);
router.post('/changePassword', indexAuth.isLogout, indexController.changePassword);


router.get('/product/:product_id', indexAuth.isLogin, indexAuth.isUserBlock, indexController.productLoad);

//user signup
router.post('/signup',indexController.signup);
router.get('/logout',indexController.loguot);

//sugnup with google
router.get('/google', passport.authenticate('google',{scope:['profile', 'email']}));
router.get('/google/callback', passport.authenticate('google', {failureRedirect: '/failed'}), indexController.googleLogin);

// otp load
router.get('/otp',indexController.otpLoad);
router.post('/verifyOTP', indexController.verifyOTP);
router.get('/resendOTP', indexController.resendOTP);

//home page load
router.get('/home', indexAuth.isLogin, indexAuth.isUserBlock, indexController.homeLoad);
router.get('/account', indexAuth.isLogin, indexAuth.isUserBlock, indexController.accountLoad);
router.get('/editAddress', indexAuth.isLogin, indexController.editAddressLoad);

//verify login
router.post('/login', indexController.verifyLogin);

//cart
router.get('/cart', indexAuth.isLogin, indexController.cartLoad);
router.get('/addToCart/:productId', indexController.addToCart);
router.post('/updateQuantity', indexAuth.isLogin, indexController.updateQuantity);
router.delete('/cart/deleteProduct/:productId', indexAuth.isLogin, indexController.deleteProduct)



router.get('/test',(req,res)=>{
    res.render('test');
})

module.exports = router;
