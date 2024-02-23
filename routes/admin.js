var express = require('express');
var router = express();

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

//verify login
router.post('/',adminController.verifyLogin);

//logout
router.get('/logout',adminController.logout);

//block user
router.put('/:userId/block',adminController.blockUser);

//unblock user
router.put('/:userId/unblock',adminController.unblockUser);

//add and edit product 
router.post('/addProduct', upload.array('images', 4), adminController.addProduct);
router.post('/editProduct', adminController.editProduct);

//add category
router.post('/category', adminController.addCategory);



module.exports = router;
