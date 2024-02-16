var express = require('express');
var router = express();
const indexController = require('../controller/indexController')


router.set('views','./views/user');
/* GET landing page. */
router.get('/',indexController.loadIndex);


//login and signup loading
router.get('/login',indexController.loadLogin);
router.get('/signup',indexController.loadSignup);


//user signup
router.post('/signup',indexController.signup);

// otp load
router.post('/otp',indexController.otpLoad)


module.exports = router;
