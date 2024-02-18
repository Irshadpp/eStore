const bcrypt = require('bcrypt');
const User = require('../model/userdb');
const OTP = require('../model/otpdb')
const generateOTP = require('../util/generateOtp')
const asyncHandler = require('express-async-handler');
const sendEmail = require('../util/sendEmail');
const { AUTH_EMIAL } = process.env;

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
                const sPassword = await securePassword(req.body.password);
                const users = new User({
                    username: req.body.username,
                    email: req.body.email,
                    mobile: req.body.mobile,
                    password: sPassword,
                    address: [],
                })
                const newUser = await users.save();

                if (newUser) {
                    saveOTP(newUser, res);
                    res.redirect('/otp');
                } else {
                    res.render('signup', { msg: "Signup failed" });
                }
            } else {
                res.render('signup', { msg: "Invalid email!" });
            }
        } else {
            res.render('signup', { msg: "Give proper name!" });
        }
    } catch (error) {
        console.log(error.message);

    }
}

const saveOTP = async ({ _id, email }, res) => {
    try {
        console.log("otp submit -------------------------------------");
        const subjectt = 'eStore signup varification OTP';
        const message = 'Please verify your eStore account with OTP';
        const duration = 1;
        const createdOTP = await sendOtp({
            email,
            subjectt,
            message,
            duration
        })
        // res.status(200).json(createdOTP)
    } catch (error) {
        res.status(400).send(error.message)
        console.log(error.message);
    }
}

const sendOtp = asyncHandler(async ({ email, subjectt, message, duration = 1 }) => {
    
        if (!(email && subjectt && message)) {
            throw Error("Provide values for email, subject, message");
        }

        //clear any old record
        // await OTP.deleteOne({ email });

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
            // expiration_time: Date.now() + 15000 ,
        })
        const createdOTPRecord = await newOTP.save();
        return createdOTPRecord;
    }) 

const verifyOTP = asyncHandler(async(req,res)=>{
    
    const enteredOTP = parseInt(`${req.body.num1}${req.body.num2}${req.body.num3}${req.body.num4}${req.body.num5}${req.body.num6}`)

    const otpData = await OTP.findOne({otp:enteredOTP});

    if(otpData){
        const userEmail = otpData.email;
        const verifyUser = await User.findOneAndUpdate({email:userEmail},{$set:{isVerified:true}});
        if(verifyUser){
            res.redirect('/login');
        }else{
            // res.render('otp',{msg:'Please enter the correct OTP!'});
            res.send('otp wrong')
        }
    }
})







module.exports = {
    loadIndex,
    loadLogin,
    loadSignup,
    signup,
    otpLoad,
    verifyOTP
}