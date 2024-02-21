const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    productName:{type:String, required:true, trim:true},
    description:{type:String, required:true},
    quantity:{type:Number, required:true},
    price:{type:Number, required:true},
    category:{type:String, required:true},
    status:{type:String, required:true, default:'In Stock'},
    imagePaths:{type:Array, required:true}, 
})

module.exports = mongoose.model('Product',productSchema);