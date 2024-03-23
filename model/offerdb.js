const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
    offerName:{type:String, required:true},
    description:{type:String, required:true},
    percentage:{type:Number, required:true},
    expiryDate:{type:Date, required:true},
    status:{type:String, requried:true, default:'active'},
    offerType:{type:String, required:true}
})

module.exports = mongoose.model('Offer', offerSchema);