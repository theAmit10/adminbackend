const express = require("express");
const { config } = require("dotenv");
const user = require("./routes/user.js");
const result = require("./routes/result.js");
const { errorMiddleware } = require("./middlewares/error.js");
const cors = require("cors");
const { connectDb } = require("./data/database.js");
const { firebase } = require("./firebase/index.js");
const cron = require("node-cron");
const LotLocation = require("./models/lotlocation.js"); // Adjust the path to your LotLocation model
const LotTime = require("./models/lottime.js"); // Adjust the path to your LotTime model
const LotDate = require("./models/lotdate.js"); // Adjust the path to your LotDate model
const Playzone = require("./models/playapp.js"); // Adjust the path to your Playzone model
const Result = require("./models/result.js");
const cookieParser = require("cookie-parser");
const moment = require("moment");

config({
  path: "./data/config.env",
});

const app = express();

// Use Middleware
app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    origin: [
      process.env.FRONTEND_URL_1,
      process.env.FRONTEND_URL_2,
      process.env.FRONTEND_URL_3,
      process.env.FRONTEND_URL_4,
      process.env.FRONTEND_URL_5,
      process.env.FRONTEND_URL_6,
    ],
  })
);

// for getting image
app.use(express.static("public"));

// Handeling Routes
app.get("/", (req, res, next) => {
  res.send("TheLionWorld");
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
  const day = String(today.getDate()).padStart(2, "0");
  const month = String(today.getMonth() + 1).padStart(2, "0");
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

const getNextResultTime = (times, currentTime) => {
  const timeList = times.map((time) => time.lottime);
  const index = timeList.indexOf(currentTime);

  if (index === -1) {
    return timeList[0];
  }

  if (index === timeList.length - 1) {
    return timeList[0];
  }

  return timeList[index + 1];
};

const getPlaynumberOfLowestAmount = (data) => {
  if (!data.playzone || !Array.isArray(data.playzone.playnumbers)) {
    return null;
  }

  return data.playzone.playnumbers.reduce((minPlaynumber, playnumber) => {
    return playnumber.amount < minPlaynumber.amount
      ? playnumber
      : minPlaynumber;
  }, data.playzone.playnumbers[0]).playnumber;
};

//  FOR TIME FORMATING
// Options for the formatting
const options = {
  hour: "2-digit",
  minute: "2-digit",
  hour12: true, // Use 12-hour clock
};
// Create a formatter
const formatter = new Intl.DateTimeFormat("en-US", options);

function addLeadingZero(value) {
  // Convert the input to a string to handle both string and number inputs
  const stringValue = value.toString();

  // Check if the value is between 1 and 9 (inclusive) and add a leading zero
  if (
    stringValue.length === 1 &&
    parseInt(stringValue) >= 1 &&
    parseInt(stringValue) <= 9
  ) {
    return "0" + stringValue;
  }

  // If the value is 10 or more, return it as is
  return stringValue;
}

// */2 * * * *
// '0 0 * * *'

// Schedule the task to run every 24 hours 0 0 * * *
cron.schedule("0 * * * *", async () => {
  console.log("Running scheduled task to add LotDates and Playzones");
  try {
    // Fetch all locations with automation set to 'automatic'
    const locations = await LotLocation.find({ automation: "automatic" });

    console.log("AUTOMATIC LOCATION COUNT :: " + locations.length);

    for (const location of locations) {
      // Fetch times for each location
      const times = await LotTime.find({ lotlocation: location._id });

      for (const time of times) {
        // Create a LotDate entry for each time
        const lotdate = getCurrentDate();

        // Check if the LotDate already exists
        const existingLotDate = await LotDate.findOne({
          lotdate,
          lottime: time._id,
        });

        if (!existingLotDate) {
          // LotDate does not exist, create a new one
          const newLotDate = await LotDate.create({
            lotdate,
            lottime: time._id,
          });

          console.log(
            `Added LotDate for location ${location.lotlocation} at time ${time.lottime}`
          );

          // Create Playzone entry for each LotDate
          const playnumbers = createPlaynumbersArray(location.maximumNumber);
          const playzoneData = {
            lotlocation: location._id,
            lottime: time._id,
            lotdate: newLotDate._id,
            playnumbers,
          };
          const newPlayzone = await Playzone.create(playzoneData);

          console.log(
            `Added Playzone for location ${location.lotlocation} at time ${time.lottime} on date ${newLotDate.lotdate}`
          );
        } else {
          console.log(
            `LotDate already exists for location ${location.lotlocation} at time ${time.lottime} on date ${lotdate}`
          );
        }
      }
    }
  } catch (error) {
    console.error("Error running scheduled task:", error);
  }
});

// cron.schedule("*/2 * * * *", async () => {
//   console.log("Running automation script every 2 minutes...");
//   try {
//     // Fetch all locations with automation set to 'automatic'
//     const locations = await LotLocation.find({ automation: "automatic" });

//     console.log("AUTOMATIC LOCATION COUNT :: " + locations.length);

//     for (const location of locations) {
//       // Fetch times for each location
//       const times = await LotTime.find({ lotlocation: location._id });

//       console.log("AUTOMATIC TIME COUNT :: "+location.lotlocation +" :: "+ times.length);

//       for (const time of times) {
//         // Get all LotDates for the current lottime
//         let lotdates = await LotDate.find({ lottime: time._id })
//           .populate("lottime")
//           .sort({ "lottime.lotdate": -1 }); // Sort based on lotdate in descending order

//         console.log("lotdates :: "+lotdates.length)
//         // console.log(lotdates)

//         // Get current date and time using Moment.js
//         const now = moment();
//         const todayDate = now.format('DD-MM-YYYY');
//         const currentTimeString = now.format('HH:mm:ss');

//         console.log("Today date :: " + todayDate);
//         console.log("Current time :: " + currentTimeString);

//         let dateExists = false;

//         for (const date of lotdates) {
//           if (date.lotdate === todayDate) {
//             dateExists = true;

//             // Create a Moment object for the lotdate and lottime
//             const scheduledDateTime = moment(`${date.lotdate} ${time.lottime}`, 'DD-MM-YYYY HH:mm:ss');

//             console.log("Scheduled datetime :: " + scheduledDateTime.format());

//             if (currentTimeString === time.lottime || now.isSameOrAfter(scheduledDateTime)) {
//               // Check if result already exists
//               const existingResult = await Result.findOne({
//                 lotdate: date._id,
//                 lottime: time._id,
//                 lotlocation: location._id,
//               });

//               if (!existingResult) {
//                 // Get playzone and create result
//                 const playzone = await Playzone.findOne({
//                   lotlocation: location._id,
//                   lottime: time._id,
//                   lotdate: date._id,
//                 });

//                 const playnumber = getPlaynumberOfLowestAmount({ playzone });
//                 const nextResultTime = getNextResultTime(times, time.lottime);

//                 await Result.create({
//                   resultNumber: addLeadingZero(playnumber),
//                   lotdate: date._id,
//                   lottime: time._id,
//                   lotlocation: location._id,
//                   nextresulttime: nextResultTime,
//                 });

//                 console.log(
//                   `Result created for Location ${location._id}, Time ${time._id}, Date ${date._id}`
//                 );
//               }
//             } else {
//               console.log("Skipping as the scheduled time is not yet reached");
//             }
//           }
//         }

//         if (!dateExists) {
//           // Create LotDate and Playzone if current date does not exist
//           const newLotDate = await LotDate.create({
//             lotdate: todayDate,
//             lottime: time._id,
//           });

//           console.log(
//             `Added LotDate for location ${location.lotlocation} at time ${time.lottime}`
//           );

//           const playnumbers = createPlaynumbersArray(location.maximumNumber);
//           const playzoneData = {
//             lotlocation: location._id,
//             lottime: time._id,
//             lotdate: newLotDate._id,
//             playnumbers,
//           };
//           await Playzone.create(playzoneData);

//           console.log(
//             `Added Playzone for location ${location.lotlocation} at time ${time.lottime} on date ${newLotDate.lotdate}`
//           );
//         }
//       }
//     }
//   } catch (error) {
//     console.error("Error running automation script:", error);
//   }
// });

// cron.schedule("*/1 * * * *", async () => {
//   console.log("Running automation script every 2 minutes...");
//   try {
//     // Fetch all locations with automation set to 'automatic'
//     const locations = await LotLocation.find({ automation: "automatic" });
//     console.log("AUTOMATIC LOCATION COUNT :: " + locations.length);

//     for (const location of locations) {
//       // Fetch times for each location
//       const times = await LotTime.find({ lotlocation: location._id });
//       console.log(`AUTOMATIC TIME COUNT for ${location.lotlocation} :: ${times.length}`);

//       for (const time of times) {
//         // Get all LotDates for the current lottime
//         let lotdates = await LotDate.find({ lottime: time._id })
//           .populate("lottime")
//           .sort({ "lottime.lotdate": -1 }); // Sort based on lotdate in descending order

//         // console.log(`Lotdates count for time ${time.lottime} :: ${lotdates.length}`);

//         // Get current date and time using Moment.js
//         const now = moment();
//         const todayDate = now.format('DD-MM-YYYY');
//         const currentTimeString = now.format('HH:mm:ss');

//         // console.log("Today date :: " + todayDate);
//         // console.log("Current time :: " + currentTimeString);

//         let dateExists = false;

//         for (const date of lotdates) {
//           // console.log(`Checking lotdate ${date.lotdate}`);
//           if (date.lotdate === todayDate) {
//             dateExists = true;

//             // Create a Moment object for the lotdate and lottime
//             const scheduledDateTime = moment(`${date.lotdate} ${time.lottime}`, 'DD-MM-YYYY HH:mm:ss');
//             // console.log("Scheduled datetime :: " + scheduledDateTime.format());

//             if (currentTimeString === time.lottime || now.isSameOrAfter(scheduledDateTime)) {
//               console.log("Current time matches or is after scheduled time");

//               // Check if result already exists
//               const existingResult = await Result.findOne({
//                 lotdate: date._id,
//                 lottime: time._id,
//                 lotlocation: location._id,
//               });

//               if (!existingResult) {
//                 console.log("No existing result found");

//                 // Get playzone and create result
//                 const playzone = await Playzone.findOne({
//                   lotlocation: location._id,
//                   lottime: time._id,
//                   lotdate: date._id,
//                 });

//                 if (!playzone) {
//                   console.error("Playzone not found for location:", location._id, "time:", time._id, "date:", date._id);
//                   continue;
//                 }

//                 const playnumber = getPlaynumberOfLowestAmount({ playzone });
//                 const nextResultTime = getNextResultTime(times, time.lottime);

//                 await Result.create({
//                   resultNumber: addLeadingZero(playnumber),
//                   lotdate: date._id,
//                   lottime: time._id,
//                   lotlocation: location._id,
//                   nextresulttime: nextResultTime,
//                 });

//                 console.log(
//                   `Result created for Location ${location._id}, Time ${time._id}, Date ${date._id}`
//                 );
//               } else {
//                 console.log("Result already exists for Location:", location.lotlocation, "Time:", time.lottime, "Date:", date.lotdate);
//               }
//             } else {
//               console.log("Current time does not match or is before scheduled time");
//             }
//           }
//         }

//         if (!dateExists) {
//           // Create LotDate and Playzone if current date does not exist
//           console.log("Date does not exist, creating new LotDate and Playzone");

//           const newLotDate = await LotDate.create({
//             lotdate: todayDate,
//             lottime: time._id,
//           });

//           console.log(
//             `Added LotDate for location ${location.lotlocation} at time ${time.lottime}`
//           );

//           const playnumbers = createPlaynumbersArray(location.maximumNumber);
//           const playzoneData = {
//             lotlocation: location._id,
//             lottime: time._id,
//             lotdate: newLotDate._id,
//             playnumbers,
//           };
//           await Playzone.create(playzoneData);

//           console.log(
//             `Added Playzone for location ${location.lotlocation} at time ${time.lottime} on date ${newLotDate.lotdate}`
//           );
//         }
//       }
//     }
//   } catch (error) {
//     console.error("Error running automation script:", error);
//   }
// });

cron.schedule("*/15 * * * *", async () => {
  console.log("Running automation script every minute...");
  try {
    // Fetch all locations with automation set to 'automatic'
    const locations = await LotLocation.find({ automation: "automatic" });
    console.log("AUTOMATIC LOCATION COUNT :: " + locations.length);

    for (const location of locations) {
      // Fetch times for each location
      const times = await LotTime.find({ lotlocation: location._id });
      console.log(
        `AUTOMATIC TIME COUNT for ${location.lotlocation} :: ${times.length}`
      );

      for (const time of times) {
        // Get all LotDates for the current lottime
        let lotdates = await LotDate.find({ lottime: time._id })
          .populate("lottime")
          .sort({ "lottime.lotdate": -1 }); // Sort based on lotdate in descending order

        // Get current date and time using Moment.js
        const now = moment();
        const todayDate = now.format("DD-MM-YYYY");
        const currentTimeString = now.format("HH:mm:ss");

        let dateExists = false;

        for (const date of lotdates) {
          if (date.lotdate === todayDate) {
            dateExists = true;

            // Create a Moment object for the lotdate and lottime
            const scheduledDateTime = moment(
              `${date.lotdate} ${time.lottime}`,
              "DD-MM-YYYY hh:mm A"
            );

            // Log the current time and the scheduled time for debugging
            // console.log("Current time: ", now.format('HH:mm:ss'));
            // console.log("Scheduled datetime: ", scheduledDateTime.format('YYYY-MM-DD HH:mm:ss'));

            if (now.isSameOrAfter(scheduledDateTime)) {
              // console.log("Current time matches or is after scheduled time");

              // Check if result already exists
              const existingResult = await Result.findOne({
                lotdate: date._id,
                lottime: time._id,
                lotlocation: location._id,
              });

              if (!existingResult) {
                console.log("No existing result found");

                // Get playzone and create result
                const playzone = await Playzone.findOne({
                  lotlocation: location._id,
                  lottime: time._id,
                  lotdate: date._id,
                });

                if (!playzone) {
                  console.error(
                    "Playzone not found for location:",
                    location._id,
                    "time:",
                    time._id,
                    "date:",
                    date._id
                  );
                  continue;
                }

                const playnumber = getPlaynumberOfLowestAmount({ playzone });
                const nextResultTime = getNextResultTime(times, time.lottime);

                await Result.create({
                  resultNumber: addLeadingZero(playnumber),
                  lotdate: date._id,
                  lottime: time._id,
                  lotlocation: location._id,
                  nextresulttime: nextResultTime,
                });

                console.log(
                  `Result created for Location ${location._id}, Time ${time._id}, Date ${date._id}`
                );
              } else {
                console.log(
                  "Result already exists for Location:",
                  location.lotlocation,
                  "Time:",
                  time.lottime,
                  "Date:",
                  date.lotdate
                );
              }
            } else {
              console.log(
                "Current time does not match or is before scheduled time"
              );
            }
          }
        }

        if (!dateExists) {
          // Create LotDate and Playzone if current date does not exist
          console.log("Date does not exist, creating new LotDate and Playzone");

          const newLotDate = await LotDate.create({
            lotdate: todayDate,
            lottime: time._id,
          });

          console.log(
            `Added LotDate for location ${location.lotlocation} at time ${time.lottime}`
          );

          const playnumbers = createPlaynumbersArray(location.maximumNumber);
          const playzoneData = {
            lotlocation: location._id,
            lottime: time._id,
            lotdate: newLotDate._id,
            playnumbers,
          };
          await Playzone.create(playzoneData);

          console.log(
            `Added Playzone for location ${location.lotlocation} at time ${time.lottime} on date ${newLotDate.lotdate}`
          );
        }
      }
    }
  } catch (error) {
    console.error("Error running automation script:", error);
  }
});

// cron.schedule("*/2 * * * *", async () => {
//   // Runs daily at midnight
//   console.log("Running result creation automation script...");
//   try {
//     const locations = await LotLocation.find({ automation: "automatic" });
//     const now = new Date();

//     // Format the current time
//     const currentTimeString = formatter.format(now);
//     console.log("CURRENT TIME :: " + currentTimeString);

//     for (const location of locations) {
//       const times = await LotTime.find({ lotlocation: location._id });

//       for (const time of times) {
//         if (currentTimeString === time.lottime) {
//           console.log("FOUND TIME :: " + time.lottime);

//           // GETTING DATE
//           const lottimeId = time._id;
//           const lotlocationId = location._id;

//           let lotdates = await LotDate.find({})
//             .populate("lottime")
//             .sort({ "lottime.lotdate": -1 }); // Sort based on lotdate in descending order

//           if (lottimeId && lotlocationId) {
//             // Filter lotdates array based on both lottimeId and lotlocationId
//             lotdates = lotdates.filter(
//               (item) =>
//                 item.lottime._id.toString() === lottimeId._id.toString() &&
//                 item.lottime.lotlocation.toString() ===
//                   lotlocationId._id.toString()
//             );
//           } else if (lottimeId) {
//             // Filter lotdates array based on lottimeId
//             lotdates = lotdates.filter(
//               (item) => item.lottime._id.toString() === lottimeId._id.toString()
//             );
//           } else if (lotlocationId) {
//             // Filter lotdates array based on lotlocationId
//             lotdates = lotdates.filter(
//               (item) =>
//                 item.lottime.lotlocation.toString() ===
//                 lotlocationId._id.toString()
//             );
//           }

//           // END GETTING DATE

//           console.log("GETTING DATES OF THAT LOCATION");
//           // console.log("Dates :: ", lotdates);

//           // Get day, month, and year
//           const day = String(now.getDate()).padStart(2, "0"); // Add leading zero if needed
//           const month = String(now.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed, so add 1
//           const year = now.getFullYear();
//           // Format the date as DD-MM-YYYY
//           const todayDate = `${day}-${month}-${year}`;

//           console.log("Today's Date :: " + todayDate);

//           for (const date of lotdates) {
//             console.log("mine date :: ", date);
//             if (date.lotdate === todayDate) {
//               console.log("FOUND DATE :: " + date.lotdate);
//               const existingResult = await Result.findOne({
//                 lotdate: date._id,
//                 lottime: time._id,
//                 lotlocation: location._id,
//               });

//               console.log("existingResult :: ", existingResult);
//               if (!existingResult) {
//                 const playzone = await Playzone.findOne({
//                   lotlocation: location._id,
//                   lottime: time._id,
//                   lotdate: date._id,
//                 });

//                 const playnumber = getPlaynumberOfLowestAmount({ playzone });
//                 console.log("play number :: ", playnumber);
//                 const nextResultTime = getNextResultTime(times, time.lottime);
//                 console.log("next result :: ", nextResultTime);
//                 await Result.create({
//                   resultNumber: playnumber,
//                   lotdate: date._id,
//                   lottime: time._id,
//                   lotlocation: location._id,
//                   nextresulttime: nextResultTime,
//                 });

//                 console.log(
//                   `Result created for Location ${location._id}, Time ${time._id}, Date ${date._id}`
//                 );
//               }
//             }
//           }
//         }
//       }
//     }
//   } catch (error) {
//     console.error("Error running date creation automation script:", error);
//   }
// });

app.listen(process.env.PORT, () => {
  console.log(
    `Server listening on port ${process.env.PORT}, in ${process.env.NODE_ENV} mode`
  );
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
// const cron = require("node-cron");
// const LotLocation = require("./models/lotlocation.js"); // Adjust the path to your LotLocation model
// const LotTime = require("./models/lottime.js"); // Adjust the path to your LotTime model
// const LotDate = require("./models/lotdate.js"); // Adjust the path to your LotDate model
// const Playzone = require("./models/playapp.js"); // Adjust the path to your Playzone model
// const Result = require("./models/result.js");
// const cookieParser = require("cookie-parser")

// config({
//   path: "./data/config.env",
// });

// const app = express();

// // Use Middleware
// app.use(express.json());
// app.use(cookieParser())

// app.use(
//   cors({
//     credentials: true,
//     methods: ["GET", "POST", "PUT", "DELETE"],
//     origin: [process.env.FRONTEND_URL_1, process.env.FRONTEND_URL_2,process.env.FRONTEND_URL_3],
//   })
// );

// // for getting image
// app.use(express.static("public"));

// // Handeling Routes
// app.get("/", (req, res, next) => {
//   res.send("TheLionWorld");
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
//   const day = String(today.getDate()).padStart(2, "0");
//   const month = String(today.getMonth() + 1).padStart(2, "0");
//   const year = today.getFullYear();
//   return `${day}-${month}-${year}`;
// };

// // Function to create playnumbers array
// const createPlaynumbersArray = (numStr) => {
//   const num = parseInt(numStr, 10);
//   const resultArray = [];

//   for (let i = 1; i <= num; i++) {
//     resultArray.push({
//       playnumber: i,
//       numbercount: 0,
//       amount: 0,
//       distributiveamount: 0,
//       users: [],
//     });
//   }

//   return resultArray;
// };

// const getNextResultTime = (times, currentTime) => {
//   const timeList = times.map((time) => time.lottime);
//   const index = timeList.indexOf(currentTime);

//   if (index === -1) {
//     return timeList[0];
//   }

//   if (index === timeList.length - 1) {
//     return timeList[0];
//   }

//   return timeList[index + 1];
// };

// const getPlaynumberOfLowestAmount = (data) => {
//   if (!data.playzone || !Array.isArray(data.playzone.playnumbers)) {
//     return null;
//   }

//   return data.playzone.playnumbers.reduce((minPlaynumber, playnumber) => {
//     return playnumber.amount < minPlaynumber.amount
//       ? playnumber
//       : minPlaynumber;
//   }, data.playzone.playnumbers[0]).playnumber;
// };

// //  FOR TIME FORMATING
// // Options for the formatting
// const options = {
//   hour: "2-digit",
//   minute: "2-digit",
//   hour12: true, // Use 12-hour clock
// };
// // Create a formatter
// const formatter = new Intl.DateTimeFormat("en-US", options);

// // */2 * * * *
// // '0 0 * * *'

// // Schedule the task to run every 24 hours
// cron.schedule("0 0 * * *", async () => {
//     console.log("Running scheduled task to add LotDates and Playzones");
//     try {
//       // Fetch all locations with automation set to 'automatic'
//       const locations = await LotLocation.find({ automation: "automatic" });

//       console.log("AUTOMATIC LOCATION COUNT :: " + locations.length);

//       for (const location of locations) {
//         // Fetch times for each location
//         const times = await LotTime.find({ lotlocation: location._id });

//         for (const time of times) {
//           // Create a LotDate entry for each time
//           const lotdate = getCurrentDate();

//           // Check if the LotDate already exists
//           const existingLotDate = await LotDate.findOne({
//             lotdate,
//             lottime: time._id,
//           });

//           if (!existingLotDate) {
//             // LotDate does not exist, create a new one
//             const newLotDate = await LotDate.create({
//               lotdate,
//               lottime: time._id,
//             });

//             console.log(
//               `Added LotDate for location ${location.lotlocation} at time ${time.lottime}`
//             );

//             // Create Playzone entry for each LotDate
//             const playnumbers = createPlaynumbersArray(location.maximumNumber);
//             const playzoneData = {
//               lotlocation: location._id,
//               lottime: time._id,
//               lotdate: newLotDate._id,
//               playnumbers,
//             };
//             const newPlayzone = await Playzone.create(playzoneData);

//             console.log(
//               `Added Playzone for location ${location.lotlocation} at time ${time.lottime} on date ${newLotDate.lotdate}`
//             );
//           } else {
//             console.log(`LotDate already exists for location ${location.lotlocation} at time ${time.lottime} on date ${lotdate}`);
//           }
//         }
//       }
//     } catch (error) {
//       console.error("Error running scheduled task:", error);
//     }
//   });

// cron.schedule("*/30 * * * *", async () => {
//   // Runs daily at midnight
//   console.log("Running result creation automation script...");
//   try {
//     const locations = await LotLocation.find({ automation: "automatic" });
//     const now = new Date();

//     // Format the current time
//     const currentTimeString = formatter.format(now);
//     console.log("CURRENT TIME :: " + currentTimeString);

//     for (const location of locations) {
//       const times = await LotTime.find({ lotlocation: location._id });

//       for (const time of times) {
//         if (currentTimeString === time.lottime) {
//           console.log("FOUND TIME :: " + time.lottime);

//           // GETTING DATE

//           const lottimeId = time._id;
//           const lotlocationId = location._id;

//           let lotdates = await LotDate.find({})
//             .populate("lottime")
//             .sort({ "lottime.lotdate": -1 }); // Sort based on lotdate in descending order

//           if (lottimeId && lotlocationId) {
//             // Filter lotdates array based on both lottimeId and lotlocationId
//             lotdates = lotdates.filter(
//               (item) =>
//                 item.lottime._id.toString() === lottimeId._id.toString() &&
//                 item.lottime.lotlocation.toString() ===
//                   lotlocationId._id.toString()
//             );
//           } else if (lottimeId) {
//             // Filter lotdates array based on lottimeId
//             lotdates = lotdates.filter(
//               (item) => item.lottime._id.toString() === lottimeId._id.toString()
//             );
//           } else if (lotlocationId) {
//             // Filter lotdates array based on lotlocationId
//             lotdates = lotdates.filter(
//               (item) =>
//                 item.lottime.lotlocation.toString() ===
//                 lotlocationId._id.toString()
//             );
//           }

//           // END GETTING DATE

//           console.log("GETTING DATES OF THAT LOCATION");
//           // console.log("Dates :: ", lotdates);

//           // Get day, month, and year
//           const day = String(now.getDate()).padStart(2, "0"); // Add leading zero if needed
//           const month = String(now.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed, so add 1
//           const year = now.getFullYear();
//           // Format the date as DD-MM-YYYY
//           const todayDate = `${day}-${month}-${year}`;

//           console.log("Today's Date :: " + todayDate);

//           for (const date of lotdates) {
//             console.log("mine date :: ", date);
//             if (date.lotdate === todayDate) {
//               console.log("FOUND DATE :: " + date.lotdate);
//               const existingResult = await Result.findOne({
//                 lotdate: date._id,
//                 lottime: time._id,
//                 lotlocation: location._id,
//               });

//               console.log("existingResult :: ", existingResult);
//               if (!existingResult) {
//                 const playzone = await Playzone.findOne({
//                   lotlocation: location._id,
//                   lottime: time._id,
//                   lotdate: date._id,
//                 });

//                 const playnumber = getPlaynumberOfLowestAmount({ playzone });
//                 console.log("play number :: ", playnumber);
//                 const nextResultTime = getNextResultTime(times, time.lottime);
//                 console.log("next result :: ", nextResultTime);
//                 await Result.create({
//                   resultNumber: playnumber,
//                   lotdate: date._id,
//                   lottime: time._id,
//                   lotlocation: location._id,
//                   nextresulttime: nextResultTime,
//                 });

//                 console.log(
//                   `Result created for Location ${location._id}, Time ${time._id}, Date ${date._id}`
//                 );
//               }
//             }
//           }
//         }
//       }
//     }
//   } catch (error) {
//     console.error("Error running date creation automation script:", error);
//   }
// });

// app.listen(process.env.PORT, () => {
//   console.log(
//     `Server listening on port ${process.env.PORT}, in ${process.env.NODE_ENV} mode`
//   );
// });

// module.exports = {
//   app,
// };
