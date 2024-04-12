"use strict";
require('dotenv').config();
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const moment = require("moment");
const razorpay = require("razorpay");
const crypto = require("crypto");
const easyinvoice = require("easyinvoice");

const razorpayInstance = new razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const User = require("../model/userdb");
const OTP = require("../model/otpdb");
const Product = require("../model/productdb");
const Category = require("../model/categorydb");
const Cart = require("../model/cartdb");
const Address = require("../model/addressdb");
const Order = require("../model/orderdb");
const Wishlist = require("../model/wishlistdb");
const Coupon = require("../model/coupondb");

const generateOTP = require("../util/generateOtp");
const sendEmail = require("../util/sendEmail");
const { log } = require("console");

const loadIndex = async (req, res) => {
  try {
    const category = await Category.find();
    const products = await Product.find().populate("categoryId");
    const imagePathsArray = products.map((item) => item.imagePaths);
    res.render("index", { products, category, imagePathsArray });
  } catch (error) {
    res.render("page404");
  }
};

const loadAbout = async (req, res) => {
  try {
    res.render("about");
  } catch (error) {
    res.render("page404");
  }
};

const loadContact = async (req, res) => {
  try {
    res.render("contact");
  } catch (error) {
    res.render("page404");
  }
};

const loadLogin = async (req, res) => {
  try {
    res.render("login");
  } catch (error) {
    res.render("page404");
  }
};

const forgotPasswordLoad = async (req, res) => {
  try {
    res.render("forgotPassword");
  } catch (error) {
    res.render("page404");
  }
};

const fPasswordOtpLoad = async (req, res) => {
  try {
    res.render("fPasswordOtp");
  } catch (error) {
    res.render("page404");
  }
};

const changePasswordLoad = async (req, res) => {
  try {
    res.render("changePassword");
  } catch (error) {
    res.render("page404");
  }
};

const loadSignup = async (req, res) => {
  try {
    res.render("signup");
  } catch (error) {
    res.render("page404");
  }
};

const otpLoad = async (req, res) => {
  try {
    res.render("otp");
  } catch (error) {
    res.render("page404");
  }
};

const homeLoad = async (req, res) => {
  try {
    const userData = await User.findById(req.session.user_id);
    const productData = await Product.find({
      $and: [{ list: true }, { quantity: { $gt: 0 } }],
    })
      .populate({
        path: "categoryId",
        populate: "offerId",
      })
      .populate("offerId");

    const products = productData.filter(
      (product) => product.categoryId.list === true
    );
    const imagePathsArray = products.map((item) => item.imagePaths);
    res.render("home", { userData, products, imagePathsArray });
  } catch (error) {
    res.render("page404");
  } 
};

const allProductsLoad = async (req, res) => {
  try {
    const productData = await Product.find()
      .populate({
        path: "categoryId",
        populate: "offerId",
      })
      .populate("offerId");
    const products = productData.filter(
      (product) =>
        product.list === true &&
        product.categoryId.list === true &&
        product.quantity > 0
    );
    const categoryData = await Category.find();
    return res.render("allProducts", {
      products,
      categoryData,
    });
  } catch (error) {
    res.render("page404");
  }
};

const productLoad = async (req, res) => {
  try {
    const product_id = req.params.product_id;
    const product = await Product.findOne({ _id: product_id })
      .populate({
        path: "categoryId",
        populate: "offerId",
      })
      .populate("offerId");
    const images = product.imagePaths;
    if (!product) {
      return res.render("page404");
    }
    res.render("product", { product, images });
  } catch (error) {
    res.render("page404");
  }
};

const accountLoad = async (req, res) => {
  try {
    const orderData = await Order.find({ userId: req.session.user_id })
      .sort({ date: -1 })
      .populate("products.productId");
    const userData = await User.findOne({ _id: req.session.user_id });
    const addresses = await Address.find({
      userId: req.session.user_id,
    }).populate("userId");
    const addressData = addresses.flatMap((address) => address.addresses);
    const couponData = await Coupon.find();
    const sortedHistory = userData.walletHistory.sort((a, b) => {
      return new Date(b._id.getTimestamp()) - new Date(a._id.getTimestamp());
    });

    const transactionData = sortedHistory.map((transaction) => {
      const transactionObj = transaction.toObject();

      const date = new Date(transactionObj.date);

      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();

      transactionObj.date = `${day}-${month}-${year}`;

      return transactionObj;
    });

    const formattedOfferData = couponData.map((coupon) => {
      const formattedDate = new Date(coupon.expiryDate)
        .toLocaleDateString("en-GB")
        .split("/")
        .join("-");
      return {
        ...coupon.toObject(),
        expiryDate: formattedDate,
      };
    });

    res.render("account", {
      userData,
      addressData,
      orderData,
      couponData : formattedOfferData,
      transactionData,
    });
  } catch (error) {
    res.render("page404");
  }
};

const addAddressLoad = async (req, res) => {
  try {
    const checkAddress = await Address.findOne({ userId: req.session.user_id });
    res.render("addAddress");
  } catch (error) {
    res.render("page404");
  }
};

