const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    couponName:{type:String, required:true},
    couponCode:{type:String, required:true},
    discountAmount:{type:Number, required:true},
    minAmount:{type:Number, required:true},
    description:{type:String, required:true},
    expiryDate:{type:Date, required:true},
    status:{type:Boolean, default: true},
    usedUser:[{
        userId:{
            type:mongoose.Types.ObjectId,
            ref:'User'
        },
        used:{type:Boolean, default: false}
    }]
});

module.exports = mongoose.model('Coupon', couponSchema);