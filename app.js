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

function getPlaynumberOfLowestAmount(playinsightdata) {
  // Extract playnumbers array
  const playnumbers = playinsightdata.playzone.playnumbers;

  // Find the minimum amount in the playnumbers list
  const minAmount = Math.min(...playnumbers.map(p => p.amount));

  // Get all playnumbers with the minimum amount
  const minAmountPlaynumbers = playnumbers.filter(p => p.amount === minAmount);

  // If there's more than one playnumber with the minimum amount, select one randomly
  if (minAmountPlaynumbers.length > 1) {
    const randomIndex = Math.floor(Math.random() * minAmountPlaynumbers.length);
    return minAmountPlaynumbers[randomIndex].playnumber;
  }

  // Otherwise, return the playnumber of the single minimum amount
  return minAmountPlaynumbers[0].playnumber;
}


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
    // const locations = await LotLocation.find({ automation: "automatic" });
    const locations = await LotLocation.find({});

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


// cron.schedule("*/15 * * * *", async () => {
//   console.log("Running automation script every minute...");
//   try {
//     // Fetch all locations with automation set to 'automatic'
//     const locations = await LotLocation.find({ automation: "automatic" });
//     console.log("AUTOMATIC LOCATION COUNT :: " + locations.length);

//     for (const location of locations) {
//       // Fetch times for each location
//       const times = await LotTime.find({ lotlocation: location._id });
//       console.log(
//         `AUTOMATIC TIME COUNT for ${location.lotlocation} :: ${times.length}`
//       );

//       for (const time of times) {
//         // Get all LotDates for the current lottime
//         let lotdates = await LotDate.find({ lottime: time._id })
//           .populate("lottime")
//           .sort({ "lottime.lotdate": -1 }); // Sort based on lotdate in descending order

//         // Get current date and time using Moment.js
//         const now = moment();
//         const todayDate = now.format("DD-MM-YYYY");
//         const currentTimeString = now.format("HH:mm:ss");

//         let dateExists = false;

//         for (const date of lotdates) {
//           if (date.lotdate === todayDate) {
//             dateExists = true;

//             // Create a Moment object for the lotdate and lottime
//             const scheduledDateTime = moment(
//               `${date.lotdate} ${time.lottime}`,
//               "DD-MM-YYYY hh:mm A"
//             );

//             // Log the current time and the scheduled time for debugging
//             // console.log("Current time: ", now.format('HH:mm:ss'));
//             // console.log("Scheduled datetime: ", scheduledDateTime.format('YYYY-MM-DD HH:mm:ss'));

//             if (now.isSameOrAfter(scheduledDateTime)) {
//               // console.log("Current time matches or is after scheduled time");

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
//                   console.error(
//                     "Playzone not found for location:",
//                     location._id,
//                     "time:",
//                     time._id,
//                     "date:",
//                     date._id
//                   );
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
//                 console.log(
//                   "Result already exists for Location:",
//                   location.lotlocation,
//                   "Time:",
//                   time.lottime,
//                   "Date:",
//                   date.lotdate
//                 );
//               }
//             } else {
//               console.log(
//                 "Current time does not match or is before scheduled time"
//               );
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

cron.schedule("*/5 * * * *", async () => {
  console.log("Running automation script every 15 minutes...");
  try {
    const locations = await LotLocation.find({ automation: "automatic" });
    console.log("AUTOMATIC LOCATION COUNT :: " + locations.length);

    for (const location of locations) {
      const times = await LotTime.find({ lotlocation: location._id });
      console.log(
        `AUTOMATIC TIME COUNT for ${location.lotlocation} :: ${times.length}`
      );

      const automationUpdatedAt = location.automationUpdatedAt;
      const automationUpdatedTime = moment(automationUpdatedAt, "hh:mm A");

      console.log(
        `Automation Updated Time for location ${location.lotlocation}: ${automationUpdatedTime.format("hh:mm A")}`
      );

      const now = moment();
      console.log("Current Time: ", now.format("hh:mm A"));

      for (const time of times) {
        const lotTimeMoment = moment(time.lottime, "hh:mm A");
        console.log(`Lot Time for location ${location.lotlocation}: ${lotTimeMoment.format("hh:mm A")}`);

        // Adjusted logic: Only skip if both times have passed
        const isAutomationTimePassed = now.isSameOrAfter(automationUpdatedTime);
        const isLotTimePassed = now.isSameOrAfter(lotTimeMoment);

        console.log(
          `Checking times for location ${location.lotlocation}: Automation Time Passed: ${isAutomationTimePassed}, Lot Time Passed: ${isLotTimePassed}`
        );

        // Adjust the condition to skip only if both times have passed
        if (isAutomationTimePassed && isLotTimePassed && lotTimeMoment.isBefore(automationUpdatedTime)) {
          console.log(
            `Skipping location ${location.lotlocation} as both automationUpdatedAt and lottime have passed.`
          );
          continue; // Skip this iteration if both the times have passed
        }

        // Process further if only automationUpdatedAt time has passed but lottime is valid
        if (isAutomationTimePassed && now.isSameOrAfter(lotTimeMoment)) {
          let lotdates = await LotDate.find({ lottime: time._id })
            .populate("lottime")
            .sort({ "lottime.lotdate": -1 });

          let dateExists = false;

          for (const date of lotdates) {
            if (date.lotdate === now.format("DD-MM-YYYY")) {
              dateExists = true;

              const scheduledDateTime = moment(
                `${date.lotdate} ${time.lottime}`,
                "DD-MM-YYYY hh:mm A"
              );

              if (now.isSameOrAfter(scheduledDateTime)) {
                const existingResult = await Result.findOne({
                  lotdate: date._id,
                  lottime: time._id,
                  lotlocation: location._id,
                });

                if (!existingResult) {
                  console.log("No existing result found");

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

                  const playnumber = getPlaynumberOfLowestAmount({
                    playzone,
                  });
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
            console.log("Date does not exist, creating new LotDate and Playzone");

            const newLotDate = await LotDate.create({
              lotdate: now.format("DD-MM-YYYY"),
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
    }
  } catch (error) {
    console.error("Error running automation script:", error);
  }
});




app.listen(process.env.PORT, () => {
  console.log(
    `Server listening on port ${process.env.PORT}, in ${process.env.NODE_ENV} mode`
  );
});

module.exports = {
  app,
};