const cartLoad = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.session.user_id);
    const cartProducts = await Cart.findOne({ userId: userId })
      .populate({
        path: "items.productId",
        populate: {
          path: "categoryId",
          populate: {
            path: "offerId",
            model: "Offer",
          },
        },
      })
      .populate({
        path: "items.productId",
        populate: {
          path: "offerId",
          model: "Offer",
        },
      });

    let subTotal = 0;
    if (cartProducts !== null) {
      subTotal = cartProducts.items.reduce((acc, crr, index) => {
        let price;
        if (
          cartProducts.items[index].productId.offerId &&
          cartProducts.items[index].productId.offerId.status === "active"
        ) {
          price =
            crr.productId.price -
            (crr.productId.price *
              cartProducts.items[index].productId.offerId.percentage) /
              100;
        } else if (
          cartProducts.items[index].productId.categoryId.offerId &&
          cartProducts.items[index].productId.categoryId.offerId.status ===
            "active"
        ) {
          price =
            crr.productId.price -
            (crr.productId.price *
              cartProducts.items[index].productId.categoryId.offerId
                .percentage) /
              100;
        } else {
          price = crr.productId.price;
        }
        return (acc = acc + price * crr.quantity);
      }, 0);
    }
    res.render("cart", { cartProducts: cartProducts ? cartProducts.items : [], subTotal });
  } catch (error) {
    console.error(error);
    res.render("page404");
  }
};


const checkoutLoad = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.session.user_id })
      .populate({
        path: "items.productId",
        populate: {
          path: "categoryId",
          populate: {
            path: "offerId",
            model: "Offer",
          },
        },
      })
      .populate({
        path: "items.productId",
        populate: {
          path: "offerId",
          model: "Offer",
        },
      });

    if (!cart) {
      return res.status(404).redirect("/cart");
    }

    async function getProductPrice(item) {
      const checkOffer = await Product.findOne({ _id: item.productId })
        .populate({
          path: "categoryId",
          populate: { path: "offerId", model: "Offer" },
        })
        .populate({ path: "offerId", model: "Offer" });

      let price;
      if (checkOffer.offerId && checkOffer.offerId.status === "active") {
        price =
          checkOffer.price -
          (checkOffer.price * checkOffer.offerId.percentage) / 100;
      } else if (
        checkOffer.categoryId.offerId &&
        checkOffer.categoryId.offerId.status === "active"
      ) {
        price =
          checkOffer.price -
          (checkOffer.price * checkOffer.categoryId.offerId.percentage) / 100;
      } else {
        price = checkOffer.price;
      }

      return price;
    }

    async function resolveProductPrices(cartItems) {
      return await Promise.all(
        cartItems.map(async (item) => {
          const productPrice = await getProductPrice(item);
          return {
            productId: item.productId._id,
            productName: item.productId.productName,
            productPrice: productPrice,
            quantity: item.quantity,
            total: item.total,
          };
        })
      );
    }

    const subTotal = cart.items.reduce((acc, crr, index) => {
      let price;
      if (
        cart.items[index].productId.offerId &&
        cart.items[index].productId.offerId.status === "active"
      ) {
        price =
          crr.productId.price -
          (crr.productId.price *
            cart.items[index].productId.offerId.percentage) /
            100;
      } else if (
        cart.items[index].productId.categoryId.offerId &&
        cart.items[index].productId.categoryId.offerId.status === "active"
      ) {
        price =
          crr.productId.price -
          (crr.productId.price *
            cart.items[index].productId.categoryId.offerId.percentage) /
            100;
      } else {
        price = crr.productId.price;
      }
      return (acc = acc + price * crr.quantity);
    }, 0);

    const addressData = await Address.findOne(
      { userId: req.session.user_id },
      { addresses: 1, _id: 0 }
    );
    let address;
    if (!addressData) {
      address = [];
    } else {
      address = addressData.addresses;
    }

    res.render("checkout", {
      products: await resolveProductPrices(cart.items),
      subTotal,
      address,
    });
  } catch (error) {
    console.error(error);
    res.render("page404");
  }
};

const editAddressLoad = async (req, res) => {
  try {
    const addressId = req.params.addressId;
    const userId = req.session.user_id;
    const addressCheck = await Address.findOne({
      userId: userId,
      "addresses._id": addressId,
    });
    const addressData = addressCheck.addresses.find((addrs) =>
      addrs._id.equals(addressId)
    );
    res.render("editAddress", { addressData });
  } catch (error) {
    res.render("page404");
  }
};

const editAddress = async (req, res) => {
  try {
    const addressId = req.params.addressId;
    const { name, address, landmark, city, pincode, email, mobile } = req.body;

    if (!/^[A-Za-z]+(?: [A-Za-z]+)?$/.test(name)) {
      return res.render("addAddress", { nameMsg: "Give proper name!" });
    }

    if (address.trim() === "") {
      return res.render("addAddress", {
        addressMsg: "Address should not be empty!",
      });
    }

    if (landmark.trim() === "") {
      return res.render("addAddress", {
        landmarkMsg: "landmark should not be empty!",
      });
    }

    if (city.trim() === "") {
      return res.render("addAddress", { cityMsg: "city should not be empty!" });
    }

    if (pincode.trim() === "") {
      return res.render("addAddress", { pincodeMsg: "Give valid pincode!" });
    }

    if (!/[A-Za-z0-9._%+-]+@gmail.com/.test(email)) {
      return res.render("addAddress", { emailMsg: "Give valid email!" });
    }

    if (mobile.trim() === "" && mobile.length < 10) {
      return res.render("addAddress", {
        mobileMsg: "Give valid mobile number!",
      });
    }

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
        },
      }
    );

    res.redirect("/account");
  } catch (error) {
    res.render("page404");
  }
};

