const bcrypt = require('bcrypt');
const mongoose = require('mongoose')

const User = require('../model/userdb');
const OTP = require('../model/otpdb');
const Product = require('../model/productdb');
const Category = require('../model/categorydb');
const Cart = require('../model/cartdb');
const Address = require('../model/addressdb');

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

const forgotPasswordLoad = asyncHandler(async (req, res) => {
    res.render('forgotPassword');
});

const fPasswordOtpLoad = asyncHandler(async (req, res) => {
    res.render('fPasswordOtp');
});

const changePasswordLoad = asyncHandler(async (req, res) => {
    res.render('changePassword');
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

const accountLoad = asyncHandler(async (req, res) => {

    const userData = await User.findOne({_id:req.session.user_id});
    await Address.find({ userId: req.session.user_id })
    .populate('userId')
    .then(addresses=>{
    const addressData = addresses.flatMap(address => address.addresses); 
    res.render('account',{userData,addressData});
    }).catch(error=>{
        console.log(error)
    })
});


const addAddressLoad = asyncHandler(async (req, res) => {
    const checkAddress = await Address.findOne({userId:req.session.user_id});
    res.render('addAddress');
})

const cartLoad = async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.session.user_id);
        const cartProducts = await Cart.aggregate([
            { $match: { userId: userId } },
            { $unwind: "$items" },
            {
                $lookup: {
                    from: "products",
                    localField: "items.productId",
                    foreignField: "_id",
                    as: "productDetails"
                }
            },
            { $unwind: "$productDetails" },
            {
                $project: {
                    // "_id":0,
                    "itemsId": "$items._id",
                    "productId": "$productDetails._id",
                    "productName": "$productDetails.productName",
                    "price": "$productDetails.price",
                    "image": { $arrayElemAt: ["$productDetails.imagePaths", 0] },
                    "quantity": "$items.quantity"
                }
            }
        ]);

        const subTotal = cartProducts.reduce((acc, crr) => {
            return acc = acc + crr.price * crr.quantity;
        }, 0)

        res.render('cart', { cartProducts, subTotal });
    } catch (error) {
        console.log(error);
        res.status(404).send("Page note Found");
    }
}

const checkoutLoad = asyncHandler(async (req, res) => {
    res.render('checkout');
})

const editAddressLoad = async (req, res) => {
    try {
        const addressId = req.params.addressId;
        const userId = req.session.user_id
        const addressCheck = await Address.findOne({'userId': userId, "addresses._id":addressId});
        const addressData = addressCheck.addresses.find(addrs => addrs._id.equals(addressId));
        res.render('editAddress',{addressData});
    } catch (error) {    
        res.status(404).send("Page note Found");
        console.log(error)
    }
}


const editAddress = async (req,res) =>{
    try {
        const addressId = req.params.addressId;
        const { name, address, landmark, city, pincode, email, mobile } = req.body;

        if(!(/^[A-Za-z]+(?: [A-Za-z]+)?$/.test(name))){
            return res.render('addAddress',{nameMsg:"Give proper name!"});
        }

        if(address.trim() === ''){
            return res.render('addAddress',{addressMsg:"Address should not be empty!"});
        };

        if(landmark.trim() === ''){
            return res.render('addAddress',{landmarkMsg:"landmark should not be empty!"});
        };

        if(city.trim() === ''){
            return res.render('addAddress',{cityMsg:"city should not be empty!"});
        };

        if(pincode.trim() === ''){
            return res.render('addAddress',{pincodeMsg:"Give valid pincode!"});
        }; 
        
        if(!(/[A-Za-z0-9._%+-]+@gmail.com/.test(email))){
            return res.render('addAddress',{emailMsg:"Give valid email!"});
        }

        if(mobile.trim() === '' && mobile.length<10){
            return res.render('addAddress',{mobileMsg:"Give valid mobile number!"});
        };

        await Address.updateOne(
            {userId:req.session.user_id, "addresses._id":addressId},
            {$set:{
                "addresses.$.name": name,
                "addresses.$.address": address,
                "addresses.$.landmark": landmark,
                "addresses.$.city": city,
                "addresses.$.pincode": pincode,
                "addresses.$.email": email,
                "addresses.$.mobile": mobile,
            }}
            );

        res.redirect('/account')


    } catch (error) {
        res.status(500).json('error with editing address')
        console.log(error)
    }
}

