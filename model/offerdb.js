const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
    offerName:{type:String, required:true},
    description:{type:String, required:treu},
    percentage:{type:Number, required:true},
    expiryDate:{type:Date, required:true},
    status:{type:Boolean, requried:true},
    category:{type:mongoose.Types.ObjectId, ref:'Category'}
})

module.exports = mongoose.model('Offer', offerSchema);