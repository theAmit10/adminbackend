const express = require("express");
const { config } = require("dotenv");
const user = require("./routes/user.js");
const result = require("./routes/result.js");
const { errorMiddleware } = require("./middlewares/error.js");
const cors = require("cors");
const { connectDb } = require("./data/database.js");
const { firebase } = require("./firebase/index.js");
const cron = require('node-cron');
const LotLocation = require('./models/location.js'); // Adjust the path to your LotLocation model
const LotTime = require('./models/lottime.js'); // Adjust the path to your LotTime model
const LotDate = require('./models/lotdate.js'); // Adjust the path to your LotDate model
const Playzone = require('./models/playapp.js'); // Adjust the path to your Playzone model

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

// Function to get current date in DD-MM-YYYY format
const getCurrentDate = () => {
  const today = new Date();
  const day = String(today.getDate()).padStart(2, '0');
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const year = today.getFullYear();
  return `${day}-${month}-${year}`;
};

// Function to create playnumbers array
const createPlaynumbersArray = (numStr) => {
  const num = parseInt(numStr, 10);
  const resultArray = [];

  for (let i = 1; i <= num; i++) {
    resultArray.push({
      playnumber: i,
      numbercount: 0,
      amount: 0,
      distributiveamount: 0,
      users: [],
    });
  }

  return resultArray;
};

// */2 * * * *

// '0 0 * * *'