const deleteAddress = async (req, res) => {
  try {
    const addressId = req.params.addressId;
    await Address.findOneAndUpdate(
      { userId: req.session.user_id },
      { $pull: { addresses: { _id: addressId } } }
    );
    res.redirect("/account");
  } catch (error) {
    res.render("page404");
  }
};

const loguot = async (req, res) => {
  try {
    req.session.user_id = null;
    res.redirect("/login");
  } catch (error) {
    res.render("page404");
  }
};

const securePassword = async (password) => {
  try {
    const hashPassword = await bcrypt.hash(password, 10);
    return hashPassword;
  } catch (error) {
    res.render("page404");
  }
};

const signup = async (req, res) => {
  try {
    if (/^[A-Za-z]+(?: [A-Za-z]+)?$/.test(req.body.username)) {
      if (/[A-Za-z0-9._%+-]+@gmail.com/.test(req.body.email)) {
        const { username, email, mobile, password } = req.body;
        const id = req.query.id;
        const checkEmail = await User.findOne({ email: email });

        if (!checkEmail) {
          function generateOrderId(length) {
            const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
            let id = "";
            for (let i = 0; i < length; i++) {
              const randomIndex = Math.floor(Math.random() * chars.length);
              id += chars.charAt(randomIndex);
            }
            return id;
          }

          const referalId = generateOrderId(12);

          const sPassword = await securePassword(password);
          const users = new User({
            username: username,
            email: email,
            mobile: mobile,
            password: sPassword,
            address: [],
            referalId: referalId,
          });
          var newUser = await users.save();

          if (newUser) {
            req.session.userSignup_id = newUser._id;
            req.session.userSignup_email = newUser.email;

            if (id) {
              const checkRefId = await User.findOne({ referalId: id });
              if (checkRefId) {
                let walletHistory;
                walletHistory = {
                  amount: 100,
                  description: "Referal",
                  date: new Date(),
                  status: "In",
                };
                await User.updateOne(
                  { _id: req.session.userSignup_id },
                  { $set: { wallet: 100, walletHistory: walletHistory } }
                );
                walletHistory = {
                  amount: 200,
                  description: "Referal",
                  date: new Date(),
                  status: "In",
                };
                await User.updateOne(
                  { referalId: id },
                  {
                    $inc: { wallet: 200 },
                    $push: { walletHistory: walletHistory },
                  }
                );
              }
            }

            saveOTP(newUser, res);
            res.redirect("/otp");
          } else {
            res.render("signup", { msg: "Signup failed" });
          }
        } else {
          const checkVerified = await User.findOne(
            { email: email },
            { _id: 0, isVerified: 1 }
          );
          if (checkEmail && checkVerified.isVerified === false) {
            req.session.userSignup_id = checkEmail._id;
            req.session.userSignup_email = checkEmail.email;
            saveOTP(checkEmail, res);
            res.redirect("/otp");
          } else {
            res.render("signup", {
              msg: "Already have an accound in this email! Please login",
            });
          }
        }
      } else {
        res.render("signup", { msg: "Invalid email structure!" });
      }
    } else {
      res.render("signup", { msg: "Give proper name!" });
    }
  } catch (error) {
    res.render("page404");
  }
};

const googleLogin = async (req, res) => {
  try {
    const username = req.user.displayName;
    const email = req.user.emails[0].value;
    const googleId = req.user.id;
    const id = req.query.id;

    function generateOrderId(length) {
      const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
      let id = "";
      for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * chars.length);
        id += chars.charAt(randomIndex);
      }
      return id;
    }

    const referalId = generateOrderId(12);

    const userCheck = await User.findOne({ email: email });
    if (userCheck) {
      req.session.user_id = userCheck._id;
      res.redirect("/home");
    } else {
      const users = new User({
        username: username,
        email: email,
        googleId: googleId,
        address: [],
        referalId: referalId
      });

      const newUser = await users.save();
      if (newUser) {
        if (id) {
          const checkRefId = await User.findOne({ referalId: id });
          if (checkRefId) {
            let walletHistory;
            walletHistory = {
              amount: 100,
              description: "Referal",
              date: new Date(),
              status: "In",
            };
            await User.updateOne(
              { _id: req.session.userSignup_id },
              { $set: { wallet: 100, walletHistory: walletHistory } }
            );
            walletHistory = {
              amount: 200,
              description: "Referal",
              date: new Date(),
              status: "In",
            };
            await User.updateOne(
              { referalId: id },
              {
                $inc: { wallet: 200 },
                $push: { walletHistory: walletHistory },
              }
            );
          }
        }

        req.session.user_id = newUser._id;
        res.redirect("/home");
      }
    }
  } catch (error) {
    res.render("page404");
  }
};

const saveOTP = async ({ email }, res) => {
  try {
    const subjectt = "eStore signup varification OTP";
    const message = "Please verify your eStore account with OTP";
    const duration = 1;
    const createdOTP = await sendOtp({
      email,
      subjectt,
      message,
      duration,
    });
  } catch (error) {
    res.render("page404");
  }
};

