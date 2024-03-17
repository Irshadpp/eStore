const mongoose = require('mongoose');

const productsSchema = new mongoose.Schema({
    productId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Product',
        required:true
    }
})

const wishlistSchema = new mongoose.Schema({
    userId:{type:mongoose.Schema.Types.ObjectId, ref: 'User', required:true},
    products:[productsSchema],
});

module.exports = mongoose.model('Wishlist', wishlistSchema);