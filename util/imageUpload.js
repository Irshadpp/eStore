const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

const storage = multer.diskStorage({
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
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
            return cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'Only image files are allowed'));
        }
        cb(null, true);
    }
});

//image cropping using Sharp
const uploadWithCropping = (fieldName, options) => {
    return (req, res, next) => {
        upload.array(fieldName, options)(req, res, async (err) => {
            if (err) {
                return next(err);
            }
            try {
                for (const file of req.files) {
                    const croppedFilePath = path.join(path.dirname(file.path), 'cropped_' + file.filename);
                    await sharp(file.path)
                        .resize({ width: 563, height: 780, fit: 'cover' })
                        .toFile(croppedFilePath);
                    fs.unlink(file.path, (unlinkErr) => {
                        if (unlinkErr) {
                            console.error('Error deleting original file:', unlinkErr);
                        }
                    });
                    fs.rename(croppedFilePath, file.path, (renameErr) => {
                        if (renameErr) {
                            console.error('Error renaming cropped file:', renameErr);
                        }
                    });
                }
                next();
            } catch (error) {
                next(error);
            }
        });
    };
};

module.exports = { upload, uploadWithCropping };