const sendOtp = async ({ email, subjectt, message, duration = 1 }) => {
  try {
    if (!(email && subjectt && message)) {
      throw Error("Provide values for email, subject, message");
    }

    //clear any old record
    await OTP.deleteOne({ email });

    //generate otp
    const generatedOTP = await generateOTP();

    //send email
    const mailOptions = {
      from: "testerr92@outlook.com",
      to: email,
      subject: subjectt,
      html: `<p>${message}</p>
                  <p>Your OTP is: ${generatedOTP}</p>`,
    };
    await sendEmail(mailOptions);
    const newOTP = await new OTP({
      email: email,
      otp: generatedOTP,
      created_at: Date.now(),
      expiration_time: Date.now() + 90000,
    });
    const createdOTPRecord = await newOTP.save();
    return createdOTPRecord;
  } catch (error) {
    res.render("page404");
  }
};

const verifyOTP = async (req, res) => {
  try {
    const enteredOTP = parseInt(
      `${req.body.num1}${req.body.num2}${req.body.num3}${req.body.num4}${req.body.num5}${req.body.num6}`
    );

    const otpData = await OTP.findOne({ email: req.session.userSignup_email });

    if (otpData) {
      if (otpData.otp === enteredOTP) {
        const verifyUser = await User.findOneAndUpdate(
          { _id: req.session.userSignup_id },
          { $set: { isVerified: true } }
        );

        if (verifyUser) {
          res.redirect("/login");
          req.session.destroy();
        }
      } else {
        res.render("otp", { msg: "Please enter the correct OTP!" });
      }
    } else {
      res.render("otp", { msg: "Something went wrong!" });
    }
  } catch (error) {
    res.render("page404");
  }
};

const resendOTP = async (req, res) => {
  try {
    const userData = await User.findOne({ _id: req.session.userSignup_id });
    saveOTP(userData);
    res.render("otp");
  } catch (error) {
    res.render("page404");
  }
};

const verifyLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const userData = await User.findOne({ email: email });
    if (userData) {
      if (userData.isBlock === false) {
        if (userData["password"] === undefined) {
          return res.render("login", { msg: "You don't have account!" });
        }
        const passwordMatch = await bcrypt.compare(password, userData.password);

        if (passwordMatch) {
          if (userData.isVerified === true) {
            req.session.user_id = userData._id;
            req.session.isBlock = userData.isBlock;
            res.redirect("/home");
          } else {
            res.render("login", {
              msg: "Please verify your account with OTP!",
            });
          }
        } else {
          res.render("login", { msg: "Wrong password!" });
        }
      } else {
        res.render("login", { msg: "Access restricted!" });
      }
    } else {
      res.render("login", { msg: "Invalid email or you don't have account!" });
    }
  } catch (error) {
    res.render("page404");
  }
};

const handleForgotPassword = async (req, res) => {
  try {
    const email = req.body.email;
    const checkUser = await User.findOne({ email: email });

    if (!checkUser) {
      return res.status(500).render("forgotPassword", {
        warningMsg: "Invalid email or you don't have account!",
      });
    }
    req.session.fPasswordEmail = checkUser.email;

    const userData = await User.findOne({ email: req.session.fPasswordEmail });
    saveOTP(userData);
    res.redirect("/fPasswordOtp");
  } catch (error) {
    res.render("page404");
  }
};

const fPasswordVerifyOtp = async (req, res) => {
  try {
    const enteredOTP = parseInt(
      `${req.body.num1}${req.body.num2}${req.body.num3}${req.body.num4}${req.body.num5}${req.body.num6}`
    );

    const otpData = await OTP.findOne({ email: req.session.fPasswordEmail });
    if (otpData) {
      if (otpData.otp === enteredOTP) {
        res.redirect("/changePassword");
      } else {
        res.render("fPasswordOtp", { msg: "Please enter the correct OTP!" });
      }
    } else {
      res.render("fPasswordOtp", { msg: "Something went wrong!" });
    }
  } catch (error) {
    res.render("page404");
  }
};

const changePassword = async (req, res) => {
  try {
    const { password1, password2 } = req.body;
    if (password1 !== password2) {
      return res.render("changePassword", {
        msg: "Two password are not same!",
      });
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
        res.redirect("login");
      } else {
        res.render("changePassword", { msg: "Password change faild!" });
      }
    } else {
      res.render("changePassword", { msg: "Something went wrong!" });
    }
  } catch (error) {
    res.render("page404");
  }
};

