const jwt = require("jsonwebtoken");
const ErrorHandler = require("../utils/error.js");
const { asyncError } = require("./error.js");
const  User  = require("../models/user.js");

const isAuthenticated = asyncError(async (req, res, next) => {
  const bearerHeader = req.headers["authorization"];
  let token = bearerHeader && bearerHeader.split(" ")[1];

  if (!token) {
    token = req.cookies.token; // fallback to cookie
  }

  if (!token) return next(new ErrorHandler("Invalid Token, Please login", 401));

  try {
    const decodedData = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decodedData._id);
    if (!user) return next(new ErrorHandler("Token Expired, please login Again", 401));
    req.user = user;
    next();
  } catch (error) {
    return next(new ErrorHandler("Invalid Token, Please login", 401));
  }
});


// const isAuthenticated = asyncError(async (req, res, next) => {


//   const bearerHeader = req.headers["authorization"];
//   let token = bearerHeader && bearerHeader.split(" ")[1];
//   console.log("Bearer Header :: "+bearerHeader)

//   // NOW CHECKING FOR COOKIES
//   console.log(req.cookies);

//   token = req.cookies.token;
//   console.log("Token from cookie :: "+token)
  
//   if (!token) return next(new ErrorHandler("Invalid Token, Please login", 401));

//   req.token = token;
//   const decodedData = jwt.verify(token, process.env.JWT_SECRET);
//   // const decodedData = jwt.verify(req.token, process.env.JWT_SECRET);
//   console.log("User :: " + decodedData._id);
//   console.log("User Data :: " + JSON.stringify(decodedData));

//   const user = await User.findById(decodedData._id);
//   if(!user) return next(new ErrorHandler("Token Expired, please login Again :: ", 401));

//   req.user = user;

//   next();
// });

// FOR MOBILE APPLICATION
// const isAuthenticated = asyncError(async (req, res, next) => {
//   const bearerHeader = req.headers["authorization"];
//   const token = bearerHeader && bearerHeader.split(" ")[1];

//   console.log("Bearer Header :: "+bearerHeader)

//   if (token == null) return next(new ErrorHandler("Invalid Token", 401));

//   req.token = token;
//   const decodedData = jwt.verify(token, process.env.JWT_SECRET);
//   // const decodedData = jwt.verify(req.token, process.env.JWT_SECRET);
//   console.log("User :: " + decodedData._id);
//   console.log("User Data :: " + JSON.stringify(decodedData));

//   const user = await User.findById(decodedData._id);
//   if(!user) return next(new ErrorHandler("Token Expired, please login Again :: ", 401));

//   req.user = user;

//   next();
// });


const verifyToken = async (req, res, next) => {
  const decodedData = jwt.verify(
    req.token,
    process.env.JWT_SECRET,
    (err, authData) => {
      if (err) {
        next(new ErrorHandler("Invalid Token", 401));
      }
      if(authData){
        console.log("Auth data : : "+authData)
        console.log("Auth data : : "+JSON.stringify(authData))

      }
    }
  );

  console.log(decodedData)
  console.log("Verifying :: "+JSON.stringify(decodedData))


};

const isAdmin = asyncError(async (req, res, next) => {
  if (req.user.role !== "admin") {
    return next(new ErrorHandler("Only Admin allowed", 401));
  }
  next();
});

module.exports = {
  isAuthenticated,
  verifyToken,
  isAdmin,
};
