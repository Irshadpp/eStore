const bcrypt = require('bcrypt');
const mongoose = require('mongoose')

const User = require('../model/userdb');
const OTP = require('../model/otpdb');
const Product = require('../model/productdb');
const Category = require('../model/categorydb');
const Cart = require('../model/cartdb');

const generateOTP = require('../util/generateOtp')
const asyncHandler = require('express-async-handler');
const sendEmail = require('../util/sendEmail');


const loadIndex = asyncHandler(async (req, res) => {

    const category = await Category.find();
    const products = await Product.find();;
    const imagePathsArray = products.map((item) => item.imagePaths);
    res.render('index', { products, category, imagePathsArray });
})

const loadLogin = async (req, res) => {
    try {
        res.render('login')
    } catch (error) {
        console.log(error.message);
    }
}

const forgotPasswordLoad = asyncHandler(async(req,res)=>{
    res.render('forgotPassword');
})

const loadSignup = async (req, res) => {
    try {
        res.render('signup')
    } catch (error) {
        console.log(error.message);
    }
}

const otpLoad = async (req, res) => {
    try {
        res.render('otp')
    } catch (error) {
        console.log(error.message);
    }
}

const homeLoad = asyncHandler(async (req, res) => {

    const userData = await User.findById(req.session.user_id);
    const products = await Product.aggregate([{
        $lookup: {
            from: "categories",
            localField: "category",
            foreignField: "categoryName",
            as: "categoryInfo"
        }
    },
    { $match: { $and: [{ "categoryInfo.list": true }, { list: true }] } }
    ]);

    const imagePathsArray = products.map((item) => item.imagePaths);
    res.render('home', { userData, products, imagePathsArray });

});

const productLoad = asyncHandler(async (req, res) => {

    const product_id = req.params.product_id;
    const product = await Product.findOne({ _id: product_id });
    const images = product.imagePaths
    if (!product) {
        return res.status(404).send("Product Not Found");
    }
    res.render('product', { product, images });

});

const accountLoad = asyncHandler((req, res) => {

    res.render('account');

});

const cartLoad = async (req,res)=>{
    try {
        const userId = new mongoose.Types.ObjectId(req.session.user_id);
        console.log('==========================',userId)
        const cartProducts = await Cart.aggregate([
            { $match: { userId: userId } },
            {$unwind:"$items"},
            {$lookup:{
                from:"products",
                localField: "items.productId",
                foreignField: "_id",
                as: "productDetails"
            }},
            {$unwind:"$productDetails"},
            {$project:{
                // "_id":0,
                "itemsId":"$items._id",
                "productId":"$productDetails._id",
                "productName":"$productDetails.productName",
                "price": "$productDetails.price",
                "image": {$arrayElemAt:["$productDetails.imagePaths", 0]},
                "quantity": "$items.quantity"
            }}
        ]);
        console.log('------------------------',cartProducts);
        res.render('cart',{cartProducts});
    } catch (error) {
        console.log(error);
        res.status(404).send("Page note Found");
    }
}

const editAddressLoad = async (req,res)=>{
    try {
        res.render('editAddress');
    } catch (error) {
        res.status(404).send("Page note Found");
    }
}

const loguot = asyncHandler((req, res) => {
    req.session.user_id = null;
    res.redirect('/login');
})


const securePassword = async (password) => {
    try {
        const hashPassword = await bcrypt.hash(password, 10);
        return hashPassword
    } catch (error) {
        console.log(error.message);
    }
}

const signup = async (req, res) => {
    try {
        if (/^[A-Za-z]+(?: [A-Za-z]+)?$/.test(req.body.username)) {
            if (/[A-Za-z0-9._%+-]+@gmail.com/.test(req.body.email)) {

                const { username, email, mobile, password } = req.body;
                const checkEmail = await User.findOne({ email: email });

                if (!checkEmail) {

                    const sPassword = await securePassword(password);
                    const users = new User({
                        username: username,
                        email: email,
                        mobile: mobile,
                        password: sPassword,
                        address: [],
                    })
                    var newUser = await users.save();

                    if (newUser) {
                        req.session.userSignup_id = newUser._id;
                        req.session.userSignup_email = newUser.email;
                        saveOTP(newUser, res);
                        res.redirect('/otp');
                    } else {
                        res.render('signup', { msg: "Signup failed" });
                    }

                } else {

                    const checkVerified = await User.findOne({ email: email }, { _id: 0, isVerified: 1 });
                    if (checkEmail && checkVerified.isVerified === false) {
                        req.session.userSignup_id = checkEmail._id
                        req.session.userSignup_email = checkEmail.email;
                        console.log()
                        saveOTP(checkEmail, res);
                        res.redirect('/otp');
                    } else {
                        res.render('signup', { msg: "Already have an accound in this email! Please login" });
                    }

                }

            } else {
                res.render('signup', { msg: "Invalid email structure!" });
            }
        } else {
            res.render('signup', { msg: "Give proper name!" });
        }
    } catch (error) {
        console.log(error.message);

    }
};

const googleLogin = async (req, res) => {
    try {

        const username = req.user.displayName;
        const email = req.user.emails[0].value;
        const googleId = req.user.id;

        const userCheck = await User.findOne({ email: email });
        if (userCheck) {
            req.session.user_id = userCheck._id;
            res.redirect('/home');
        } else {
            const users = new User({
                username: username,
                email: email,
                googleId: googleId,
                address: [],
            });

            const newUser = await users.save();
            if (newUser) {
                req.session.user_id = newUser._id;
                res.redirect('/home');
            }
        }
    } catch (error) {
        res.status(500).send(error.message);
    }
}

