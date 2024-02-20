const asyncHandler = require('express-async-handler');
const Admin = require('../model/userdb');
const User = require('../model/userdb')
const bcrypt = require('bcrypt')

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
    const userData = await User.find({isAdmin:0});
    console.log(userData[0].email)
    res.render('customers',{users: userData});
});

const productsLoad = asyncHandler( async (req,res) => {
    res.render('products');
});

const categoryLoad = asyncHandler( async (req,res) => {
    res.render('category');
});

const addProductLoad = asyncHandler( async (req,res) => {
    res.render('addProduct');
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

})



module.exports = {
    loginLoad,
    verifyLogin,
    dashboardLoad,
    customersLoad,
    productsLoad,
    categoryLoad,
    addProductLoad,
}