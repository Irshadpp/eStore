const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    categoryName:{type:String, required:true},
    description:{type:String, rquired:true},
    list:{type:Boolean, required:true, default:true},
});

module.exports = mongoose.model('Category',categorySchema);