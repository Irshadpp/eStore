const asyncHandler = require('express-async-handler');

const isLogin = asyncHandler( (req,res,next) =>{
    if(!req.session.admin_id){
        res.redirect('/admin')
    }else{
        next()
    }
});

const isLogout = asyncHandler( (req,res,next) =>{
    if(req.session.admin_id){
        res.redirect('/admin/dashboard')
    }else{
        next()
    }
});


module.exports = {
    isLogin,
    isLogout
}