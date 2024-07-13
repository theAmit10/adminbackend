const multer = require("multer");
const path = require("path");

// const storage = multer.memoryStorage();
var storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './public/uploads');
    },
    filename: (req, file, cb) => {
        cb(null, req.user._id + path.extname(file.originalname));
    }
});

exports.singleUpload = multer({
    storage,
}).single("file");



// const multer = require("multer");
// const path = require("path");


// // const storage = multer.memoryStorage();
// var storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, './public/uploads')
//     },
//     filename: (req, file, cb) => {
//         cb(null, req.user._id + path.extname(file.originalname))
//     }
// });

// export const singleUpload = multer(
//     {
//         storage,
//     }
// ).single("file")