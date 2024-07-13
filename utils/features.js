const  {createTransport}  = require("nodemailer");

const sendToken = (user, res, message, statusCode) => {
    const token = user.generateToken();

    // console.log("TOKEN :: " + token)

    res.status(statusCode).json({
        success: true,
        message: message,
        token,
    });
};

// For Uploading Profile Image
const getDataUri = (file) => {
    // Implement your logic for getting data URI here
};

// for sending email
const sendEmail = async (subject, to, text) => {
    const transporter = createTransport({
        service: 'gmail',
        auth: {
            user: 'thelionworlds@gmail.com',
            pass: 'rbcp fpgo lsiu tpun',
        },
    });

    await transporter.sendMail({
        to,
        subject,
        text,
    });
};

module.exports = {
    sendToken,
    getDataUri,
    sendEmail,
};
