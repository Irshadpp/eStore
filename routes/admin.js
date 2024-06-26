const express = require('express');
const router = express();

const adminAuth = require('../middlewares/adminAuth');
const adminController = require('../controller/adminController');
const upload = require('../util/imageUpload');

router.set('views','views/admin');

//loading pages
router.get('/', adminAuth.isLogout, adminController.loginLoad);
router.get('/dashboard', adminAuth.isLogin, adminController.dashboardLoad);
router.get('/customers', adminAuth.isLogin, adminController.customersLoad);
router.get('/products', adminAuth.isLogin, adminController.productsLoad);
router.get('/category', adminAuth.isLogin, adminController.categoryLoad);
router.get('/addProduct', adminAuth.isLogin, adminController.addProductLoad);
router.get('/editProduct/:product_id', adminAuth.isLogin, adminController.editProductLoad);
router.get('/editCategory/:category_id', adminAuth.isLogin, adminController.editCategoryLoad)

//verify login
router.post('/',adminController.verifyLogin);

//logout
router.get('/logout',adminController.logout);

//block user
router.put('/:userId/block',adminController.blockUser);


//add and edit product 
router.post('/addProduct', upload.uploadWithCropping('images', 4), adminController.addProduct);
router.post('/editProduct/:product_id', upload.uploadWithCropping('images', 4), adminController.editProduct);
//delete image from edit product
router.delete('/deleteImage/:imagePath', adminController.deleteImage);
//adding image in edit product


//add adn edit category
router.post('/category', adminController.addCategory);
router.post('/editCategory/:category_id', adminController.editcategory);

//list and unlist  category
router.put('/unlist/:categoryId', adminController.unlistCategory);
router.put('/list/:categoryId', adminController.listCategory);

//list, unlist and delete product
router.put('/products/list/:productId', adminController.listProduct);
router.delete('/products/delete/:productId', adminController.deleteProduct);

//orders
router.get('/orders', adminAuth.isLogin, adminController.ordresLoad);
router.get('/orderDetail/:order_id', adminAuth.isLogin, adminController.orderDetailLoad);
router.post('/changeStatus', adminAuth.isLogin, adminController.changeOrderStatus);
router.post('/returnProduct', adminAuth.isLogin, adminController.returnProduct)

// offer pagenation
router.get('/orders/:page', adminAuth.isLogin, adminController.orderPageLoad)

//coupon
router.get('/coupons', adminAuth.isLogin, adminController.couponsLaod)
router.get('/addCoupon', adminAuth.isLogin, adminController.addCouponLoad);
router.post('/addCoupon', adminAuth.isLogin, adminController.addCoupon);
router.delete('/deleteCoupon', adminAuth.isLogin, adminController.couponDelete);

//offer
router.get('/offer', adminAuth.isLogin, adminController.offerLoad);
router.get('/addOffer', adminAuth.isLogin, adminController.addOfferLoad);
router.post('/addOffer', adminAuth.isLogin, adminController.addOffer);
router.put('/activateOffer', adminAuth.isLogin, adminController.activateOffer);
router.put('/deactivateOffer', adminAuth.isLogin, adminController.deactivateOffer);


//report
router.get('/report', adminAuth.isLogin, adminController.reportLoad);
router.post('/report', adminAuth.isLogin, adminController.generateReport);

module.exports = router;
