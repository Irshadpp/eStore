const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    productId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Product',
        required:true,
    },
    status:{type:String, required: true, default: 'Placed'},
    quantity:{type:Number, required: true},
    total:{type:Number, required: true},
    reason:{type:String},
})

const orderSchema = new mongoose.Schema({ 
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required: true
    },
    orderId:{type:String, required: true},
    products:[orderItemSchema],
    offerDeduction:{type:Number, required:true, default:0},
    couponDeduction:{type:Number, required:true, default:0},
    subTotal:{type:Number, required: true},
    address:{type:Object, required: true},
    paymentMode:{type:String, required: true},
    paymentStatus:{type:String, required: true, default:'Payment Pending'},
    status:{type:String, requried:true, default:'Placed'},
    date:{type:Date, required: true, default: Date.now}
});

module.exports = mongoose.model('Order', orderSchema);