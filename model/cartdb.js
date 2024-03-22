const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    quantity: {
        type:Number,
        default: 1,
        min: 1
    },
    total: {
        type:Number,
        required: true,
        default: 0,
    }
});

const cartSchema = new mongoose.Schema({
    userId: {
        type:mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items:[cartItemSchema],
    discount:{type:Number, required:true, default:0},
    subTotal:{type:Number, required:true}
});

module.exports = mongoose.model('Cart', cartSchema);