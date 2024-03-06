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
    }
})

const cartSchema = new mongoose.Schema({
    userId: {
        type:mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items:[cartItemSchema],
    subTotal:{type:Number}
});

module.exports = mongoose.model('Cart', cartSchema);