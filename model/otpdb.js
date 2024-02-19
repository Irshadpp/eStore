const mongoose = require('mongoose')

const otpSchema = new mongoose.Schema({
    email:{type:String, unique:true},
    otp:{type:Number, required:true},
    created_at:{type:Date, default:Date.now},
    expiration_time:{type:Date, expires: 0},
})

module.exports = mongoose.model('OTP',otpSchema);