const generateOTP = async () =>{
    try {
        return (otp = `${Math.floor(10000 + Math.random() * 900000) }`)
    } catch (error) {
        throw error
    }
} 

module.exports = generateOTP;