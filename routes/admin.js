var express = require('express');
var router = express();

const adminController = require('../controller/adminController');

router.set('views','views/admin');

//loading pages
router.get('/',adminController.loginLoad);
router.get('/dashboard',adminController.dashboardLoad);
router.get('/customers', adminController.customersLoad);
router.get('/products',adminController.productsLoad);
router.get('/category', adminController.categoryLoad);
router.get('/addProduct', adminController.addProductLoad);

//verify login
router.post('/',adminController.verifyLogin);


module.exports = router;
