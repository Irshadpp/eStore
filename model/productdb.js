const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    productName:{type:String, required:true, trim:true},
    description:{type:String, required:true},
    quantity:{type:Number, required:true},
    price:{type:Number, required:true},
    categoryId:{type:mongoose.Schema.Types.ObjectId, ref: 'Category', required:true},
    list:{type:Boolean, required:true, default:true},
    status:{type:String, required:true, default:'In Stock'},
    imagePaths:{type:Array}, 
    offerId:{type:mongoose.Types.ObjectId, ref:'Offer'}
})

module.exports = mongoose.model('Product',productSchema);