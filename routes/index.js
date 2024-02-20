var express = require('express');
var router = express();
const indexController = require('../controller/indexController');
const indexAuth = require('../middlewares/indexAuth')



router.set('views','./views/user');

// indexpage loading
router.get('/',indexController.loadIndex);


//login and signup loading
router.get('/login',indexController.loadLogin);
router.get('/signup',indexController.loadSignup);


//user signup
router.post('/signup',indexController.signup);

// otp load
router.get('/otp',indexController.otpLoad);
router.post('/verifyOTP',indexController.verifyOTP);
router.get('/resendOTP',indexController.resendOTP);

//home page load
router.get('/home', indexAuth.isUserBlock, indexController.homeLoad);

//verify login
router.post('/login', indexController.verifyLogin);




module.exports = router;
