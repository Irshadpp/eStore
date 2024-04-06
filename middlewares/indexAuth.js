const asyncHandler = require('express-async-handler');
const User = require('../model/userdb');

const isLogin = asyncHandler( (req,res,next) =>{
    if(!req.session.user_id){
        res.redirect('/login')
    }else{
        next()
    }
});
const isHome = asyncHandler( (req,res,next) =>{
    if(!req.session.user_id){
        res.redirect('/')
    }else{
        next()
    }
});

const isLogout = asyncHandler( (req,res,next) =>{
    if(req.session.user_id){
        res.redirect('/home')
    }else{
        next()
    }
});


const isUserBlock = asyncHandler( async (req,res,next) => {

    const checkUser = await User.findById(req.session.user_id);

    if(checkUser.isBlock === true){
        req.session.user_id = null;
        res.redirect('/login');
    }else{
        next();
    }

});

module.exports = {
    isLogin,
    isLogout,
    isHome,
    isUserBlock
}