const addToCart = async (req, res) => {
  try {
    const productId = req.params.productId;
    const user_id = req.session.user_id;
    const productData = await Product.findById(productId)
      .populate({
        path: "categoryId",
        populate: "offerId",
      })
      .populate("offerId");

    let productPrice;
    var offerDeduction;
    if (
      productData.offerId &&
      productData.offerId.status === "active" &&
      productData.offerId.expiryDate > Date.now()
    ) {
      offerDeduction =
        productData.price * (productData.offerId.percentage / 100);
      productPrice = productData.price - offerDeduction;
    } else if (
      productData.categoryId.offerId &&
      productData.categoryId.offerId.status === "active" &&
      productData.categoryId.offerId.expiryDate > Date.now()
    ) {
      offerDeduction =
        productData.price * (productData.categoryId.offerId.percentage / 100);
      productPrice = productData.price - offerDeduction;
    } else {
      productPrice = productData.price;
    }

    const checkCart = await Cart.findOne({ userId: user_id });

    if (checkCart) {
      const existingItem = await Cart.findOne({
        $and: [{ userId: user_id }, { "items.productId": productId }],
      });
      if (existingItem) {
        res.status(201).redirect("/cart");
      } else {
        const subTotal = checkCart.items.reduce((acc, crr) => {
          return acc + crr.total;
        }, productPrice);

        await Cart.updateOne(
          { userId: user_id },
          {
            $set: { subTotal: subTotal },
            $push: { items: { productId: productId, total: productPrice } },
          }
        );
        await Product.findOneAndUpdate(
          { _id: productId },
          { $inc: { quantity: -1 } }
        );
        res.status(201).redirect("/cart");
      }
    } else {
      const cartProduct = new Cart({
        userId: user_id,
        items: [{ productId, total: productPrice }],
        subTotal: productPrice,
      });
      const newCartProduct = await cartProduct.save();

      await Product.findOneAndUpdate(
        { _id: productId },
        { $inc: { quantity: -1 } }
      );
      res.status(201).redirect("/cart");
    }
  } catch (error) {
    res.render("page404");
  }
};

const deleteProduct = async (req, res) => {
  try {
    const productId = req.params.productId;
    const userId = req.session.user_id;

    const cart = await Cart.findOne({ userId: userId });
    const cartData = await Cart.findOne(
      { "items.productId": productId },
      { _id: 0, "items.$": 1 }
    );

    const updatedSubTotal = cart.subTotal - cartData.items[0].total;
    const cartItemQty = cartData.items[0].quantity;

    const updatedCart = await Cart.findOneAndUpdate(
      { userId: userId },
      {
        $set: { subTotal: updatedSubTotal },
        $pull: { items: { productId: productId } },
      },
      { new: true }
    );

    await Product.findOneAndUpdate(
      { _id: productId },
      { $inc: { quantity: cartItemQty } }
    );

    res.redirect("/cart");
  } catch (error) {
    res.render("page404");
  }
};

const updateQuantity = async (req, res) => {
  try {
    const { cartItemId, newQuantity, productId, productPrice } = req.body;
    const checkProduct = await Product.findOne(
      { _id: productId },
      { _id: 0, quantity: 1 }
    );


    const oldQtyData = await Cart.findOne(
      { "items._id": cartItemId },
      { _id: 0, "items.$": 1 }
    );

    const oldQty = oldQtyData.items[0].quantity;

    if (checkProduct.quantity === 0 && oldQty < parseInt(newQuantity)) {
      return res.json("out of stock");
    }

    if (parseInt(newQuantity) === oldQty) {
      return res.status(401).json("quantity limit exeeded");
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
      );
    }

    const cartItem = await Cart.findOneAndUpdate(
      { "items._id": cartItemId },
      { $set: { "items.$.quantity": newQuantity } },
      { new: true }
    );

    const productData = cartItem.items.find((product) =>
      product.productId.equals(productId)
    );
    const updatedProductPrice = productData.quantity * productPrice;

    const updatedCartItem = await Cart.findOneAndUpdate(
      { "items._id": cartItemId },
      { $set: { "items.$.total": updatedProductPrice } },
      { new: true }
    );

    const subTotalData = await Cart.findOne({ userId: req.session.user_id });
    const subTotal = subTotalData.items.reduce((acc, crr) => {
      return acc + crr.total;
    }, 0);
    await Cart.updateOne(
      { userId: req.session.user_id },
      { $set: { subTotal: subTotal } }
    );
    res.status(200).json({
      success: true,
      message: "Quantity updated successfully",
      updatedProductPrice,
      subTotal,
    });
  } catch (error) {
    res.render("page404");
  }
};

const editProfile = async (req, res) => {
  try {
    const userId = req.params.userId;
    if (!/^[A-Za-z]+(?: [A-Za-z]+)?$/.test(req.body.name)) {
      return res.redirect("/account");
    }
    if (req.body.mobile < 10) {
      return res.render("/account");
    }
    const userData = await User.findOneAndUpdate(
      { _id: userId },
      {
        $set: {
          username: req.body.name,
          mobile: req.body.mobile,
        },
      }
    );
    const updatedUser = await User.findOne({ _id: userId });
    res.redirect("/account");
  } catch (error) {
    res.render("page404");
  }
};

