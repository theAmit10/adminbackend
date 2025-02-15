const multer = require("multer");
const path = require("path");

// Set storage engine
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/uploads/otherpaymentqrcode"); // Change the directory as needed
  },
  filename: function (req, file, cb) {
    cb(
      null,
      `${file.fieldname}${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

// Initialize upload variable
const upload = multer({
  storage: storage,
  limits: { fileSize: 1000000 }, // 1MB limit for example
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
});

// Check File Type
function checkFileType(file, cb) {
  // Allowed ext
  const filetypes = /jpeg|jpg|png/;
  // Check ext
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // Check mime
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb("Error: Images Only!");
  }
}

module.exports = {
  singleUploadForOtherPaymentQrCode: multer({ storage }).single("qrcode"),
};
