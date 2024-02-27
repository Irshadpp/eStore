var express = require('express');
var router = express();
const indexController = require('../controller/indexController');
const indexAuth = require('../middlewares/indexAuth');



router.set('views','./views/user');

// indexpage loading
router.get('/', indexAuth.isLogout, indexController.loadIndex);


//login and signup loading
router.get('/login',indexAuth.isLogout, indexController.loadLogin);
router.get('/signup', indexAuth.isLogout, indexController.loadSignup);

router.get('/product/:product_id', indexAuth.isLogin, indexAuth.isUserBlock, indexController.productLoad);

//user signup
router.post('/signup',indexController.signup);
router.get('/logout',indexController.loguot);

// otp load
router.get('/otp',indexController.otpLoad);
router.post('/verifyOTP', indexController.verifyOTP);
router.get('/resendOTP', indexController.resendOTP);

//home page load
router.get('/home', indexAuth.isLogin, indexAuth.isUserBlock, indexController.homeLoad);
router.get('/profile', indexAuth.isLogin, indexAuth.isUserBlock, indexController.profileLoad);

//verify login
router.post('/login', indexController.verifyLogin);





router.get('/test',(req,res)=>{
    res.render('test');
})

module.exports = router;
