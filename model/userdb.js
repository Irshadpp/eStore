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


module.exports = mongoose.model('User',userSchema);


// module.exports = { 
//     User,
//     // OTP,
// }