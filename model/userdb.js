const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username:{type:String, required:true, trim:true},
    email:{type:String, required:true},
    mobile:{type:Number, default:''},
    googleId:{type:String, default:''},
    password:{type:String},
    address:{type:Array},
    createDate:{type:Date, default:Date.now},
    isVerified:{type:Boolean, required: true, default:false},
    isBlock:{type:Boolean, required:true, default:false},
    isAdmin:{type:Boolean, required:true, default:false},
    token:{type:Number, default:''}
})


module.exports = mongoose.model('User',userSchema);