const deleteAddress = async (req,res) =>{
    try {
        const addressId = req.params.addressId;
        await Address.findOneAndUpdate(
            {userId:req.session.user_id},
            {$pull:{"addresses":{_id:addressId}}}
        );
    res.redirect('/account')
    } catch (error) {
        console.log(error);
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

const handleForgotPassword = async (req, res) => {
    try {
        const email = req.body.email;
        const checkUser = await User.findOne({ email: email });

        if (!checkUser) {
            return res.status(500).render('forgotPassword', { warningMsg: "Invalid email or you don't have account!" })
        }
        req.session.fPasswordEmail = checkUser.email;

        const userData = await User.findOne({ email: req.session.fPasswordEmail });
        saveOTP(userData);
        res.redirect('/fPasswordOtp');

    } catch (error) {

    }
}

const fPasswordVerifyOtp = async (req, res) => {

    try {
        const enteredOTP = parseInt(`${req.body.num1}${req.body.num2}${req.body.num3}${req.body.num4}${req.body.num5}${req.body.num6}`)

        const otpData = await OTP.findOne({ email: req.session.fPasswordEmail });
        if (otpData) {
            if (otpData.otp === enteredOTP) {
                res.redirect('/changePassword');
            } else {
                res.render('fPasswordOtp', { msg: 'Please enter the correct OTP!' });
            }

        } else {
            res.render('fPasswordOtp', { msg: 'Something went wrong!' });
        }
    } catch (error) {
        res.status(500).json("error with verify otp in forgot password");

    }
}

const changePassword = async (req, res) => {
    const { password1, password2 } = req.body;
    if (password1 !== password2) {
        return res.render('changePassword', { msg: "Two password are not same!" });
    }
    const userData = await User.findOne({ email: req.session.fPasswordEmail });
    if (userData) {
        const sPassword = await securePassword(password1);
        const newUserData = await User.findOneAndUpdate(
            { email: req.session.fPasswordEmail },
            { $set: { password: sPassword } }
        );
        if (newUserData) {
            req.session.fPasswordEmail = null;
            res.redirect('login');
        } else {
            res.render('changePassword', { msg: "Password change faild!" });
        }
    } else {
        res.render('changePassword', { msg: "Something went wrong!" });
    }
}

const addToCart = async (req, res) => {
    try {

        const productId = req.params.productId;

        const user_id = req.session.user_id;

        const checkCart = await Cart.findOne({ userId: user_id });
        if (checkCart) {
            const existingItem = await Cart.findOne({ $and: [{ userId: user_id }, { "items.productId": productId }] })
            if (existingItem) {
                res.status(201).redirect('/cart');
            } else {
                await Cart.updateOne(
                    { userId: user_id },
                    { $push: { items: { productId: productId } } }
                );
                await Product.findOneAndUpdate(
                    { _id: productId },
                    { $inc: { quantity: -1 } }
                );
                res.status(201).redirect('/cart');
            }
        } else {


            const cartProduct = new Cart({
                userId: user_id,
                items: [{ productId }]
            });
            const newCartProduct = await cartProduct.save();

            await Product.findOneAndUpdate(
                { _id: productId },
                { $inc: { quantity: -1 } }
            );
            res.status(201).redirect('/cart');
        }

    } catch (error) {
        res.status(500).send("Something went wrong with add to cart");
        console.log(error);
    }
}

const deleteProduct = async (req, res) => {
    try {
        const productId = req.params.productId;
        const userId = req.session.user_id;

        const cartData = await Cart.findOne(
            { "items.productId": productId },
            { _id: 0, "items.$": 1 }
        )
        const cartItemQty = cartData.items[0].quantity;

        const updatedCart = await Cart.findOneAndUpdate(
            { userId: userId },
            { $pull: { items: { productId: productId } } },
            { new: true }
        );

        await Product.findOneAndUpdate(
            { _id: productId },
            { $inc: { quantity: cartItemQty } }
        )

        res.render('cart', { cartProducts: updatedCart });
    } catch (error) {
        res.status(500).json('Error occured with deleteProduct');
        console.log(error);
    }
}

const updateQuantity = async (req, res) => {
    try {
        const { cartItemId, newQuantity, productId } = req.body;
        const checkProduct = await Product.findOne({ _id: productId }, { _id: 0, quantity: 1 });

        if (checkProduct.quantity === 0) {
            return res.json('out of stock');
        }


        const oldQtyData = await Cart.findOne(
            { "items._id": cartItemId },
            { _id: 0, "items.$": 1 }
        );

        const oldQty = oldQtyData.items[0].quantity;


        if (parseInt(newQuantity) === oldQty) {
            return res.status(401).json('quantity limit exeeded');
        }
        if (oldQty < newQuantity) {
            await Product.findOneAndUpdate(
                { _id: productId },
                { $inc: { quantity: -1 } }
            )
        } else {
            await Product.findOneAndUpdate(
                { _id: productId },
                { $inc: { quantity: 1 } }
            )
        }



        const cartItem = await Cart.findOneAndUpdate(
            { "items._id": cartItemId },
            { $set: { "items.$.quantity": newQuantity } },
            { new: true }
        );



        res.status(200).json({ success: true, message: "Quantity updated successfully" })
    } catch (error) {
        res.status(500).json({ message: "Something went wrong with update quantity" });
        console.log(error);
    }
}

const editProfile = async (req, res) => {
    try {
        const userId = req.params.userId
        const userData = await User.findOneAndUpdate(
            { _id: userId },
            {
                $set:
                {
                    username: req.body.name,
                    mobile: req.body.mobile
                }
            }
        );
        const updatedUser = await User.findOne({ _id: userId });
        res.render('account', { userData: updatedUser });
    } catch (error) {
        console.log(error.message);
    }
}

const addAddress = async (req, res) => {
    try {
        const { name, address, landmark, city, pincode, email, mobile } = req.body;

        if(!(/^[A-Za-z]+(?: [A-Za-z]+)?$/.test(name))){
            return res.render('addAddress',{nameMsg:"Give proper name!"});
        }

        if(address.trim() === ''){
            return res.render('addAddress',{addressMsg:"Address should not be empty!"});
        };

        if(landmark.trim() === ''){
            return res.render('addAddress',{landmarkMsg:"landmark should not be empty!"});
        };

        if(city.trim() === ''){
            return res.render('addAddress',{cityMsg:"city should not be empty!"});
        };

        if(pincode.trim() === ''){
            return res.render('addAddress',{pincodeMsg:"Give valid pincode!"});
        }; 
        
        if(!(/[A-Za-z0-9._%+-]+@gmail.com/.test(email))){
            return res.render('addAddress',{emailMsg:"Give valid email!"});
        }

        if(mobile.trim() === '' && mobile.length<10){
            return res.render('addAddress',{mobileMsg:"Give valid mobile number!"});
        };

        const addressDoc = {
            name: name,
            address: address,
            landmark: landmark,
            city: city,
            pincode: pincode,
            email: email,
            mobile: mobile
        };

        const checkAddress = await Address.findOne({userId:req.session.user_id});

        if(checkAddress){
            await Address.updateOne(
                {userId:req.session.user_id},
                {$push:{addresses:addressDoc}}
                );
        }else{
                const newAddress = new Address({
                    userId: req.session.user_id,
                    addresses: [addressDoc]
                });
        
                await newAddress.save();
        }
       
        res.redirect('/account');
    } catch (error) {
        res.status(500).json(error.message);
        console.log(error);
    }

}



module.exports = {
    loadIndex,
    loadLogin,
    forgotPasswordLoad,
    fPasswordOtpLoad,
    handleForgotPassword,
    fPasswordVerifyOtp,
    changePasswordLoad,
    changePassword,
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
    addAddressLoad,
    editAddress,
    deleteAddress,
    cartLoad,
    addToCart,
    deleteProduct,
    addAddress,
    editAddressLoad,
    editProfile,
    updateQuantity,
    checkoutLoad,
}