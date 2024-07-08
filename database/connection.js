require('dotenv').config();
const mongoose = require('mongoose');

const connectDB = async ()=>{
    try {
        console.log('--------------')
        const conn = await mongoose.connect(process.env.DB_URI);
        console.log('=================')
    console.log("Database connected")
}catch(error){
    console.log(error);
}
}
module.exports = connectDB;