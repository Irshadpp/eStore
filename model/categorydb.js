const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    categoryName:{type:String, required:true},
    description:{type:String, rquired:true},
});

module.exports = mongoose.model('Category',categorySchema);