const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    username:{type:String, required:true, trim:true},
    email:{type:String, required:true},
    mobile:{type:Number, required:true},
    password:{type:String, required:true},
    address:{type:Array},
    isVerified:{type:Boolean, required: true, default:false},
    isBlock:{type:Boolean, required:true, default:false},
    isAdimin:{type:Boolean, required:true, default:false},
    token:{type:Number, default:''}
})

const otpSchema = new mongoose.Schema({
    // user_id:{type:mongoose.Schema.Types.ObjectId, ref: 'User', required:true},
    email:{type:String, unique:true},
    otp:{type:Number, required:true},
    created_at:{type:Date, default:Date.now},
    expiration_time:{type:Date, required:true},
})
module.exports = mongoose.model('User',userSchema);
module.exports = mongoose.model('OTP',otpSchema);

// module.exports = { 
//     User,
//     // OTP,
// }