const addAddress = async (req, res) => {
  try {
    const { name, address, landmark, city, pincode, email, mobile } = req.body;

    if (!/^[A-Za-z]+(?: [A-Za-z]+)?$/.test(name)) {
      return res.render("addAddress", { nameMsg: "Give proper name!" });
    }

    if (address.trim() === "") {
      return res.render("addAddress", {
        addressMsg: "Address should not be empty!",
      });
    }

    if (landmark.trim() === "") {
      return res.render("addAddress", {
        landmarkMsg: "landmark should not be empty!",
      });
    }

    if (city.trim() === "") {
      return res.render("addAddress", { cityMsg: "city should not be empty!" });
    }

    if (pincode.trim() === "") {
      return res.render("addAddress", { pincodeMsg: "Give valid pincode!" });
    }

    if (!/[A-Za-z0-9._%+-]+@gmail.com/.test(email)) {
      return res.render("addAddress", { emailMsg: "Give valid email!" });
    }

    if (mobile.trim() === "" && mobile.length < 10) {
      return res.render("addAddress", {
        mobileMsg: "Give valid mobile number!",
      });
    }

    const addressDoc = {
      name: name,
      address: address,
      landmark: landmark,
      city: city,
      pincode: pincode,
      email: email,
      mobile: mobile,
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
        addresses: [addressDoc],
      });

      await newAddress.save();
    }

    res.redirect("/account");
  } catch (error) {
    res.render("page404");
  }
};

let newOrder;
let order;
const placeOrder = async (req, res) => {
  try {
    const { paymentMethod, address, allProductsData, subTotal, couponCode } =
      req.body;
    function generateOrderId(length) {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWZYZ0123456789";
      let id = "";
      for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * chars.length);
        id += chars.charAt(randomIndex);
      }
      return id;
    }

    const receipt = "estore" + generateOrderId(6);

    const checkAddress = await Address.findOne({
      userId: req.session.user_id,
    }).populate("addresses");
    const addressData = checkAddress.addresses.find(
      (addrs) => addrs.address === address
    );

    let productArray = [];
    for (let item of allProductsData) {
      const productData = await Product.findOne({ _id: item.productId })
        .populate({
          path: "categoryId",
          populate: "offerId",
        })
        .populate("offerId");

      let productPrice;
      var offerDeduction = 0;
      if (
        productData.offerId &&
        productData.offerId.status === "active" &&
        productData.offerId.expiryDate > Date.now()
      ) {
        offerDeduction =
          productData.price * (productData.offerId.percentage / 100);
        productPrice = productData.price - offerDeduction;
      } else if (
        productData.categoryId.offerId &&
        productData.categoryId.offerId.status === "active" &&
        productData.categoryId.offerId.expiryDate > Date.now()
      ) {
        offerDeduction =
          productData.price * (productData.categoryId.offerId.percentage / 100);
        productPrice = productData.price - offerDeduction;
      } else {
        productPrice = productData.price;
      }

      let productDocItem = {
        productId: item.productId,
        productPrice: productPrice,
        quantity: item.quantity,
        total: item.total,
      };
      productArray.push(productDocItem);
    }

    order = new Order({
      userId: req.session.user_id,
      orderId: receipt,
      products: productArray,
      offerDeduction: offerDeduction,
      subTotal: subTotal,
      address: addressData,
      paymentMode: paymentMethod,
    });

    if (paymentMethod === "razorpay") {
      const amount = subTotal * 100;
      const currency = "INR";
      const notes = {};

      razorpayInstance.orders.create(
        { amount, currency, receipt },
        (err, order) => {
          if (!err) {
            res.json({
              success: true,
              order_id: order.id,
              amount: amount,
              key_id: process.env.RAZORPAY_KEY_ID,
              paymentMethod: paymentMethod,
            });
          } else {
            res.status(500).json({ error: "Razorpay order creation failed" });
          }
        }
      );
    } else if (paymentMethod === "wallet") {
      const userWallet = await User.findOne({ _id: req.session.user_id });
      if (userWallet.wallet < subTotal) {
        return res.json({
          paymentMethod: paymentMethod,
          warningMsg: "You don't have enough money in your wallet!",
        });
      }
      newOrder = await order.save();

      if (couponCode) {
        const couponData = await Coupon.findOneAndUpdate(
          { couponCode: couponCode, "usedUser.userId": req.session.user_id },
          { $set: { "usedUser.$.used": true } },
          { new: true }
        );
        await Order.findOneAndUpdate(
          { _id: newOrder._id },
          { $set: { couponDeduction: couponData.discountAmount } }
        );
      }
      const walletHistory = {
        amount: subTotal,
        description: "Purchase",
        date: Date.now(),
        status: "Out",
      };
      await User.findOneAndUpdate(
        { _id: req.session.user_id },
        {
          $push: { walletHistory: [walletHistory] },
          $inc: { wallet: -subTotal },
        }
      );
      await Order.findOneAndUpdate(
        { _id: newOrder._id },
        { paymentStatus: "Payment done" }
      );
      await Cart.deleteOne({ userId: req.session.user_id });
      res.json({
        orderId: newOrder._id,
        paymentMethod: paymentMethod,
      });
      return res.json({
        success: true,
        paymentMethod: paymentMethod,
      });
    } else if (paymentMethod === "COD") {
      if (order.subTotal > 1000) {
        return res.json({
          limitExceeded: true,
          paymentMethod: paymentMethod,
        });
      }
      newOrder = await order.save();
      if (couponCode) {
        const couponData = await Coupon.findOneAndUpdate(
          { couponCode: couponCode, "usedUser.userId": req.session.user_id },
          { $set: { "usedUser.$.used": true } },
          { new: true }
        );
        await Order.findOneAndUpdate(
          { _id: newOrder._id },
          { $set: { couponDeduction: couponData.discountAmount } }
        );
      }
      await Cart.deleteOne({ userId: req.session.user_id });
      res.json({
        orderId: newOrder._id,
        paymentMethod: paymentMethod,
      });
    }
  } catch (error) {
    res.status(500).render("page404");
  }
};

