const express = require("express");
const { config } = require("dotenv");
const user = require("./routes/user.js");
const result = require("./routes/result.js");
const  {errorMiddleware } = require("./middlewares/error.js");
const cors = require("cors");
const {connectDb}  = require("./data/database.js");


const {firebase} = require("./firebase/index.js")

config({
    path: "./data/config.env",
});

const app = express();

// Using Cors 
app.use(cors({
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    origin: [process.env.FRONTEND_URL_1, process.env.FRONTEND_URL_2]
}));

// Use Middleware 
app.use(express.json());

// for getting image
app.use(express.static('public'));

// Handeling Routes
app.get("/", (req, res, next) => {
    res.send("Namaste Codethenic");
});

app.use("/api/v1/user", user);
app.use("/api/v1/result", result);


// Using error middleware in the last 
app.use(errorMiddleware);

connectDb();


const tokens = [
"djqkwjYdTMGpY1C_vj8cey:APA91bEtG5Zg9YRvWPn2bru3tkGbywzFDr2rtl_HUMQw15ONDG1HdP7cr1NtpwxCCR0I_PE1jCeFKciKX7IP55h4umYlGRVXmRwfV6-E601HKFQDsoZaMVtdZ9WVDALWUU7EDo3w4DA8", 
];

// const sendNotification = async () => {
  // try {
  //   await firebase.messaging().send({
  //     token: "djqkwjYdTMGpY1C_vj8cey:APA91bEtG5Zg9YRvWPn2bru3tkGbywzFDr2rtl_HUMQw15ONDG1HdP7cr1NtpwxCCR0I_PE1jCeFKciKX7IP55h4umYlGRVXmRwfV6-E601HKFQDsoZaMVtdZ9WVDALWUU7EDo3w4DA8",
  //     notification: { // Notification content goes here
  //       title: "Welcome Wasu",
  //       body: "All good description"
  //     }
  //   });
  //   console.log("Notification sent");
  // } catch (error) {
  //   console.log(error);
  // }
// };

// const sendNotification = async (title, body) => {
//   try {
//     for (const token of tokens) {
//       await firebase.messaging().send({
//         token,  // Use token directly from the loop
//         notification: {
//           title: title,
//           body: body
//         }
//       });
//     }
//     console.log("Notifications sent to all users");
//   } catch (error) {
//     console.log(error);
//   }
// };

// setTimeout(() => {
//   sendNotification();
// }, 4000);


// const admin = require('firebase-admin');

// admin.initializeApp();

// const message = {
//   notification: {
//     title: 'EPA fuel economy stats for new Mazda6',
//     body: 'New turbo charged 2.5L engine does 23/31/36 mpg.',
//   },
//   condition: `'auto-news' in topics && 'green-earth' in topics`,
// };
// firebase.messaging().send(message)
//   .then((resp) => {
//     console.log('Message sent successfully:', resp);
//   }).catch((err) => {
//     console.log('Failed to send the message:', err);
//   });




app.listen(process.env.PORT, () => {
    console.log(`Server listening on post ${process.env.PORT}, in ${process.env.NODE_ENV} mode`);
});

module.exports = {
    app,
};




