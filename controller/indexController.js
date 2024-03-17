"use strict";
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const moment = require('moment');

const User = require('../model/userdb');
const OTP = require('../model/otpdb');
const Product = require('../model/productdb');
const Category = require('../model/categorydb');
const Cart = require('../model/cartdb');
const Address = require('../model/addressdb');
const Order = require('../model/orderdb');
const Wishlist = require('../model/wishlistdb');

const generateOTP = require('../util/generateOtp')
const asyncHandler = require('express-async-handler');
const sendEmail = require('../util/sendEmail');


const loadIndex = asyncHandler(async (req, res) => {

    const category = await Category.find();
    const products = await Product.find().populate('categoryId');
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
    const productData = await Product.find({ list: true }).populate('categoryId');
    const products = productData.filter(product => product.categoryId.list === true)
    const imagePathsArray = products.map((item) => item.imagePaths);
    res.render('home', { userData, products, imagePathsArray });

});

const allProductsLoad = async (req, res) => {
    const productData = await Product.find().populate('categoryId');
    const products = productData.filter(product => product.list === true && product.categoryId.list === true);
    const categoryData = await Category.find();
    res.render('allProducts', { products, categoryData });
}

const productLoad = asyncHandler(async (req, res) => {

    const product_id = req.params.product_id;
    const product = await Product.findOne({ _id: product_id }).populate('categoryId');
    const images = product.imagePaths
    if (!product) {
        return res.status(404).send("Product Not Found");
    }
    res.render('product', { product, images });

});

const accountLoad = async (req, res) => {
    try {
        const orderData = await Order.find({ userId: req.session.user_id }).populate('products.productId');
        const userData = await User.findOne({ _id: req.session.user_id });
        await Address.find({ userId: req.session.user_id })
            .populate('userId')
            .then(addresses => {
                const addressData = addresses.flatMap(address => address.addresses);
                res.render('account', { userData, addressData, orderData });
            }).catch(error => {
                console.log(error)
            })

    } catch (error) {
        console.log(error)
    }
}