const verifyOrder = async (req, res) => {
  try {
    const { paymentId, order_id, razorpay_signature, couponCode } = req.body;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    let hmac = crypto.createHmac("sha256", key_secret);
    hmac.update(order_id + "|" + paymentId);
    const generated_signature = hmac.digest("hex");
    if (razorpay_signature === generated_signature) {
      newOrder = await order.save();
      await Order.findOneAndUpdate(
        { _id: newOrder._id },
        { paymentStatus: "Payment done" }
      );
      await Cart.deleteOne({ userId: req.session.user_id });
      if (couponCode) {
        const couponData = await Coupon.findOneAndUpdate(
          { couponCode: couponCode, "usedUser.userId": req.session.user_id },
          { $set: { "usedUser.$.used": true } },
          { new: true }
        );
        await Order.findOneAndUpdate(
          { _id: newOrder._id },
          { $set: { couponDeduction: couponData.discountAmount } }
        );
      }
      res.json({
        success: true,
        message: "Payment has been verified",
        orderId: newOrder._id,
      });
    } else {
      res.json({ success: false, message: "Payment verification failed" });
    }
  } catch (error) {
    res.render("page404");
  }
};

const orderDetailsLoad = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const orderData = await Order.findById(orderId).populate(
      "products.productId userId"
    );
    let discount = orderData.offerDeduction + orderData.couponDeduction;
    const orderDate = moment(orderData.date);
    const date = orderDate.format("DD-MM-YYYY h:mma");
    res.render("orderDetails", { orderData, date, discount });
  } catch (error) {
    res.render("page404");
  }
};

const cancelOrder = async (req, res) => {
  try {
    const productId = req.params.productId;
    const qty = req.body.qty;
    const order_id = req.body.order_id;
    await Order.updateOne(
      { $and: [{ _id: order_id }, { "products.productId": productId }] },
      { $set: { "products.$.status": "Cancelled" } }
    );
    await Product.updateOne({ _id: productId }, { $inc: { quantity: qty } });
    const orderData = await Order.findOne({
      $and: [{ _id: order_id }, { "products.productId": productId }],
    });
    if (orderData.paymentMode !== "COD") {
      let total = 0;
      orderData.products.forEach((product) => {
        if (product.productId._id == productId) {
          total = product.total - orderData.couponDeduction;
        }
      });
      const walletHistory = {
        amount: total,
        description: "Cancel product",
        date: Date.now(),
        status: "in",
      };
      await User.findOneAndUpdate(
        { _id: req.session.user_id },
        {
          $push: { walletHistory: [walletHistory] },
          $inc: { wallet: total },
        }
      );
    }

    res.json({
      success: true,
      message: "order cancel successfull",
    });
  } catch (error) {
    res.render("page404");
  }
};

const returnProduct = async (req, res) => {
  try {
    const { order_id, productId, reason } = req.body;
    await Order.updateOne(
      { $and: [{ _id: order_id }, { "products.productId": productId }] },
      {
        $set: {
          "products.$.reason": reason,
          "products.$.status": "Return requested",
        },
      }
    );
    res.json({ success: true, status: "Return requested" });
  } catch (error) {
    res.render("page404");
  }
};

const sortPopular = async (req, res) => {
  try {
    const limit = 8;
    const products = await Product.find().sort({ createdAt: -1 }).limist(limit);
    const categoryData = await Category.find();
    res.render("allProducts", { products, categoryData, pageCount: 1 });
  } catch (error) {
    res.render("page404");
  }
};

const sortNewArrivals = async (req, res) => {
  try {
    const products = await Product.find()
      .sort({ createdAt: -1 })
      .limit(8)
      .populate("categoryId");
    const categoryData = await Category.find();
    res.render("allProducts", { products, categoryData, pageCount: 1 });
  } catch (error) {
    res.render("page404");
  }
};

const sortAtoZ = async (req, res) => {
  try {
    const products = await Product.find()
      .sort({ productName: 1 })
      .populate("categoryId");
    const categoryData = await Category.find();
    res.render("allProducts", { products, categoryData, pageCount: 1 });
  } catch (error) {
    res.render("page404");
  }
};

const sortZtoA = async (req, res) => {
  try {
    const products = await Product.find()
      .sort({ productName: -1 })
      .populate("categoryId");
    const categoryData = await Category.find();
    res.render("allProducts", { products, categoryData, pageCount: 1 });
  } catch (error) {
    res.render("page404");
  }
};

const sortLowToHigh = async (req, res) => {
  try {
    const products = await Product.find()
      .sort({ price: 1 })
      .populate("categoryId");
    const categoryData = await Category.find();
    res.render("allProducts", { products, categoryData, pageCount: 1 });
  } catch (error) {
    res.render("page404");
  }
};

const sortHighToLow = async (req, res) => {
  try {
    const products = await Product.find()
      .sort({ price: -1 })
      .populate("categoryId");
    const categoryData = await Category.find();
    res.render("allProducts", { products, categoryData, pageCount: 1 });
  } catch (error) {
    res.render("page404");
  }
};