const saveOTP = asyncHandler(async ({ email }, res) => {

    const subjectt = 'eStore signup varification OTP';
    const message = 'Please verify your eStore account with OTP';
    const duration = 1;
    const createdOTP = await sendOtp({
        email,
        subjectt,
        message,
        duration
    })
})


const sendOtp = asyncHandler(async ({ email, subjectt, message, duration = 1 }) => {

    if (!(email && subjectt && message)) {
        throw Error("Provide values for email, subject, message");
    }

    //clear any old record
    await OTP.deleteOne({ email });

    //generate otp
    const generatedOTP = await generateOTP();

    //send email
    const mailOptions = {
        from: 'testerr92@outlook.com',
        to: email,
        subject: subjectt,
        html: `<p>${message}</p>
            <p>Your OTP is: ${generatedOTP}</p>`
    }
    await sendEmail(mailOptions);
    const newOTP = await new OTP({
        email: email,
        otp: generatedOTP,
        created_at: Date.now(),
        expiration_time: Date.now() + 90000,
    })
    const createdOTPRecord = await newOTP.save();
    return createdOTPRecord;
})

const verifyOTP = asyncHandler(async (req, res) => {

    const enteredOTP = parseInt(`${req.body.num1}${req.body.num2}${req.body.num3}${req.body.num4}${req.body.num5}${req.body.num6}`)

    const otpData = await OTP.findOne({ email: req.session.userSignup_email });

    console.log("=======================", req.session.userSignup_email);
    if (otpData) {
        if (otpData.otp === enteredOTP) {
            const verifyUser = await User.findOneAndUpdate({ _id: req.session.userSignup_id }, { $set: { isVerified: true } });

            if (verifyUser) {
                res.redirect('/login');
                req.session.destroy();
            }
        } else {
            res.render('otp', { msg: 'Please enter the correct OTP!' });
        }

    } else {
        res.render('otp', { msg: 'Something went wrong!' });
    }
})

const resendOTP = asyncHandler(async (req, res) => {
    const userData = await User.findOne({ _id: req.session.userSignup_id });
    saveOTP(userData);
    res.render('otp');
})


const verifyLogin = asyncHandler(async (req, res) => {

    const { email, password } = req.body;
    const userData = await User.findOne({ email: email });
    if (userData) {
        if (userData.isBlock === false) {
            if (userData["password"] === undefined) {
                return res.render('login', { msg: "You don't have account!" });
            }
            const passwordMatch = await bcrypt.compare(password, userData.password);

            if (passwordMatch) {

                if (userData.isVerified === true) {
                    req.session.user_id = userData._id;
                    req.session.isBlock = userData.isBlock;
                    res.redirect('/home');
                } else {
                    res.render('login', { msg: "Please verify your account with OTP!" })
                }

            } else {
                res.render('login', { msg: "Wrong password!" });
            }
        } else {
            res.render('login', { msg: "Access restricted!" });
        }
    } else {
        res.render('login', { msg: "Invalid email or you don't have account!" });
    }

});

const handleForgotPassword = async (req,re) =>{
    try {
        const email = req.body.email;
        const checkUser = await User.findOne({email:email});

        if(!checkUser){
            return res.status(500).render('forgotPassword',{warningMsg:"Invalid email or you don't have account!"})
        }

        res.redirect('')
    } catch (error) {
        
    }
}

const addToCart = async (req,res) => {
    try {

        console.log('===============================');
        const productId = req.params.productId;
        const user_id = req.session.user_id;
        
        const checkCart = await Cart.findOne({userId:user_id});

        if(checkCart){
            const existingItem = await Cart.findOne({$and:[{userId:user_id},{"items.productId":productId}]})
            if(existingItem){
                res.status(201).redirect('/cart');
            }else{
                await Cart.updateOne(
                    {userId:user_id},
                    {$push:{items:{productId:productId}}}
                );
                res.status(201).redirect('/cart');
            }
        }else{

            const cartProduct = new Cart({
                userId: user_id,
                items: [{productId}]
            });
            const newCartProduct = await cartProduct.save();
            res.status(201).redirect('/cart');
        }

    } catch (error) {
        res.status(500).send("Something went wrong with add to cart");
        console.log(error);
    }
}

const deleteProduct = async (req,res) =>{
    try {
        const productId = req.params.productId;
        const userId = req.session.user_id;

        const updatedCart = await Cart.findOneAndUpdate(
            {userId:userId},
            {$pull:{items:{productId:productId}}},
            {new:true}
            );
        
        res.render('cart',{cartProducts:updatedCart});
    } catch (error) {
        
    }
}

const updateQuantity = async (req,res) =>{
    try {

        console.log('========================================');
        const { cartItemId, newQuantity } = req.body;
        console.log('---------------------------------',cartItemId)
        const cartItem = await Cart.findByIdAndUpdate(
            {"items._id":cartItemId},
            {$set:{"items.$.quntity":newQuantity}},
            {new:true}
            );
        res.status(200).json({success: true, message:"Quantity updated successfully"})
    } catch (error) {
        res.status(500).json({message:"Something went wrong with update quantity"});
        console.log(error);
    }
}




module.exports = {
    loadIndex,
    loadLogin,
    forgotPasswordLoad,
    loadSignup,
    signup,
    googleLogin,
    otpLoad,
    loguot,
    productLoad,
    verifyOTP,
    resendOTP,
    verifyLogin,
    homeLoad,
    accountLoad,
    cartLoad,
    addToCart,
    deleteProduct,
    editAddressLoad,
    updateQuantity,
}