// Schedule the task to run every 24 hours
cron.schedule('*/2 * * * *', async () => {
  console.log('Running scheduled task to add LotDates and Playzones');
  try {
    // Fetch all locations with automation set to 'automatic'
    const locations = await LotLocation.find({ automation: 'automatic' });

    console.log("AUTOMATIC LOCATION COUNT :: "+locations.length)

    for (const location of locations) {
      // Fetch times for each location
      const times = await LotTime.find({ lotlocation: location._id });

      for (const time of times) {
        // Create a LotDate entry for each time
        const lotdate = getCurrentDate();
        const newLotDate = await LotDate.create({ lotdate, lottime: time._id });

        console.log(`Added LotDate for location ${location.name} at time ${time.lottime}`);

        // Create Playzone entry for each LotDate
        const playnumbers = createPlaynumbersArray(location.maximumNumber);
        const playzoneData = {
          lotlocation: location._id,
          lottime: time._id,
          lotdate: newLotDate._id,
          playnumbers,
        };
        const newPlayzone = await Playzone.create(playzoneData);

        console.log(`Added Playzone for location ${location.name} at time ${time.lottime} on date ${newLotDate.lotdate}`);
      }
    }
  } catch (error) {
    console.error('Error running scheduled task:', error);
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Server listening on port ${process.env.PORT}, in ${process.env.NODE_ENV} mode`);
});

module.exports = {
  app,
};


// const express = require("express");
// const { config } = require("dotenv");
// const user = require("./routes/user.js");
// const result = require("./routes/result.js");
// const { errorMiddleware } = require("./middlewares/error.js");
// const cors = require("cors");
// const { connectDb } = require("./data/database.js");
// const { firebase } = require("./firebase/index.js");
// const cron = require('node-cron');
// const LotLocation = require('./models/location.js'); // Adjust the path to your LotLocation model
// const LotTime = require('./models/lottime.js'); // Adjust the path to your LotTime model
// const LotDate = require('./models/lotdate.js'); // Adjust the path to your LotDate model

// config({
//   path: "./data/config.env",
// });

// const app = express();

// // Using Cors 
// app.use(cors({
//   credentials: true,
//   methods: ["GET", "POST", "PUT", "DELETE"],
//   origin: [process.env.FRONTEND_URL_1, process.env.FRONTEND_URL_2]
// }));

// // Use Middleware 
// app.use(express.json());

// // for getting image
// app.use(express.static('public'));

// // Handeling Routes
// app.get("/", (req, res, next) => {
//   res.send("Namaste Codethenic");
// });

// app.use("/api/v1/user", user);
// app.use("/api/v1/result", result);

// // Using error middleware in the last 
// app.use(errorMiddleware);

// connectDb();

// const tokens = [
//   "djqkwjYdTMGpY1C_vj8cey:APA91bEtG5Zg9YRvWPn2bru3tkGbywzFDr2rtl_HUMQw15ONDG1HdP7cr1NtpwxCCR0I_PE1jCeFKciKX7IP55h4umYlGRVXmRwfV6-E601HKFQDsoZaMVtdZ9WVDALWUU7EDo3w4DA8", 
// ];

// // Function to get current date in DD-MM-YYYY format
// const getCurrentDate = () => {
//   const today = new Date();
//   const day = String(today.getDate()).padStart(2, '0');
//   const month = String(today.getMonth() + 1).padStart(2, '0');
//   const year = today.getFullYear();
//   return `${day}-${month}-${year}`;
// };

// // Schedule the task to run every 24 hours
// cron.schedule('0 0 * * *', async () => {
//   console.log('Running scheduled task to add LotDates');
//   try {
//     console.log("starting automation script")
//     // Fetch all locations with automation set to 'automatic'
//     const locations = await LotLocation.find({ automation: 'automatic' });

//     console.log("found location for automation :: "+locations.length)


//     for (const location of locations) {
//       // Fetch times for each location
//       const times = await LotTime.find({ lotlocation: location._id });

//       for (const time of times) {
//         // Create a LotDate entry for each time
//         const lotdate = getCurrentDate();
//         await LotDate.create({ lotdate, lottime: time._id });
//         console.log(`Added LotDate for location ${location.name} at time ${time.lottime}`);
//       }
//     }
//   } catch (error) {
//     console.error('Error running scheduled task:', error);
//   }
// });

// app.listen(process.env.PORT, () => {
//   console.log(`Server listening on port ${process.env.PORT}, in ${process.env.NODE_ENV} mode`);
// });

// module.exports = {
//   app,
// };


// // const express = require("express");
// // const { config } = require("dotenv");
// // const user = require("./routes/user.js");
// // const result = require("./routes/result.js");
// // const  {errorMiddleware } = require("./middlewares/error.js");
// // const cors = require("cors");
// // const {connectDb}  = require("./data/database.js");


// // const {firebase} = require("./firebase/index.js")

// // config({
// //     path: "./data/config.env",
// // });

// // const app = express();

// // // Using Cors 
// // app.use(cors({
// //     credentials: true,
// //     methods: ["GET", "POST", "PUT", "DELETE"],
// //     origin: [process.env.FRONTEND_URL_1, process.env.FRONTEND_URL_2]
// // }));

// // // Use Middleware 
// // app.use(express.json());

// // // for getting image
// // app.use(express.static('public'));

// // // Handeling Routes
// // app.get("/", (req, res, next) => {
// //     res.send("Namaste Codethenic");
// // });

// // app.use("/api/v1/user", user);
// // app.use("/api/v1/result", result);


// // // Using error middleware in the last 
// // app.use(errorMiddleware);

// // connectDb();


// // const tokens = [
// // "djqkwjYdTMGpY1C_vj8cey:APA91bEtG5Zg9YRvWPn2bru3tkGbywzFDr2rtl_HUMQw15ONDG1HdP7cr1NtpwxCCR0I_PE1jCeFKciKX7IP55h4umYlGRVXmRwfV6-E601HKFQDsoZaMVtdZ9WVDALWUU7EDo3w4DA8", 
// // ];

// // // const sendNotification = async () => {
// //   // try {
// //   //   await firebase.messaging().send({
// //   //     token: "djqkwjYdTMGpY1C_vj8cey:APA91bEtG5Zg9YRvWPn2bru3tkGbywzFDr2rtl_HUMQw15ONDG1HdP7cr1NtpwxCCR0I_PE1jCeFKciKX7IP55h4umYlGRVXmRwfV6-E601HKFQDsoZaMVtdZ9WVDALWUU7EDo3w4DA8",
// //   //     notification: { // Notification content goes here
// //   //       title: "Welcome Wasu",
// //   //       body: "All good description"
// //   //     }
// //   //   });
// //   //   console.log("Notification sent");
// //   // } catch (error) {
// //   //   console.log(error);
// //   // }
// // // };

// // // const sendNotification = async (title, body) => {
// // //   try {
// // //     for (const token of tokens) {
// // //       await firebase.messaging().send({
// // //         token,  // Use token directly from the loop
// // //         notification: {
// // //           title: title,
// // //           body: body
// // //         }
// // //       });
// // //     }
// // //     console.log("Notifications sent to all users");
// // //   } catch (error) {
// // //     console.log(error);
// // //   }
// // // };

// // // setTimeout(() => {
// // //   sendNotification();
// // // }, 4000);


// // // const admin = require('firebase-admin');

// // // admin.initializeApp();

// // // const message = {
// // //   notification: {
// // //     title: 'EPA fuel economy stats for new Mazda6',
// // //     body: 'New turbo charged 2.5L engine does 23/31/36 mpg.',
// // //   },
// // //   condition: `'auto-news' in topics && 'green-earth' in topics`,
// // // };
// // // firebase.messaging().send(message)
// // //   .then((resp) => {
// // //     console.log('Message sent successfully:', resp);
// // //   }).catch((err) => {
// // //     console.log('Failed to send the message:', err);
// // //   });




// // app.listen(process.env.PORT, () => {
// //     console.log(`Server listening on post ${process.env.PORT}, in ${process.env.NODE_ENV} mode`);
// // });

// // module.exports = {
// //     app,
// // };