const addAddressLoad = asyncHandler(async (req, res) => {
    const checkAddress = await Address.findOne({ userId: req.session.user_id });
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
                    "total": "$items.total",
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
    try {
        const cart = await Cart.findOne({ userId: req.session.user_id }).populate('items.productId').exec();

        if (!cart) {
            console.log('Cart not found');
            return res.status(404).redirect('/cart');
        }


        const products = cart.items.map(item => ({
            productId: item.productId._id,
            productName: item.productId.productName,
            quantity: item.quantity,
            total: item.total,
        }));

        const subTotal = cart.subTotal;

        const addressData = await Address.findOne({ userId: req.session.user_id }, { addresses: 1, _id: 0 });

        res.render('checkout', { products, subTotal, address: addressData.addresses });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
})

const editAddressLoad = async (req, res) => {
    try {
        const addressId = req.params.addressId;
        const userId = req.session.user_id
        const addressCheck = await Address.findOne({ 'userId': userId, "addresses._id": addressId });
        const addressData = addressCheck.addresses.find(addrs => addrs._id.equals(addressId));
        res.render('editAddress', { addressData });
    } catch (error) {
        res.status(404).send("Page note Found");
        console.log(error)
    }
}


const editAddress = async (req, res) => {
    try {
        const addressId = req.params.addressId;
        const { name, address, landmark, city, pincode, email, mobile } = req.body;

        if (!(/^[A-Za-z]+(?: [A-Za-z]+)?$/.test(name))) {
            return res.render('addAddress', { nameMsg: "Give proper name!" });
        }

        if (address.trim() === '') {
            return res.render('addAddress', { addressMsg: "Address should not be empty!" });
        };

        if (landmark.trim() === '') {
            return res.render('addAddress', { landmarkMsg: "landmark should not be empty!" });
        };

        if (city.trim() === '') {
            return res.render('addAddress', { cityMsg: "city should not be empty!" });
        };

        if (pincode.trim() === '') {
            return res.render('addAddress', { pincodeMsg: "Give valid pincode!" });
        };

        if (!(/[A-Za-z0-9._%+-]+@gmail.com/.test(email))) {
            return res.render('addAddress', { emailMsg: "Give valid email!" });
        }

        if (mobile.trim() === '' && mobile.length < 10) {
            return res.render('addAddress', { mobileMsg: "Give valid mobile number!" });
        };

        await Address.updateOne(
            { userId: req.session.user_id, "addresses._id": addressId },
            {
                $set: {
                    "addresses.$.name": name,
                    "addresses.$.address": address,
                    "addresses.$.landmark": landmark,
                    "addresses.$.city": city,
                    "addresses.$.pincode": pincode,
                    "addresses.$.email": email,
                    "addresses.$.mobile": mobile,
                }
            }
        );

        res.redirect('/account')


    } catch (error) {
        res.status(500).json('error with editing address')
        console.log(error)
    }
}

const deleteAddress = async (req, res) => {
    try {
        const addressId = req.params.addressId;
        await Address.findOneAndUpdate(
            { userId: req.session.user_id },
            { $pull: { "addresses": { _id: addressId } } }
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
        const productData = await Product.findById(productId);
        const productPrice = productData.price;
        const user_id = req.session.user_id;

        const checkCart = await Cart.findOne({ userId: user_id });

        if (checkCart) {
            const existingItem = await Cart.findOne({ $and: [{ userId: user_id }, { "items.productId": productId }] })
            if (existingItem) {
                res.status(201).redirect('/cart');
            } else {

                const subTotal = checkCart.items.reduce((acc, crr) => {
                    return acc + crr.total;
                }, productPrice);


                await Cart.updateOne(
                    { userId: user_id },
                    {
                        $set: { subTotal: subTotal },
                        $push: { items: { productId: productId, total: productPrice } }
                    }
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
                items: [{ productId, total: productPrice }],
                subTotal: productPrice
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

        const cart = await Cart.findOne({ userId: userId });
        const cartData = await Cart.findOne(
            { "items.productId": productId },
            { _id: 0, "items.$": 1 }
        )

        const updatedSubTotal = cart.subTotal - cartData.items[0].total;
        const cartItemQty = cartData.items[0].quantity;

        const updatedCart = await Cart.findOneAndUpdate(
            { userId: userId },
            {
                $set: { subTotal: updatedSubTotal },
                $pull: { items: { productId: productId } }
            },
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
        const { cartItemId, newQuantity, productId, productPrice } = req.body;
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
            );

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

        const productData = cartItem.items.find(product => product.productId.equals(productId))
        const updatedProductPrice = productData.quantity * productPrice;

        const updatedCartItem = await Cart.findOneAndUpdate(
            { "items._id": cartItemId },
            { $set: { "items.$.total": updatedProductPrice } },
            { new: true }
        );

        const subTotalData = await Cart.findOne({ userId: req.session.user_id });
        const subTotal = subTotalData.items.reduce((acc, crr) => {
            return acc + crr.total
        }, 0);
        await Cart.updateOne(
            { userId: req.session.user_id },
            { $set: { subTotal: subTotal } }
        )
        res.status(200).json({ success: true, message: "Quantity updated successfully", updatedProductPrice, subTotal })
    } catch (error) {
        res.status(500).json({ message: "Something went wrong with update quantity" });
        console.log(error);
    }
}

const editProfile = async (req, res) => {
    try {
        const userId = req.params.userId
        if (!(/^[A-Za-z]+(?: [A-Za-z]+)?$/.test(req.body.name))) {
            return res.redirect('/account');
        }
        if (req.body.mobile < 10) {
            return res.render('/account');
        }
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
        res.redirect('/account');
    } catch (error) {
        console.log(error.message);
    }
}

const addAddress = async (req, res) => {
    try {
        const { name, address, landmark, city, pincode, email, mobile } = req.body;

        if (!(/^[A-Za-z]+(?: [A-Za-z]+)?$/.test(name))) {
            return res.render('addAddress', { nameMsg: "Give proper name!" });
        }

        if (address.trim() === '') {
            return res.render('addAddress', { addressMsg: "Address should not be empty!" });
        };

        if (landmark.trim() === '') {
            return res.render('addAddress', { landmarkMsg: "landmark should not be empty!" });
        };

        if (city.trim() === '') {
            return res.render('addAddress', { cityMsg: "city should not be empty!" });
        };

        if (pincode.trim() === '') {
            return res.render('addAddress', { pincodeMsg: "Give valid pincode!" });
        };

        if (!(/[A-Za-z0-9._%+-]+@gmail.com/.test(email))) {
            return res.render('addAddress', { emailMsg: "Give valid email!" });
        }

        if (mobile.trim() === '' && mobile.length < 10) {
            return res.render('addAddress', { mobileMsg: "Give valid mobile number!" });
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

        const checkAddress = await Address.findOne({ userId: req.session.user_id });

        if (checkAddress) {
            await Address.updateOne(
                { userId: req.session.user_id },
                { $push: { addresses: addressDoc } }
            );
        } else {
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
const placeOrder = async (req, res) => {

    try {
        const { address, productId, total, subTotal, quantity } = req.body;

        function generateOrderId(length) {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWZYZ0123456789';
            let id = '';
            for (let i = 0; i < length; i++) {
                const randomIndex = Math.floor(Math.random() * chars.length);
                id += chars.charAt(randomIndex);
            }
            return id;
        }

        const checkAddress = await Address.findOne({ userId: req.session.user_id }).populate('addresses');
        const addressData = checkAddress.addresses.find(addrs => addrs.address === address);


        let productDoc = [];
        if (Array.isArray(productId)) {
            productId.forEach((item, index) => {
                let productDocItem = {
                    productId: item,
                    quantity: parseInt(quantity[index]),
                    total: total[index],
                }

                productDoc.push(productDocItem);
            })
        } else {
            let productDocItem = {
                productId: productId,
                quantity: parseInt(quantity),
                total: total,
            }
            productDoc.push(productDocItem);
        }



        const order = new Order({
            userId: req.session.user_id,
            orderId: generateOrderId(6),
            products: productDoc,
            subTotal: subTotal,
            address: addressData
        })
        const newOrder = await order.save();
        await Cart.deleteOne({ userId: req.session.user_id });
        setTimeout(() => {
            res.redirect(`/orderDetails/${newOrder._id}`);
        }, 1000);


    } catch (error) {
        res.status(500).json('Internal server error');
        console.log(error)
    }
}


const orderDetailsLoad = async (req, res) => {
    const orderId = req.params.orderId;
    const orderData = await Order.findById(orderId).populate('products.productId userId');
    orderData.products.forEach(element => console.log(element.productId.productName))
    const orderDate = moment(orderData.date);
    const date = orderDate.format('DD-MM-YYYY');
    res.render('orderDetails', { orderData, date });
}

const cancelOrder = async (req, res) => {
    try {
        const productId = req.params.productId;
        const qty = req.body.qty;
        const order_id = req.body.order_id;
        await Order.updateOne(
            { $and: [{ _id: order_id }, { 'products.productId': productId }] },
            { $set: { "products.$.status": "Cancelled" } }
        );
        await Product.updateOne({ _id: productId }, { $inc: { quantity: qty } });
        res.json({
            success: true,
            message: 'order cancel successfull'
        })
    } catch (error) {
        console.log(error);
    }
}

const sortPopular = async (req, res) => {
    try {
        const products = await Product.find().sort({ createdAt: -1 }).limist(8);
        const categoryData = await Category.find();
        res.render('allProducts', { products, categoryData })
    } catch (error) {
        console.log(error)
    }
}

const sortNewArrivals = async (req, res) => {
    try {
        const products = await Product.find().sort({ createdAt: -1 }).limit(8);
        const categoryData = await Category.find();
        res.render('allProducts', { products, categoryData })
    } catch (error) {
        console.log(error)
    }
}

const sortAtoZ = async (req, res) => {
    try {
        const products = await Product.find().sort({ productName: 1 });
        const categoryData = await Category.find()
        res.render('allProducts', { products, categoryData });
    } catch (error) {
        console.log(error);
    }
}

const sortZtoA = async (req, res) => {
    try {
        const products = await Product.find().sort({ productName: -1 });
        const categoryData = await Category.find()
        res.render('allProducts', { products, categoryData });
    } catch (error) {
        console.log(error);
    }
}

const sortLowToHigh = async (req, res) => {
    try {
        const products = await Product.find().sort({ price: 1 });
        const categoryData = await Category.find()
        res.render('allProducts', { products, categoryData });
    } catch (error) {
        console.log(error);
    }
}

const sortHighToLow = async (req, res) => {
    try {
        const products = await Product.find().sort({ price: -1 });
        const categoryData = await Category.find()
        res.render('allProducts', { products, categoryData });
    } catch (error) {
        console.log(error);
    }
}

const filterCategory = async (req, res) => {
    try {
        const categories = req.body.categories;
        const products = await Product.find({ categoryId: { $in: categories.map(id => new mongoose.Types.ObjectId(id)) } }).lean()
        const categoryData = await Category.find()
        res.json({ products });
    } catch (error) {
        console.log(error)
    }
}

const wishlistLoad = async (req, res) => {
    try {
        const wishlistData = await Wishlist.find().populate('products.productId');
        res.render('wishlist', { wishlistData });
    } catch (error) {
        console.log(error);
        res.render('page404')
    }
}

const addtoWishlist = async (req, res) => {
    try {
        const productId = req.params.productId;
        const userId = req.session.user_id;
        let wishlistData = await Wishlist.findOne({ userId: userId });
        const checkProduct = await Wishlist.findOne({
            userId: userId,
            'products.productId': productId
        });
        if (checkProduct) {
            return res.redirect('/wishlist');
        }
        if (wishlistData) {
            wishlistData.products.push({ productId: productId });
            await wishlistData.save();
        } else {
            wishlistData = new Wishlist({
                userId: userId,
                products: [{ productId: productId }]
            });
            await wishlistData.save();
        }
        res.redirect('/wishlist')
    } catch (error) {
        console.log(error);
        res.render('page404');
    }
}

const removeProduct = async (req, res) => {
    try {
        const productId = req.body.productId;
        await Wishlist.findOneAndUpdate(
            { userId: req.session.user_id },
            { $pull: { products: { productId: productId } } }
        );
        res.json(200);
    } catch (error) {
        console.log(error);
        res.render('page404');
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
    allProductsLoad,
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
    placeOrder,
    orderDetailsLoad,
    cancelOrder,
    sortPopular,
    sortAtoZ,
    sortZtoA,
    sortNewArrivals,
    sortLowToHigh,
    sortHighToLow,
    filterCategory,
    wishlistLoad,
    addtoWishlist,
    removeProduct
}