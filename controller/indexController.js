const bcrypt = require('bcrypt');
const User = require('../model/userdb');

const loadIndex = async (req,res) =>{
    try {
        res.render('index')
    } catch (error) {
        console.log(error.message);
    }
} 

const loadLogin = async(req,res)=>{
    try{
        res.render('login')
    }catch(error){
        console.log(error.message);
    }
}

const loadSignup = async(req,res)=>{
    try{
        res.render('signup')
    }catch(error){
        console.log(error.message);
    }
}

const otpLoad = async (req,res) => {
    try {
        res.render('otp')
    } catch (error) {
        console.log(error.message);
    }
}


const securePassword = async (password) =>{
    try {
        const hashPassword = await bcrypt.hash(password, 10);
        return hashPassword
    } catch (error) {
        console.log(error.message);
    }
}

const signup = async (req,res) => {
    try {
        if(/^[A-Za-z]+(?: [A-Za-z]+)?$/.test(req.body.username)){
            if(/[A-Za-z0-9._%+-]+@gmail.com/.test(req.body.email)){
                const sPassword = await securePassword(req.body.password);
                const users = new User({
                    username:req.body.username,
                    email:req.body.email,
                    mobile:req.body.mobile,
                    password:sPassword,
                    address:[],
                })
                const result = await users.save()
                if(result){
                    res.render('signup',{msg:"Signup sucessfull"});
                }else{
                    res.render('signup',{msg:"Signup failed"});
                }
            }else{
                res.render('signup',{msg:"Invalid email!"});
            }
        }else{
            res.render('signup',{msg:"Give proper name!"});
        }
    } catch (error) {
        console.log(error.message);

    }
}


const otpSubmit = async (req,res) =>{
    try {
        
    } catch (error) {
        console.log(error.message);
    }
}


module.exports = {
    loadIndex,
    loadLogin,
    loadSignup,
    signup,
    otpLoad,
    
   
}