const bcrypt = require('bcrypt');
const User = require('../model/userdb');
const OTP = require('../model/otpdb')
const generateOTP = require('../util/generateOtp')
const asyncHandler = require('express-async-handler');
const sendEmail = require('../util/sendEmail');

const loadIndex = asyncHandler(async (req, res) => {
    res.render('index')
})

const loadLogin = async (req, res) => {
    try {
        res.render('login')
    } catch (error) {
        console.log(error.message);
    }
}

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
    res.render('home');
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
                const findUser = await User.find({ email: email });
                const checkEmail = findUser[0].email;
                console.log(checkEmail);
                if (checkEmail !== email) {

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
                        req.session.user_id = newUser._id;
                        req.session.user_email = newUser.email;
                        saveOTP(newUser, res);
                        res.redirect('/otp');
                    } else {
                        res.render('signup', { msg: "Signup failed" });
                    }

                } else {

                    const checkVerified = await User.find({ email: email }, { _id: 0, isVerified: 1 });
                    if (checkEmail && checkVerified[0].isVerified === false) {
                        req.session.user_id = findUser[0]._id
                        req.session.user_email = findUser[0].email;
                        saveOTP(findUser[0], res);
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
}

const saveOTP = asyncHandler(async ({ _id, email }, res) => {

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

    const otpData = await OTP.findOne({ email: req.session.user_email });

    if (otpData) {
        if (otpData.otp === enteredOTP) {
            const verifyUser = await User.findOneAndUpdate({ _id: req.session.user_id }, { $set: { isVerified: true } });

            if (verifyUser) {
                res.redirect('/login');
                req.session.destroy();
            }
        } else {
            res.render('otp', { msg: 'Please enter the correct OTP!' });
        }

    } else {
        res.render('otp', { msg: 'Please enter the correct OTP!' });
    }
})

const resendOTP = asyncHandler(async (req, res) => {
    const userData = await User.findOne({ _id: req.session.user_id });
    saveOTP(userData);
    res.render('otp');
})


const verifyLogin = asyncHandler(async (req, res) => {

    const { email, password } = req.body;
    const userData = await User.findOne({ email: email });

    if (userData) {

        const passwordMatch = await bcrypt.compare(password, userData.password);

        if (passwordMatch) {

            if (userData.isVerified === true) {
                req.session.user_id = userData._id;
                res.redirect('/home');
            } else {
                res.render('login', { msg: "Please verify your account with OTP!" })
            }

        } else {
            res.render('login', { msg: "Wrong password!" });
        }

    } else {
        res.render('login', { msg: "Invalid email!" });
    }

})




module.exports = {
    loadIndex,
    loadLogin,
    loadSignup,
    signup,
    otpLoad,
    verifyOTP,
    resendOTP,
    verifyLogin,
    homeLoad
}