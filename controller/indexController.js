const bcrypt = require('bcrypt');
const User = require('../model/userdb');
const OTP = require('../model/userdb')
const generateOTP = require('../util/generateOtp')
const asyncHandler = require('express-async-handler');
const sendEmail = require('../util/sendEmail');
const {AUTH_EMIAL} = process.env;

const loadIndex = asyncHandler(async (req,res) =>{
        res.render('index')
}) 

const loadLogin = async(req,res)=>{
    try{
        res.render('login')
    }catch(error){
        console.log(error.message);
    }
}

const loadSignup = async(req,res)=>{
    try{
        res.render('signup')
    }catch(error){
        console.log(error.message);
    }
}

const otpLoad = async (req,res) => {
    try {
        res.render('otp')
    } catch (error) {
        console.log(error.message);
    }
}


const securePassword = async (password) =>{
    try {
        const hashPassword = await bcrypt.hash(password, 10);
        return hashPassword
    } catch (error) {
        console.log(error.message);
    }
}

const signup = async (req,res) => {
    try {
        if(/^[A-Za-z]+(?: [A-Za-z]+)?$/.test(req.body.username)){
            if(/[A-Za-z0-9._%+-]+@gmail.com/.test(req.body.email)){
                const sPassword = await securePassword(req.body.password);
                const users = new User({
                    username:req.body.username,
                    email:req.body.email,
                    mobile:req.body.mobile,
                    password:sPassword,
                    address:[],
                })
                const result = await users.save()
                if(result){
                    res.redirect('/otp');
                }else{
                    res.render('signup',{msg:"Signup failed"});
                }
            }else{
                res.render('signup',{msg:"Invalid email!"});
            }
        }else{
            res.render('signup',{msg:"Give proper name!"});
        }
    } catch (error) {
        console.log(error.message);

    }
}

const otpSubmit = async ({req, res}) =>{
    console.log("otp submit -------------------------------------");
    try {
        const {email, subject, message, duration} = req.body;
        const createdOTP = await sendOtp({
            email,
            subject,
            message,
            duration
        })
        res.status(200).json(createdOTP)
    } catch (error) {
        res.status(400).send(error.message)
    }
}

const sendOtp = async ({email, subject, message, duration = 1}) =>{
    try {
        if(!(email && subject && message)){
            throw Error("Provide values for email, subject, message");
        }
        //clear any old record
        // await OTP.deleteOne({email});

        //generate otp
        const generatedOTP = await generateOTP();

        //send email
        const mailOptions = {
            from: AUTH_EMIAL,
            to: 'irshad89434@gmail.com',
            subject,
            generatedOTP,
            duration,
        }
        console.log(mailOptions.generatedOTP);
        await sendEmail(mailOptions);
        const newOTP = await new OTP({
            email: email,
            otp: generatedOTP,
            created_at: Date.now(),
            expiration_time: Date.now() + 120000 * +duration,
        })

        const createdOTPRecord = await newOTP.save()
        return createdOTPRecord
    } catch (error) {
        console.log(error.message);
    }
}



module.exports = {
    loadIndex,
    loadLogin,
    loadSignup,
    signup,
    otpLoad,
    otpSubmit,
    
   
}