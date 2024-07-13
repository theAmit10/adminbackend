const multer = require("multer");
const path = require("path");

var storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './public/uploads/promotion');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

module.exports = {
    singleUploadForPromotion: multer({ storage }).single("file")
};
