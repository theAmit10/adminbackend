const { createTransport } = require("nodemailer");

const sendToken = (user, res, message, statusCode) => {
  const token = user.generateToken();
  res.cookie("token", token, { httpOnly: true });
  res.status(statusCode).json({
    success: true,
    message,
    token,
    user,
  });
};

// const sendToken = (user, res, message, statusCode) => {
//     const token = user.generateToken();

//     // console.log("TOKEN :: " + token)

//     res.status(statusCode)
//     .cookie("token", token, {
//         ...cookieOptions,
//         expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
//     })
//     .json({
//         success: true,
//         message: message,
//         token,
//     });
// };

// const cookieOptions = {
//     secure: process.env.NODE_ENV === "Development" ? false : true,
//     httponly: process.env.NODE_ENV === "Development" ? false : true,
//     sameSite: process.env.NODE_ENV === "Development" ? false : "none",
// }
const cookieOptions = {
  secure: true,
  httponly: true,
  sameSite: "none",
};

// FOR MOBILE APPLICATION
// const sendToken = (user, res, message, statusCode) => {
//     const token = user.generateToken();

//     // console.log("TOKEN :: " + token)

//     res.status(statusCode).json({
//         success: true,
//         message: message,
//         token,
//     });
// };

// For Uploading Profile Image
const getDataUri = (file) => {
  // Implement your logic for getting data URI here
};

// for sending email
// const sendEmail = async (subject, to, text) => {
//     const transporter = createTransport({
//         service: 'gmail',
//         auth: {
//             user: 'theworldplay1927@gmail.com',
//             pass: 'crdu umgu wela qnyk',
//         },
//     });

//     await transporter.sendMail({
//         to,
//         subject,
//         text,
//     });
// };

const sendEmail = async (subject, to, text) => {
  const transporter = createTransport({
    service: "gmail",
    auth: {
      user: "theworldplay1927@gmail.com",
      pass: "crdu umgu wela qnyk",
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  await transporter.sendMail({
    from: '"The World Play" <theworldplay1927@gmail.com>',
    to,
    subject,
    text,
  });
};

module.exports = {
  sendToken,
  getDataUri,
  sendEmail,
  cookieOptions,
};
