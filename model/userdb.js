const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username:{type:String, required:true, trim:true},
    email:{type:String, required:true},
    mobile:{type:Number, default:''},
    googleId:{type:String, default:''},
    password:{type:String},
    createDate:{type:Date, default:Date.now},
    isVerified:{type:Boolean, required: true, default:false},
    isBlock:{type:Boolean, required:true, default:false},
    isAdmin:{type:Boolean, required:true, default:false},
    referalId:{type:String, required:true},
    wallet:{type:Number, required:true, default:0},
    walletHistory:[{
        amount:{type:Number},
        description:{type:String},
        date:{type:Date},
        status:{type:String}
    }],
    token:{type:Number, default:''},

})


module.exports = mongoose.model('User',userSchema);
