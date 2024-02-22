var express = require('express');
var router = express();

const adminController = require('../controller/adminController');
const upload = require('../util/imageUpload');

router.set('views','views/admin');

//loading pages
router.get('/',adminController.loginLoad);
router.get('/dashboard',adminController.dashboardLoad);
router.get('/customers', adminController.customersLoad);
router.get('/products',adminController.productsLoad);
router.get('/category', adminController.categoryLoad);
router.get('/addProduct', adminController.addProductLoad);
router.get('/editProduct/:product_id', adminController.editProductLoad);

//verify login
router.post('/',adminController.verifyLogin);

//block user
router.put('/:userId/block',adminController.blockUser);

//unblock user
router.put('/:userId/unblock',adminController.unblockUser);

//add product 
router.post('/addProduct', upload.array('images', 4), adminController.addProduct);

//add category
router.post('/category', adminController.addCategory);



module.exports = router;