const filterCategory = async (req, res) => {
  try {
    const categories = req.body.categories;
    const products = await Product.find({
      categoryId: {
        $in: categories.map((id) => new mongoose.Types.ObjectId(id)),
      },
    })
      .populate("categoryId")
      .lean();
    const categoryData = await Category.find();
    const pageCount = Math.ceil(products.length / 8);
    res.json({ products, pageCount });
  } catch (error) {
    res.render("page404");
  }
};

const search = async (req, res) => {
  try {
    const productName = req.query.name?.trim();
    const productData = await Product.find({
      productName: { $regex: new RegExp(productName, "i") },
    }).populate("categoryId");
    const products = productData.filter(
      (product) => product.list && product.categoryId.list
    );
    res.json({ products });
  } catch (error) {
    res.render("page404");
  }
};

const wishlistLoad = async (req, res) => {
  try {
    const wishlistData = await Wishlist.find().populate("products.productId");
    res.render("wishlist", { wishlistData });
  } catch (error) {
    res.render("page404");
    res.render("page404");
  }
};

const addtoWishlist = async (req, res) => {
  try {
    const productId = req.params.productId;
    const userId = req.session.user_id;
    let wishlistData = await Wishlist.findOne({ userId: userId });
    const checkProduct = await Wishlist.findOne({
      userId: userId,
      "products.productId": productId,
    });
    if (checkProduct) {
      return res.redirect("/wishlist");
    }
    if (wishlistData) {
      wishlistData.products.push({ productId: productId });
      await wishlistData.save();
    } else {
      wishlistData = new Wishlist({
        userId: userId,
        products: [{ productId: productId }],
      });
      await wishlistData.save();
    }
    res.redirect("/wishlist");
  } catch (error) {
    res.render("page404");
  }
};

const removeProduct = async (req, res) => {
  try {
    const productId = req.body.productId;
    await Wishlist.findOneAndUpdate(
      { userId: req.session.user_id },
      { $pull: { products: { productId: productId } } }
    );
    res.json(200);
  } catch (error) {
    res.render("page404");
  }
};

const couponCheck = async (req, res) => {
  try {
    const { couponCode, subTotal } = req.body;
    const userId = req.session.user_id;
    const checkCoupon = await Coupon.findOne({ couponCode: couponCode });
    if (!checkCoupon) {
      return res.json({
        success: true,
        warningMsg: "Coupon not found in your account!",
      });
    }
    if (checkCoupon.expiryDate < Date.now()) {
      return res.json({ warningMsg: "Coupon expired!" });
    }
    if (checkCoupon.expiryDate < Date.now()) {
      return res.json({ warningMsg: "Coupon expired!" });
    }
    const usedUser = checkCoupon.usedUser.find(
      (user) => user.userId.toString() === userId
    );
    if (usedUser && usedUser.used) {
      return res.json({ warningMsg: "Coupon already used!" });
    }
    if (checkCoupon.minAmount > subTotal) {
      return res.json({
        warningMsg: `Total purchase amount should be minimum ${checkCoupon.minAmount}!`,
      });
    }
    await Coupon.findOneAndUpdate(
      { _id: checkCoupon._id, "usedUser.userId": { $ne: userId } },
      { $push: { usedUser: { userId: userId } } },
      { new: true }
    );
    await Cart.findOneAndUpdate(
      { userId: userId },
      { $set: { discount: checkCoupon.discountAmount } }
    );
    const discount = checkCoupon.discountAmount;
    const updatedsubTotal = subTotal - discount;
    res.json({
      success: true,
      discount,
      updatedsubTotal,
    });
  } catch (error) {
    res.render("page404");
  }
};

const downloadInvoice = async (req, res) => {
  try {
    const order_id = req.query.id;
    const orderData = await Order.findOne({ _id: order_id }).populate(
      "products.productId"
    );
    let products = [];
    orderData.products.forEach((product) => {
      let item = {
        description: product.productId.productName,
        quantity: product.quantity,
        price: product.productPrice,
      };
      products.push(item);
    });
    const invoiceData = {
      mode: "development",
      currency: "INR",
      taxNotation: "gst",
      marginTop: 25,
      marginRight: 25,
      marginLeft: 25,
      marginBottom: 25,
      sender: {
        company: "eStore Fashion",
        address: "Banglure",
        city: "India",
      },
      client: {
        company: orderData.address.name,
        address: orderData.address.address,
        city: orderData.address.city,
        zip: orderData.address.pincode,
        country: "India",
      },
      information: {
        number: "1234",
        date: "12-12-2021",
      },
      products: products,
      amount: orderData.subTotal,
    };

    // Generate invoice PDF
    const result = await easyinvoice.createInvoice(invoiceData);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'attachment; filename="invoice.pdf"');
    res.send(Buffer.from(result.pdf, "base64"));
  } catch (error) {
    res.render("page404");
  }
};

module.exports = {
  loadIndex,
  loadContact,
  loadAbout,
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
  verifyOrder,
  orderDetailsLoad,
  cancelOrder,
  returnProduct,
  sortPopular,
  sortAtoZ,
  sortZtoA,
  sortNewArrivals,
  sortLowToHigh,
  sortHighToLow,
  filterCategory,
  search,
  wishlistLoad,
  addtoWishlist,
  removeProduct,
  couponCheck,
  downloadInvoice,
};
