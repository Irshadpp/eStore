const nodemailer = require('nodemailer');

// const {AUTH_EMAIL,AUTH_PASS} = process.env;
AUTH_EMAIL = 'testerr92@outlook.com'
AUTH_PASS = 'Pass4455'

let transporter = nodemailer.createTransport({
    host: "smtp-mail.outlook.com",
    auth:{
        user: AUTH_EMAIL,
        pass: AUTH_PASS
    }
})

// test transporter
transporter.verify((error, success)=>{
    if(error){
        console.log(error);
    }else{
        console.log("Ready for message")
        console.log(success);
    }
})

const sendEmail = async (mailOptions) =>{
    try {
        await transporter.sendMail(mailOptions);
        console.log('mail done');
    } catch (error) {
        throw error
    }
}

module.exports = sendEmail;