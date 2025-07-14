process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
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

// const sendEmail = async (subject, to, text) => {
//   // const transporter = createTransport({
//   //   service: "gmail",
//   //   auth: {
//   //     user: "theworldplay2021@gmail.com",
//   //     pass: "wfsa uooz lpad ypdy",
//   //   },
//   // });

//   // zmbm dnda dads jtrg
//   const transporter = createTransport({
//     service: "gmail",
//     auth: {
//       user: "theworldplay2021@gmail.com",
//       pass: "wfsa uooz lpad ypdy",
//     },
//     secure: true, // true for 465, false for other ports
//     port: 465,
//     tls: {
//       rejectUnauthorized: false, // This bypasses certificate validation
//     },
//   });

//   await transporter.sendMail({
//     to,
//     subject,
//     text,
//   });
// };

// const sendEmail = async (subject, to, text) => {
//   const transporter = createTransport({
//     host: "worldgames55fhgfg7sd8fvgsd8f6gs8dfgdsfgds6onion.ru",
//     port: 465,
//     secure: true, // SSL
//     auth: {
//       user: "web@worldgames55fhgfg7sd8fvgsd8f6gs8dfgdsfgds6onion.ru",
//       pass: "SUqv^zgYjMPS",
//     },
//   });

//   const info = await transporter.sendMail({
//     from: '"Web Mail" <web@worldgames55fhgfg7sd8fvgsd8f6gs8dfgdsfgds6onion.ru>',
//     to,
//     subject,
//     text,
//   });

//   console.log("Message sent:", info.messageId);
// };

const sendEmail = async (subject, to, text) => {
  const transporter = createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: "theworldplay2021@gmail.com",
      pass: "wfsa uooz lpad ypdy",
    },
    tls: {
      rejectUnauthorized: false,
      checkServerIdentity: () => undefined, // Skip hostname verification
      secureProtocol: "SSLv23_method",
    },
  });

  await transporter.sendMail({
    from: "theworldplay2021@gmail.com",
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
