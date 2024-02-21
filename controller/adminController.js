const asyncHandler = require('express-async-handler');
const bcrypt = require('bcrypt');
const path = require('path')

const Admin = require('../model/userdb');
const User = require('../model/userdb');
const Product = require('../model/productdb');
const Category = require('../model/categorydb');


//login load
const loginLoad = asyncHandler( async (req,res) => {
    res.render('login');
})

//dashboard load
const dashboardLoad = asyncHandler( async (req,res) => {
    res.render('dashboard');
});

//customers load
const customersLoad = asyncHandler( async (req,res) => {
    const userData = await User.find({isAdmin:false});
    res.render('customers',{users: userData});
});

const productsLoad = asyncHandler( async (req,res) => {
    const productData = await Product.find();
    const imagePathsArray = productData.map(product => product.imagePaths); 
    // console.log("======================",productData.productName);
    res.render('products',{products:productData,imagePaths:imagePathsArray});
});

const categoryLoad = asyncHandler( async (req,res) => {
    const categoryData = await Category.find();
    res.render('category',{categories:categoryData});
});

const addProductLoad = asyncHandler( async (req,res) => {
    const categoryData = await Category.find();
    res.render('addProduct',{categories:categoryData});
});

const verifyLogin = asyncHandler( async (req,res) => {

    const { email, password } = req.body;
    
    const adminData = await Admin.findOne({email:email});
    if(adminData){
        
        if(adminData.isAdmin === true){
            
            const matchPassword = bcrypt.compare(password, adminData.password);
            if(matchPassword){
                req.session.admin_id = adminData._id;
                res.redirect('/admin/dashboard');
            }

        }else{
            res.render('login',{msg:"Sorry your not an admin"});
        }

    }else{
        res.render('login',{msg:"Couldn't find your email!"});
    }

});

const blockUser = asyncHandler( async (req,res) => {
    const userId = req.params.userId;
    await User.findByIdAndUpdate(userId,{isBlock:true});
});

const unblockUser = asyncHandler( async (req,res) => {
    const userId = req.params.userId;
    await User.findByIdAndUpdate(userId,{isBlock:false});
});



const addProduct = asyncHandler( async (req,res) => {

    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'No files uploaded' });
    }

    const {productName, description, price, quantity, category} = req.body;
    const imagePaths = req.files.map(file => file.path);

    const products = new Product({
        productName: productName,
        description: description,
        price: price,
        quantity: quantity,
        category: category,
        imagePaths: imagePaths,
    });

    var newProduct = await products.save();
    console.log("======================",newProduct.imagePaths);
    const categoryData = await Category.find();
    res.render('addProduct',{categories:categoryData})

});

const addCategory = asyncHandler( async (req,res) =>{

    const {categoryName, description} = req.body;

    const category = new Category({
        categoryName:categoryName,
        description,
    })

    var newCategory = await category.save();
    res.render('category')

})

module.exports = {
    loginLoad,
    verifyLogin,
    dashboardLoad,
    customersLoad,
    productsLoad,
    categoryLoad,
    addProductLoad,
    blockUser,
    unblockUser,
    addProduct, 
    addCategory,

}