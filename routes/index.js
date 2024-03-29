var express = require('express');
var router = express();
const passport = require('passport');
const indexController = require('../controller/indexController');
const indexAuth = require('../middlewares/indexAuth');
const orderdb = require('../model/orderdb');



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


router.get('/product/:product_id', indexController.productLoad);

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
router.get('/home', indexController.homeLoad);

router.get('/products', indexController.allProductsLoad)
router.get('/account', indexAuth.isLogin, indexAuth.isUserBlock, indexController.accountLoad);
router.get('/editAddress', indexAuth.isLogin, indexController.editAddressLoad);

//verify login
router.post('/login', indexController.verifyLogin);

//cart
router.get('/cart', indexAuth.isLogin, indexController.cartLoad);
router.get('/addToCart/:productId', indexAuth.isLogin, indexAuth.isUserBlock, indexController.addToCart);
router.post('/updateQuantity', indexAuth.isLogin, indexController.updateQuantity);
router.delete('/cart/deleteProduct/:productId', indexAuth.isLogin, indexController.deleteProduct);

router.get('/addAddress', indexAuth.isLogin, indexAuth.isUserBlock, indexController.addAddressLoad);
router.post('/addAddress', indexAuth.isLogin, indexAuth.isUserBlock, indexController.addAddress);
router.get('/editAddress/:addressId', indexAuth.isLogin, indexAuth.isUserBlock, indexController.editAddressLoad);
router.post('/editAddress/:addressId', indexAuth.isLogin, indexAuth.isUserBlock, indexController.editAddress);
router.get('/deleteAddress/:addressId',indexAuth.isLogin, indexAuth.isUserBlock, indexController.deleteAddress)

//checkout and place order
router.get('/checkout', indexAuth.isLogin, indexAuth.isUserBlock, indexController.checkoutLoad);
router.post('/checkout', indexAuth.isLogin, indexAuth.isUserBlock, indexController.placeOrder);
router.post('/verifyOrder', indexAuth.isLogin, indexAuth.isUserBlock, indexController.verifyOrder)
router.get('/orderDetails/:orderId', indexAuth.isLogin, indexAuth.isUserBlock, indexController.orderDetailsLoad);
router.put('/cancelOrder/:productId', indexAuth.isLogin, indexAuth.isUserBlock, indexController.cancelOrder);
router.post('/returnProduct', indexAuth.isLogin, indexAuth.isUserBlock, indexController.returnProduct);

//download invoice
router.get('/downloadInvoice', indexAuth.isLogin, indexAuth.isUserBlock, indexController.downloadInvoice);

router.post('/editProfile/:userId', indexAuth.isLogin, indexAuth.isUserBlock, indexController.editProfile);

// sort
router.get('/popular', indexController.sortPopular);
router.get('/products/newArrivals', indexController.sortNewArrivals);
router.get('/products/aToZ', indexController.sortAtoZ);
router.get('/products/zToA', indexController.sortZtoA);
router.get('/products/lowToHigh', indexController.sortLowToHigh);
router.get('/products/highToLow', indexController.sortHighToLow);

//filter
router.post('/filterCategory', indexController.filterCategory);

//search
router.get('/search', indexController.search);

//wishlist
router.get('/wishlist',indexAuth.isLogin, indexAuth.isUserBlock, indexController.wishlistLoad);
router.get('/addToWishlist/:productId', indexAuth.isLogin, indexAuth.isUserBlock, indexController.addtoWishlist);
router.put('/removeProduct', indexAuth.isLogin, indexAuth.isUserBlock, indexController.removeProduct);

//coupon
router.post('/couponCheck', indexAuth.isLogin, indexAuth.isUserBlock, indexController.couponCheck);


router.get('/test',(req,res)=>{
    res.render('test');
})

module.exports = router;
