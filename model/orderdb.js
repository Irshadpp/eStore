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
    paymentMode:{type:String, required: true, default: 'COD'},
    date:{type:Date, required: true, default: Date.now}
})

const orderSchema = new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required: true
    },
    orderId:{type:String, required: true},
    products:[orderItemSchema],
    subTotal:{type:Number, required: true},
    address:{type:Object, required: true}
});

module.exports = mongoose.model('Order', orderSchema);