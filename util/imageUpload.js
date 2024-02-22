const multer = require('multer');
const path = require('path');
const fs = require('fs');



const storage = multer.diskStorage({
    // destination: (req, file, cb) => {
    //     cb(null, 'images');
    // },

    destination: (req, file, cb) => {
        const uploadPath = 'images';
        fs.mkdir(uploadPath, { recursive: true }, (err) => {
            if (err) {
                return cb(err);
            }
            cb(null, uploadPath);
        });
    },

    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname)
        cb(null, Date.now() + ext);
    },

    // console.log("+++++++++++++++++++++++++++++++++++++++++++++++",storage);

   
})

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5 MB limit
 });

module.exports = upload;