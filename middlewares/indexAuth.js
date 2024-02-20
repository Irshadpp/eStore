const asyncHandler = require('express-async-handler')

const isUserBlock = asyncHandler( async (req,res,next) => {

    console.log("-----------------",req.session.user_id);
    if(req.session.isBlock === true){
        session.destroy();
        res.redirect('/login');
    }else{
        next();
    }

});

module.exports = {
    isUserBlock
}