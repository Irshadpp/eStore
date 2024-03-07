const mongoose = require('mongoose');

const address = new mongoose.Schema({
    name:{type:String, required:true},
    address:{type:String, required:true},
    landmark:{type:String, required:true},
    city:{type:String, required:true},
    pincode:{type:Number, required:true},
    email:{type:String, required:true},
    mobile:{type:Number, required:true}
});

const addressSchema = new mongoose.Schema({
    userId:{type:mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
    addresses:[address]
})

module.exports = mongoose.model('Address', addressSchema);