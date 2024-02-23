const asyncHandler = require('express-async-handler');

const isLogin = asyncHandler( (req,res,next) =>{
    if(!req.session.user_id){
        res.redirect('/login')
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

// const isSignup = asyncHandler( (req,res,next) =>{
//     if(!req.session.userSignup_id){
//         res.redirect('/signup');
//     }
// })

const isUserBlock = asyncHandler( async (req,res,next) => {

    console.log("-------------------------",req.session.isBlock);
    if(req.session.isBlock === true){
        req.session.destroy();
        res.redirect('/login');
    }else{
        next();
    }

});

module.exports = {

    isLogin,
    isLogout,
    isUserBlock
}