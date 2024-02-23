const asyncHandler = require('express-async-handler');
const bcrypt = require('bcrypt');

const Admin = require('../model/userdb');
const User = require('../model/userdb');
const Product = require('../model/productdb');
const Category = require('../model/categorydb');


//login load
const loginLoad = asyncHandler( async (req,res) => {
    res.render('login');
});

const logout = asyncHandler( async (req,res) =>{
    req.session.destroy();
    res.redirect('/admin');
})


//dashboard load
const dashboardLoad = asyncHandler( async (req,res) => {
    res.render('dashboard');
});

//customers load
const customersLoad = asyncHandler( async (req,res) => {
    const userData = await User.find({$and:[{isAdmin:false},{isVerified:true}]});
    res.render('customers',{users: userData});
});

const productsLoad = asyncHandler( async (req,res) => {
    const productData = await Product.find();
    const imagePathsArray = productData.map(product => product.imagePaths); 
    console.log("======================",imagePathsArray[0][1]);
    res.render('products',{products:productData,imagePathsArray});
});

const categoryLoad = asyncHandler( async (req,res) => {
    console.log("======================-------------------------");
    const categoryData = await Category.find();
    console.log("======================",categoryData);
    res.render('category',{categoryData});
});

const addProductLoad = asyncHandler( async (req,res) => {
    const categoryData = await Category.find();
    res.render('addProduct',{categoryData});
});

const editProductLoad = asyncHandler( async (req,res) =>{

    const product_id = req.params.product_id;
    const categoryData = await Category.find();
    
    const product = await Product.findOne({_id:product_id})

    res.render('editProduct',{categoryData,product});

})

const verifyLogin = asyncHandler( async (req,res) => {

    const { email, password } = req.body;
    
    const adminData = await Admin.findOne({email:email});
    if(adminData){
        
        if(adminData.isAdmin === true){
            
            const matchPassword = await bcrypt.compare(password, adminData.password);
            if(matchPassword){
                req.session.admin_id = adminData._id;
                res.redirect('/admin/dashboard');
            }else{
                res.render('login',{msg:"Wrong password!"});
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

    const categoryData = await Category.find();

    if (!req.files || req.files.length === 0) {
        return res.status(400).render('addProduct',{ warningMsg: 'No images uploaded!', categoryData});
    };


    const {productName, description, price, quantity, category} = req.body;
    const imagePaths = req.files.map(file => file.filename);


    if(description.trim() === ''){
        return res.status(400).render('addProduct',{warningMsg:"Please give product description!", categoryData});
    };

    if(productName.trim() === ''){
        return res.status(400).render('addProduct',{warningMsg:"Please give product name!", categoryData});
    };

    if(price < 1){
        return res.status(400).render('addProduct',{warningMsg:"Product price must be valid!", categoryData})
    };

    if(quantity < 1){
        return res.status(400).render('addProduct',{warningMsg:"Give product quantity!", categoryData});
    };


    const products = new Product({
        productName: productName,
        description: description,
        price: price,
        quantity: quantity,
        category: category,
        imagePaths: imagePaths,
    });

    var newProduct = await products.save();
    res.render('addProduct',{sucessMsg:"Product added successfully",categoryData});

});

const addCategory = asyncHandler( async (req,res) =>{

    const {categoryName, description} = req.body;

    const checkCategory = await Category.findOne({categoryName:categoryName});
    const categoryData = await Category.find();

    if(checkCategory){
        res.render('category',{msg:"Category already exist!",categoryData});
    }else{
        const category = new Category({
            categoryName:categoryName,
            description:description,
        })
    
        var newCategory = await category.save();
        res.redirect('/admin/category')
    }
});

const editProduct = asyncHandler( async (req,res) =>{

    const product_id = req.query.id;
    console.log('================================edit product',product_id)

    const {productName, description, price, quantity, category} = req.body;

    const productData = await Product.findByIdAndUpdate({_id:product_id},{$set:{productName: productName, description: description, price: price, quantity: quantity, category: category}});
    const categoryData = await Category.find();

    if(productData){
        res.render('editProduct', {msg:"Product edited sucessfully",product: productData, categoryData });
    }else{
        res.send("something went wrong");
    }
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
    editProductLoad,
    logout,
    editProduct,
}