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
const User = require("./models/user.js");
const Notification = require("./models/Notification.js");
const WalletOne = require("./models/walletone.js");
const WalletTwo = require("./models/wallettwo.js");
const Playbet = require("./models/playbet.js");
const Currency = require("./models/currency.js");
const AppBalanceSheet = require("./models/AppBalanceSheet.js");
const cookieParser = require("cookie-parser");
const moment = require("moment-timezone");
const topwinner = require("./models/topwinner.js");
const PartnerPerformance = require("./models/PartnerPerformance.js");
const PartnerPerformancePowerball = require("./models/PartnerPerformancePowerball.jsx");
const PowerballGameTickets = require("./models/PowerballGameTickets.js");
const PowerDate = require("./models/PowerDate.js");
const PowerTime = require("./models/PowerTime.js");

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
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
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

function getPlaynumberOfLowestAmount(playinsightdata) {
  // Extract playnumbers array
  const playnumbers = playinsightdata.playzone.playnumbers;

  // Find the minimum amount in the playnumbers list
  const minAmount = Math.min(...playnumbers.map((p) => p.amount));

  // Get all playnumbers with the minimum amount
  const minAmountPlaynumbers = playnumbers.filter(
    (p) => p.amount === minAmount
  );

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

const getCurrentDate = () => {
  return moment.tz("Asia/Kolkata").format("DD-MM-YYYY");
};

const getNextDate = () => {
  return moment.tz("Asia/Kolkata").add(1, "days").format("DD-MM-YYYY");
};

// COMMENTING CRON JOB FOR NOW
// cron.schedule("*/2 * * * *", async () => {
//   console.log("Running scheduled task to add LotDates and Playzones");
//   try {
//     // Fetch all locations with automation set to 'automatic'
//     const locations = await LotLocation.find({});

//     console.log("AUTOMATIC LOCATION COUNT :: " + locations.length);

//     for (const location of locations) {
//       // Fetch times for each location
//       const times = await LotTime.find({ lotlocation: location._id });

//       for (const time of times) {
//         // Get the current date and next day's date
//         const lotdate = getCurrentDate();
//         const nextLotDate = getNextDate();

//         // Function to check and create LotDate and Playzone for a given date
//         const checkAndCreateLotDate = async (date) => {
//           const existingLotDate = await LotDate.findOne({
//             lotdate: date,
//             lottime: time._id,
//           });

//           if (!existingLotDate) {
//             // LotDate does not exist, create a new one
//             const newLotDate = await LotDate.create({
//               lotdate: date,
//               lottime: time._id,
//             });

//             console.log(
//               `Added LotDate for location ${location.lotlocation} at time ${time.lottime} on date ${date}`
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
//             console.log(
//               `LotDate already exists for location ${location.lotlocation} at time ${time.lottime} on date ${date}`
//             );
//           }
//         };

//         // Create LotDate and Playzone for current date
//         await checkAndCreateLotDate(lotdate);

//         // Create LotDate and Playzone for next day date
//         await checkAndCreateLotDate(nextLotDate);
//       }
//     }
//   } catch (error) {
//     console.error("Error running scheduled task:", error);
//   }
// });

// cron.schedule("*/5 * * * *", async () => {
//   console.log("Running automation script every ONE minutes...");
//   try {
//     const locations = await LotLocation.find({ automation: "automatic" });

//     for (const location of locations) {
//       const times = await LotTime.find({ lotlocation: location._id });

//       const automationUpdatedAt = location.automationUpdatedAt;
//       const automationUpdatedTime = moment.tz(
//         automationUpdatedAt,
//         "hh:mm A",
//         "Asia/Kolkata"
//       );
//       const automationUpdatedDate = moment.tz(
//         automationUpdatedAt,
//         "DD-MM-YYYY",
//         "Asia/Kolkata"
//       );

//       console.log(
//         `Automation Updated Date and Time for location ${
//           location.lotlocation
//         }: ${automationUpdatedTime.format(
//           "hh:mm A"
//         )} :: Date ${automationUpdatedDate.format("DD-MM-YYYY")}`
//       );

//       const now = moment.tz("Asia/Kolkata");

//       console.log("Current Time: ", now.format("hh:mm A"));
//       console.log("Current Date: ", now.format("DD-MM-YYYY"));

//       if (
//         automationUpdatedDate.format("DD-MM-YYYY") === now.format("DD-MM-YYYY")
//       ) {
//         console.log("SAME DATE");
//         for (const time of times) {
//           const lotTimeMoment = moment.tz(
//             time.lottime,
//             "hh:mm A",
//             "Asia/Kolkata"
//           );
//           console.log("###################");
//           console.log(
//             `Lot Time for location ${
//               location.lotlocation
//             }: ${lotTimeMoment.format("hh:mm A")}`
//           );

//           const isAutoUpdatetime =
//             automationUpdatedTime.isSameOrAfter(lotTimeMoment);
//           console.log(
//             `isAutoUpdatetime time ${automationUpdatedTime.format(
//               "hh:mm A"
//             )} :: ` + isAutoUpdatetime
//           );

//           // Adjust the condition to skip only if both times have passed
//           if (!isAutoUpdatetime) {
//             console.log(
//               `location ${location.lotlocation} ${lotTimeMoment.format(
//                 "hh:mm A"
//               )} as automationUpdatedAt  have passed.`
//             );
//             // Process further if only automationUpdatedAt time has passed but lottime is valid
//             if (now.isSameOrAfter(lotTimeMoment)) {
//               console.log(
//                 `location ${location.lotlocation} ${lotTimeMoment.format(
//                   "hh:mm A"
//                 )} as both automationUpdatedAt and lottime have passed.`
//               );
//               let lotdates = await LotDate.find({ lottime: time._id })
//                 .populate("lottime")
//                 .sort({ "lottime.lotdate": -1 });

//               let dateExists = false;

//               for (const date of lotdates) {
//                 if (date.lotdate === now.format("DD-MM-YYYY")) {
//                   dateExists = true;

//                   console.log("FOUND DATE :: " + date.lotdate);
//                   const scheduledDateTime = moment.tz(
//                     `${date.lotdate} ${time.lottime}`,
//                     "DD-MM-YYYY hh:mm A",
//                     "Asia/Kolkata"
//                   );

//                   if (now.isSameOrAfter(scheduledDateTime)) {
//                     console.log(
//                       `Current date and time is the same or after the provided date ${scheduledDateTime.format(
//                         "DD-MM-YYYY"
//                       )} and time. ${scheduledDateTime.format("hh:mm A")}`
//                     );
//                     const existingResult = await Result.findOne({
//                       lotdate: date._id,
//                       lottime: time._id,
//                       lotlocation: location._id,
//                     });

//                     if (!existingResult) {
//                       console.log(
//                         `No existing result found for ${lotTimeMoment.format(
//                           "hh:mm A"
//                         )}`
//                       );
//                       const playzone = await Playzone.findOne({
//                         lotlocation: location._id,
//                         lottime: time._id,
//                         lotdate: date._id,
//                       });

//                       if (!playzone) {
//                         console.error(
//                           "Playzone not found for location:",
//                           location._id,
//                           "time:",
//                           time._id,
//                           "date:",
//                           date._id
//                         );
//                         continue;
//                       }

//                       const playnumber = getPlaynumberOfLowestAmount({
//                         playzone,
//                       });
//                       const nextResultTime = getNextResultTime(
//                         times,
//                         time.lottime
//                       );

//                       // PROCESS TO SEND AMOUNT TO THE USER WALLET AND UPDATING BALANCESHEET
//                       // Find the playnumber in the playzone
//                       const playnumberEntry = playzone.playnumbers.find(
//                         (pn) => pn.playnumber === parseInt(playnumber, 10)
//                       );

//                       if (!playnumberEntry) {
//                         continue;
//                       }

//                       console.log("now getting users");
//                       // Update walletOne for each user in the playnumber's users list
//                       for (const userz of playnumberEntry.users) {
//                         console.log("GETTING EACH USER");
//                         console.log(userz);
//                         const userId = userz.userId;
//                         const amount = parseInt(userz.winningamount);

//                         const user = await User.findOne({ userId });

//                         if (!user) {
//                           continue;
//                         }

//                         console.log("SEARCHING FOR USER");
//                         console.log(user);

//                         // FOR DEPOSITING MONEY IN USER WALLET ONE

//                         const walletId = user.walletOne._id;
//                         const wallet = await WalletOne.findById(walletId);
//                         const totalBalanceAmount = parseFloat(wallet.balance);
//                         const remainingWalletBalance =
//                           totalBalanceAmount + parseFloat(amount);

//                         // Update wallet
//                         await WalletOne.findByIdAndUpdate(
//                           walletId,
//                           { balance: remainingWalletBalance },
//                           { new: true }
//                         );

//                         // FOR NOTIFICATION
//                         const notification = await Notification.create({
//                           title: "Congratulations! You won!",
//                           description: `You have won an amount of ${amount}.`,
//                         });

//                         // Add notification to the user's notifications array
//                         user.notifications.push(notification._id);
//                         await user.save();

//                         // FOR PLAYBET HISTORY
//                         const playbet = await Playbet.create({
//                           playnumbers: [
//                             {
//                               playnumber: playnumberEntry.playnumber,
//                               amount: userz.winningamount,
//                               winningamount: userz.winningamount,
//                             },
//                           ],
//                           username: user.name,
//                           userid: user.userId,
//                           currency: user.country._id.toString(), // Assuming currency is related to the user
//                           lotdate: date._id,
//                           lottime: time._id,
//                           lotlocation: location._id,
//                           walletName: wallet.walletName,
//                           gameType: "playarena",
//                         });

//                         // Add playbet history to the user's playbetHistory array
//                         user.playbetHistory.push(playbet._id);
//                         await user.save();

//                         // Creating top winner list
//                         const topWinner = await topwinner.create({
//                           userId: user.userId,
//                           name: user.name,
//                           avatar: user?.avatar,
//                           playnumber: playnumberEntry.playnumber,
//                           amount: userz.amount,
//                           winningamount: userz.winningamount,
//                           currency: user.country._id.toString(),
//                         });
//                       }

//                       // [FOR PARTNER PAYOUT]

//                       // [FOR PARTNER PAYOUT]

//                       const winningAmount = playnumberEntry.distributiveamount;

//                       // Calculate totalBetAmount by summing all amounts in playnumberEntry.playnumbers[]
//                       const totalBetAmount = playzone.playnumbers.reduce(
//                         (sum, entry) => sum + parseFloat(entry.amount),
//                         0
//                       );

//                       // Calculate totalProfit
//                       const totalProfit = totalBetAmount - winningAmount;

//                       // Find partner performance
//                       const partnerperformance =
//                         await PartnerPerformance.findOne({
//                           lotlocation: location._id,
//                           lottime: time._id,
//                           lotdate: date._id,
//                         });

//                       if (!partnerperformance) {
//                         return next(
//                           new ErrorHandler("Partner performance not found", 404)
//                         );
//                       }

//                       partnerperformance.totalAmount = totalBetAmount;
//                       partnerperformance.totalProfit = totalProfit;
//                       partnerperformance.winningAmount = winningAmount;

//                       // Initialize profitDistributiveArray
//                       const profitDistributiveArray = [];

//                       // Loop through each partner in partnerperformance.performances
//                       for (const partner of partnerperformance.performances) {
//                         // Calculate contributionAmount by summing users[].convertedAmount
//                         const contributionAmount = partner.users.reduce(
//                           (sum, user) =>
//                             sum + parseFloat(user.convertedAmount || 0),
//                           0
//                         );

//                         // Calculate contributionPercentage
//                         const contributionPercentage =
//                           (contributionAmount / totalBetAmount) * 100;

//                         // Calculate profitBasedOnContribution
//                         const profitBasedOnContribution =
//                           (contributionPercentage / 100) * totalProfit;

//                         // Update the partner's contributionAmount and contributionPercentage
//                         partner.contributionAmount = contributionAmount;
//                         partner.contributionPercentage = contributionPercentage;

//                         // Check if partnerStatus is true
//                         if (!partner.partnerStatus) continue;

//                         // Check rechargeStatus
//                         if (partner.rechargeStatus) {
//                           // Calculate partnerUserProfit
//                           const partnerUserProfit =
//                             parseFloat(partner.profitPercentage) +
//                             parseFloat(partner.rechargePercentage);

//                           // Calculate partnerUserAmount
//                           const partnerUserAmount =
//                             (partnerUserProfit / 100) *
//                             profitBasedOnContribution;

//                           // Ensure userId is unique in profitDistributiveArray
//                           const existingUser = profitDistributiveArray.find(
//                             (item) => item.userId === partner.partnerId
//                           );

//                           if (existingUser) {
//                             existingUser.amount += partnerUserAmount;
//                           } else {
//                             profitDistributiveArray.push({
//                               userId: partner.partnerId,
//                               walletId: partner.partnerWalletTwo,
//                               amount: partnerUserAmount,
//                             });
//                           }

//                           // CHECKING FOR THE PARENT PARTNER
//                           if (partner.parentPartnerId !== 1000) {
//                             const parentPartnerUserProfit =
//                               parseFloat(
//                                 partner.parentPartnerProfitPercentage
//                               ) - parseFloat(partner.profitPercentage);

//                             const parentPartnerUserAmount =
//                               (parentPartnerUserProfit / 100) *
//                               profitBasedOnContribution;

//                             // Ensure userId is unique in profitDistributiveArray
//                             const existingUser = profitDistributiveArray.find(
//                               (item) => item.userId === partner.parentPartnerId
//                             );

//                             if (existingUser) {
//                               existingUser.amount += partnerUserAmount;
//                             } else {
//                               profitDistributiveArray.push({
//                                 userId: partner.parentPartnerId,
//                                 walletId: partner.parentPartnerWalletTwo,
//                                 amount: parentPartnerUserAmount,
//                               });
//                             }
//                           }

//                           // CHECKING FOR THE PARENT PARENT PARTNER
//                           if (partner.parentParentPartnerId !== 1000) {
//                             const parentParentPartnerUserProfit =
//                               parseFloat(
//                                 partner.parentParentPartnerProfitPercentage
//                               ) -
//                               parseFloat(partner.parentPartnerProfitPercentage);

//                             const parentParentPartnerUserAmount =
//                               (parentParentPartnerUserProfit / 100) *
//                               profitBasedOnContribution;

//                             // Ensure userId is unique in profitDistributiveArray
//                             const existingUser = profitDistributiveArray.find(
//                               (item) =>
//                                 item.userId === partner.parentParentPartnerId
//                             );

//                             if (existingUser) {
//                               existingUser.amount += partnerUserAmount;
//                             } else {
//                               profitDistributiveArray.push({
//                                 userId: partner.parentParentPartnerId,
//                                 walletId: partner.parentParentPartnerWalletTwo,
//                                 amount: parentParentPartnerUserAmount,
//                               });
//                             }
//                           }
//                         } else {
//                           // Calculate partnerUserProfit
//                           const partnerUserProfit = parseFloat(
//                             partner.profitPercentage
//                           );

//                           // Calculate partnerUserAmount
//                           const partnerUserAmount =
//                             (partnerUserProfit / 100) *
//                             profitBasedOnContribution;

//                           // Ensure userId is unique in profitDistributiveArray
//                           const existingUser = profitDistributiveArray.find(
//                             (item) => item.userId === partner.partnerId
//                           );

//                           if (existingUser) {
//                             existingUser.amount += partnerUserAmount;
//                           } else {
//                             profitDistributiveArray.push({
//                               userId: partner.partnerId,
//                               walletId: partner.partnerWalletTwo,
//                               amount: partnerUserAmount,
//                             });
//                           }

//                           // CHECKING FOR THE PARENT PARTNER
//                           if (partner.parentPartnerId !== 1000) {
//                             if (partner.parentPartnerRechargeStatus) {
//                               const parentPartnerUserProfit =
//                                 parseFloat(
//                                   partner.parentPartnerProfitPercentage
//                                 ) +
//                                 parseFloat(
//                                   partner.parentPartnerRechargePercentage
//                                 ) -
//                                 parseFloat(partner.profitPercentage);

//                               const parentPartnerUserAmount =
//                                 (parentPartnerUserProfit / 100) *
//                                 profitBasedOnContribution;

//                               // Ensure userId is unique in profitDistributiveArray
//                               const existingUser = profitDistributiveArray.find(
//                                 (item) =>
//                                   item.userId === partner.parentPartnerId
//                               );

//                               if (existingUser) {
//                                 existingUser.amount += partnerUserAmount;
//                               } else {
//                                 profitDistributiveArray.push({
//                                   userId: partner.parentPartnerId,
//                                   walletId: partner.parentPartnerWalletTwo,
//                                   amount: parentPartnerUserAmount,
//                                 });
//                               }
//                             } else {
//                               const parentPartnerUserProfit =
//                                 parseFloat(
//                                   partner.parentPartnerProfitPercentage
//                                 ) - parseFloat(partner.profitPercentage);

//                               const parentPartnerUserAmount =
//                                 (parentPartnerUserProfit / 100) *
//                                 profitBasedOnContribution;

//                               // Ensure userId is unique in profitDistributiveArray
//                               const existingUser = profitDistributiveArray.find(
//                                 (item) =>
//                                   item.userId === partner.parentPartnerId
//                               );

//                               if (existingUser) {
//                                 existingUser.amount += partnerUserAmount;
//                               } else {
//                                 profitDistributiveArray.push({
//                                   userId: partner.parentPartnerId,
//                                   walletId: partner.parentPartnerWalletTwo,
//                                   amount: parentPartnerUserAmount,
//                                 });
//                               }
//                             }
//                           }

//                           // CHECKING FOR THE PARENT PARENT PARTNER
//                           if (partner.parentParentPartnerId !== 1000) {
//                             if (partner.parentParentPartnerRechargeStatus) {
//                               const parentParentPartnerUserProfit =
//                                 parseFloat(
//                                   partner.parentParentPartnerProfitPercentage
//                                 ) +
//                                 parseFloat(
//                                   partner.parentParentPartnerRechargePercentage
//                                 ) -
//                                 parseFloat(
//                                   partner.parentPartnerProfitPercentage
//                                 );

//                               const parentParentPartnerUserAmount =
//                                 (parentParentPartnerUserProfit / 100) *
//                                 profitBasedOnContribution;

//                               // Ensure userId is unique in profitDistributiveArray
//                               const existingUser = profitDistributiveArray.find(
//                                 (item) =>
//                                   item.userId === partner.parentParentPartnerId
//                               );

//                               if (existingUser) {
//                                 existingUser.amount += partnerUserAmount;
//                               } else {
//                                 profitDistributiveArray.push({
//                                   userId: partner.parentParentPartnerId,
//                                   walletId:
//                                     partner.parentParentPartnerWalletTwo,
//                                   amount: parentParentPartnerUserAmount,
//                                 });
//                               }
//                             } else {
//                               const parentParentPartnerUserProfit =
//                                 parseFloat(
//                                   partner.parentParentPartnerProfitPercentage
//                                 ) -
//                                 parseFloat(
//                                   partner.parentPartnerProfitPercentage
//                                 );

//                               const parentParentPartnerUserAmount =
//                                 (parentParentPartnerUserProfit / 100) *
//                                 profitBasedOnContribution;

//                               // Ensure userId is unique in profitDistributiveArray
//                               const existingUser = profitDistributiveArray.find(
//                                 (item) =>
//                                   item.userId === partner.parentParentPartnerId
//                               );

//                               if (existingUser) {
//                                 existingUser.amount += partnerUserAmount;
//                               } else {
//                                 profitDistributiveArray.push({
//                                   userId: partner.parentParentPartnerId,
//                                   walletId:
//                                     partner.parentParentPartnerWalletTwo,
//                                   amount: parentParentPartnerUserAmount,
//                                 });
//                               }
//                             }
//                           }
//                         }
//                       }

//                       // Update partner.profitAmount based on profitDistributiveArray
//                       for (const profitEntry of profitDistributiveArray) {
//                         const partner = partnerperformance.performances.find(
//                           (p) => p.partnerId === profitEntry.userId
//                         );

//                         if (partner) {
//                           partner.profitAmount = profitEntry.amount;
//                         }
//                       }

//                       // Save the updated partnerperformance document
//                       await partnerperformance.save();

//                       // DISTRIBUTE PROFIT TO PARTNERS
//                       for (const userz of profitDistributiveArray) {
//                         console.log("GETTING EACH USER");
//                         console.log(userz);
//                         const userId = userz.userId;
//                         const amount = parseInt(userz.amount);

//                         const user = await User.findOne({ userId });

//                         if (!user) {
//                           return next(new ErrorHandler("User not found", 404));
//                         }

//                         // FOR DEPOSITING MONEY IN USER WALLET ONE

//                         const walletId = user.walletOne._id;
//                         const wallet = await WalletOne.findById(walletId);
//                         const totalBalanceAmount = parseFloat(wallet.balance);
//                         const remainingWalletBalance =
//                           totalBalanceAmount + parseFloat(amount);

//                         // Update wallet
//                         await WalletOne.findByIdAndUpdate(
//                           walletId,
//                           { balance: remainingWalletBalance },
//                           { new: true }
//                         );

//                         // FOR NOTIFICATION
//                         const notification = await Notification.create({
//                           title: "Partner Profit",
//                           description: `Your partner profit amount ${amount} credited.`,
//                         });

//                         // Add notification to the user's notifications array
//                         user.notifications.push(notification._id);
//                         await user.save();

//                         // FOR PLAYBET HISTORY
//                         const playbet = await Playbet.create({
//                           playnumbers: [
//                             {
//                               playnumber: playnumberEntry.playnumber,
//                               amount: userz.amount,
//                               winningamount: userz.amount,
//                             },
//                           ],
//                           username: user.name,
//                           userid: user.userId,
//                           currency: user.country._id.toString(), // Assuming currency is related to the user
//                           lotdate: date._id,
//                           lottime: time._id,
//                           lotlocation: location._id,
//                           walletName: wallet.walletName,
//                           gameType: "playarena",
//                           forProcess: "partnercredit",
//                         });

//                         // Add playbet history to the user's playbetHistory array
//                         user.playbetHistory.push(playbet._id);
//                         await user.save();
//                       }

//                       // [END PARTNER PAYOUT]

//                       // FOR BALANCE SHEET

//                       // Fetch all WalletTwo balances and populate currencyId
//                       const walletTwoBalances = await WalletTwo.find(
//                         {}
//                       ).populate("currencyId");
//                       let gameBalance = 0;

//                       walletTwoBalances.forEach((wallet) => {
//                         const walletCurrencyConverter = parseFloat(
//                           wallet.currencyId.countrycurrencyvaluecomparedtoinr
//                         );
//                         gameBalance += wallet.balance * walletCurrencyConverter;
//                       });

//                       // Fetch all WalletOne balances and populate currencyId
//                       const walletOneBalances = await WalletOne.find(
//                         {}
//                       ).populate("currencyId");
//                       let withdrawalBalance = 0;

//                       walletOneBalances.forEach((wallet) => {
//                         const walletCurrencyConverter = parseFloat(
//                           wallet.currencyId.countrycurrencyvaluecomparedtoinr
//                         );
//                         withdrawalBalance +=
//                           wallet.balance * walletCurrencyConverter;
//                       });

//                       // Calculate total balance as the sum of walletOne and walletTwo balances
//                       const totalBalance = withdrawalBalance + gameBalance;

//                       // Search for the "INR" countrycurrencysymbol in the Currency Collection
//                       const currency = await Currency.findOne({
//                         countrycurrencysymbol: "INR",
//                       });
//                       if (!currency) {
//                         continue;
//                       }

//                       let existingWalletOne = await WalletOne.findOne().sort({
//                         _id: 1,
//                       }); // Sort by _id to get the first created
//                       let walletOneName = existingWalletOne
//                         ? existingWalletOne.walletName
//                         : "Wallet One";

//                       // Create a new AppBalanceSheet document
//                       const appBalanceSheet = new AppBalanceSheet({
//                         amount: playnumberEntry.distributiveamount,
//                         withdrawalbalance: withdrawalBalance,
//                         gamebalance: gameBalance,
//                         totalbalance: totalBalance,
//                         usercurrency: currency._id, // Use the _id of the found currency
//                         activityType: "Winning",
//                         userId: playnumberEntry?.users[0]?.userId || "1000",
//                         payzoneId: playzone._id,
//                         paymentProcessType: "Credit",
//                         walletName: walletOneName,
//                       });

//                       // Save the AppBalanceSheet document
//                       await appBalanceSheet.save();
//                       console.log("AppBalanceSheet Created Successfully");

//                       // END BALANCE SHEET

//                       // await Result.create({
//                       //   resultNumber: addLeadingZero(playnumber),
//                       //   lotdate: date._id,
//                       //   lottime: time._id,
//                       //   lotlocation: location._id,
//                       //   nextresulttime: nextResultTime,
//                       //   resultCreatedMethod: "automatic",
//                       // });

//                       try {
//                         // Create and save a new result document
//                         const result = await Result.create({
//                           resultNumber: addLeadingZero(playnumber),
//                           lotdate: date._id,
//                           lottime: time._id,
//                           lotlocation: location._id,
//                           nextresulttime: nextResultTime,
//                           resultCreatedMethod: "automatic",
//                         });
//                         console.log("Result created successfully:", result); // Successfully created document
//                       } catch (err) {
//                         console.error("Error creating result:", err.message); // Handle validation or save errors
//                       }

//                       console.log(
//                         `Result created for Location ${location._id}, Time ${time._id}, Date ${date._id}`
//                       );
//                     } else {
//                       console.log(
//                         "Result already exists for Location:",
//                         location.lotlocation,
//                         "Time:",
//                         time.lottime,
//                         "Date:",
//                         date.lotdate
//                       );
//                     }
//                   } else {
//                     console.log(
//                       `Current date and time is before the provided time  ${scheduledDateTime.format(
//                         "hh:mm A"
//                       )} and date.  ${scheduledDateTime.format("DD-MM-YYYY")}`
//                     );
//                   }
//                 }
//               }

//               if (!dateExists) {
//                 console.log(
//                   "Date does not exist, creating new LotDate and Playzone"
//                 );

//                 const newLotDate = await LotDate.create({
//                   lotdate: now.format("DD-MM-YYYY"),
//                   lottime: time._id,
//                 });

//                 console.log(
//                   `Added LotDate for location ${location.lotlocation} at time ${time.lottime}`
//                 );

//                 const playnumbers = createPlaynumbersArray(
//                   location.maximumNumber
//                 );
//                 const playzoneData = {
//                   lotlocation: location._id,
//                   lottime: time._id,
//                   lotdate: newLotDate._id,
//                   playnumbers,
//                 };
//                 await Playzone.create(playzoneData);

//                 console.log(
//                   `Added Playzone for location ${location.lotlocation} at time ${time.lottime} on date ${newLotDate.lotdate}`
//                 );
//               }
//             }
//           }
//         }
//       } else {
//         console.log("NOT SAME DATE");

//         const now = moment.tz("Asia/Kolkata");

//         for (const time of times) {
//           const lotTimeMoment = moment.tz(
//             time.lottime,
//             "hh:mm A",
//             "Asia/Kolkata"
//           );
//           console.log("###################");
//           console.log(
//             `Lot Time for location ${
//               location.lotlocation
//             }: ${lotTimeMoment.format("hh:mm A")}`
//           );

//           const isLotTimePassed = now.isSameOrAfter(lotTimeMoment);

//           // Adjust the condition to skip only if both times have passed
//           if (isLotTimePassed) {
//             console.log(
//               `location ${location.lotlocation} ${lotTimeMoment.format(
//                 "hh:mm A"
//               )} as lottime have passed.`
//             );

//             // Process further if only automationUpdatedAt time has passed but lottime is valid
//             if (now.isSameOrAfter(lotTimeMoment)) {
//               let lotdates = await LotDate.find({ lottime: time._id })
//                 .populate("lottime")
//                 .sort({ "lottime.lotdate": -1 });

//               let dateExists = false;

//               for (const date of lotdates) {
//                 if (date.lotdate === now.format("DD-MM-YYYY")) {
//                   dateExists = true;

//                   console.log("FOUND DATE :: " + date.lotdate);
//                   const scheduledDateTime = moment.tz(
//                     `${date.lotdate} ${time.lottime}`,
//                     "DD-MM-YYYY hh:mm A",
//                     "Asia/Kolkata"
//                   );

//                   if (now.isSameOrAfter(scheduledDateTime)) {
//                     console.log(
//                       `Current date and time is the same or after the provided date ${scheduledDateTime.format(
//                         "DD-MM-YYYY"
//                       )} and time. ${scheduledDateTime.format("hh:mm A")}`
//                     );
//                     const existingResult = await Result.findOne({
//                       lotdate: date._id,
//                       lottime: time._id,
//                       lotlocation: location._id,
//                     });

//                     if (!existingResult) {
//                       console.log(
//                         `No existing result found for ${lotTimeMoment.format(
//                           "hh:mm A"
//                         )}`
//                       );

//                       const playzone = await Playzone.findOne({
//                         lotlocation: location._id,
//                         lottime: time._id,
//                         lotdate: date._id,
//                       });

//                       if (!playzone) {
//                         console.error(
//                           "Playzone not found for location:",
//                           location._id,
//                           "time:",
//                           time._id,
//                           "date:",
//                           date._id
//                         );
//                         continue;
//                       }

//                       const playnumber = getPlaynumberOfLowestAmount({
//                         playzone,
//                       });
//                       const nextResultTime = getNextResultTime(
//                         times,
//                         time.lottime
//                       );

//                       // PROCESS TO SEND AMOUNT TO THE USER WALLET AND UPDATING BALANCESHEET
//                       // Find the playnumber in the playzone
//                       const playnumberEntry = playzone.playnumbers.find(
//                         (pn) => pn.playnumber === parseInt(playnumber, 10)
//                       );

//                       if (!playnumberEntry) {
//                         continue;
//                       }

//                       console.log("now getting users");
//                       // Update walletOne for each user in the playnumber's users list
//                       for (const userz of playnumberEntry.users) {
//                         console.log("GETTING EACH USER");
//                         console.log(userz);
//                         const userId = userz.userId;
//                         const amount = parseInt(userz.winningamount);

//                         const user = await User.findOne({ userId });

//                         if (!user) {
//                           continue;
//                         }

//                         console.log("SEARCHING FOR USER");
//                         console.log(user);

//                         // FOR DEPOSITING MONEY IN USER WALLET ONE

//                         const walletId = user.walletOne._id;
//                         const wallet = await WalletOne.findById(walletId);
//                         const totalBalanceAmount = parseFloat(wallet.balance);
//                         const remainingWalletBalance =
//                           totalBalanceAmount + parseFloat(amount);

//                         // Update wallet
//                         await WalletOne.findByIdAndUpdate(
//                           walletId,
//                           { balance: remainingWalletBalance },
//                           { new: true }
//                         );

//                         // FOR NOTIFICATION
//                         const notification = await Notification.create({
//                           title: "Congratulations! You won!",
//                           description: `You have won an amount of ${amount}.`,
//                         });

//                         // Add notification to the user's notifications array
//                         user.notifications.push(notification._id);
//                         await user.save();

//                         // FOR PLAYBET HISTORY
//                         const playbet = await Playbet.create({
//                           playnumbers: [
//                             {
//                               playnumber: playnumberEntry.playnumber,
//                               amount: userz.winningamount,
//                               winningamount: userz.winningamount,
//                             },
//                           ],
//                           username: user.name,
//                           userid: user.userId,
//                           currency: user.country._id.toString(), // Assuming currency is related to the user
//                           lotdate: date._id,
//                           lottime: time._id,
//                           lotlocation: location._id,
//                           walletName: wallet.walletName,
//                         });

//                         // Add playbet history to the user's playbetHistory array
//                         user.playbetHistory.push(playbet._id);
//                         await user.save();

//                         // Creating top winner list
//                         const topWinner = await topwinner.create({
//                           userId: user.userId,
//                           name: user.name,
//                           avatar: user?.avatar,
//                           playnumber: playnumberEntry.playnumber,
//                           amount: userz.amount,
//                           winningamount: userz.winningamount,
//                           currency: user.country._id.toString(),
//                         });
//                       }

//                       // [FOR PARTNER PAYOUT]

//                       // [FOR PARTNER PAYOUT]

//                       const winningAmount = playnumberEntry.distributiveamount;

//                       // Calculate totalBetAmount by summing all amounts in playnumberEntry.playnumbers[]
//                       const totalBetAmount = playzone.playnumbers.reduce(
//                         (sum, entry) => sum + parseFloat(entry.amount),
//                         0
//                       );

//                       // Calculate totalProfit
//                       const totalProfit = totalBetAmount - winningAmount;

//                       // Find partner performance
//                       const partnerperformance =
//                         await PartnerPerformance.findOne({
//                           lotlocation: location._id,
//                           lottime: time._id,
//                           lotdate: date._id,
//                         });

//                       if (!partnerperformance) {
//                         return next(
//                           new ErrorHandler("Partner performance not found", 404)
//                         );
//                       }

//                       partnerperformance.totalAmount = totalBetAmount;
//                       partnerperformance.totalProfit = totalProfit;
//                       partnerperformance.winningAmount = winningAmount;

//                       // Initialize profitDistributiveArray
//                       const profitDistributiveArray = [];

//                       // Loop through each partner in partnerperformance.performances
//                       for (const partner of partnerperformance.performances) {
//                         // Calculate contributionAmount by summing users[].convertedAmount
//                         const contributionAmount = partner.users.reduce(
//                           (sum, user) =>
//                             sum + parseFloat(user.convertedAmount || 0),
//                           0
//                         );

//                         // Calculate contributionPercentage
//                         const contributionPercentage =
//                           (contributionAmount / totalBetAmount) * 100;

//                         // Calculate profitBasedOnContribution
//                         const profitBasedOnContribution =
//                           (contributionPercentage / 100) * totalProfit;

//                         // Update the partner's contributionAmount and contributionPercentage
//                         partner.contributionAmount = contributionAmount;
//                         partner.contributionPercentage = contributionPercentage;

//                         // Check if partnerStatus is true
//                         if (!partner.partnerStatus) continue;

//                         // Check rechargeStatus
//                         if (partner.rechargeStatus) {
//                           // Calculate partnerUserProfit
//                           const partnerUserProfit =
//                             parseFloat(partner.profitPercentage) +
//                             parseFloat(partner.rechargePercentage);

//                           // Calculate partnerUserAmount
//                           const partnerUserAmount =
//                             (partnerUserProfit / 100) *
//                             profitBasedOnContribution;

//                           // Ensure userId is unique in profitDistributiveArray
//                           const existingUser = profitDistributiveArray.find(
//                             (item) => item.userId === partner.partnerId
//                           );

//                           if (existingUser) {
//                             existingUser.amount += partnerUserAmount;
//                           } else {
//                             profitDistributiveArray.push({
//                               userId: partner.partnerId,
//                               walletId: partner.partnerWalletTwo,
//                               amount: partnerUserAmount,
//                             });
//                           }

//                           // CHECKING FOR THE PARENT PARTNER
//                           if (partner.parentPartnerId !== 1000) {
//                             const parentPartnerUserProfit =
//                               parseFloat(
//                                 partner.parentPartnerProfitPercentage
//                               ) - parseFloat(partner.profitPercentage);

//                             const parentPartnerUserAmount =
//                               (parentPartnerUserProfit / 100) *
//                               profitBasedOnContribution;

//                             // Ensure userId is unique in profitDistributiveArray
//                             const existingUser = profitDistributiveArray.find(
//                               (item) => item.userId === partner.parentPartnerId
//                             );

//                             if (existingUser) {
//                               existingUser.amount += partnerUserAmount;
//                             } else {
//                               profitDistributiveArray.push({
//                                 userId: partner.parentPartnerId,
//                                 walletId: partner.parentPartnerWalletTwo,
//                                 amount: parentPartnerUserAmount,
//                               });
//                             }
//                           }

//                           // CHECKING FOR THE PARENT PARENT PARTNER
//                           if (partner.parentParentPartnerId !== 1000) {
//                             const parentParentPartnerUserProfit =
//                               parseFloat(
//                                 partner.parentParentPartnerProfitPercentage
//                               ) -
//                               parseFloat(partner.parentPartnerProfitPercentage);

//                             const parentParentPartnerUserAmount =
//                               (parentParentPartnerUserProfit / 100) *
//                               profitBasedOnContribution;

//                             // Ensure userId is unique in profitDistributiveArray
//                             const existingUser = profitDistributiveArray.find(
//                               (item) =>
//                                 item.userId === partner.parentParentPartnerId
//                             );

//                             if (existingUser) {
//                               existingUser.amount += partnerUserAmount;
//                             } else {
//                               profitDistributiveArray.push({
//                                 userId: partner.parentParentPartnerId,
//                                 walletId: partner.parentParentPartnerWalletTwo,
//                                 amount: parentParentPartnerUserAmount,
//                               });
//                             }
//                           }
//                         } else {
//                           // Calculate partnerUserProfit
//                           const partnerUserProfit = parseFloat(
//                             partner.profitPercentage
//                           );

//                           // Calculate partnerUserAmount
//                           const partnerUserAmount =
//                             (partnerUserProfit / 100) *
//                             profitBasedOnContribution;

//                           // Ensure userId is unique in profitDistributiveArray
//                           const existingUser = profitDistributiveArray.find(
//                             (item) => item.userId === partner.partnerId
//                           );

//                           if (existingUser) {
//                             existingUser.amount += partnerUserAmount;
//                           } else {
//                             profitDistributiveArray.push({
//                               userId: partner.partnerId,
//                               walletId: partner.partnerWalletTwo,
//                               amount: partnerUserAmount,
//                             });
//                           }

//                           // CHECKING FOR THE PARENT PARTNER
//                           if (partner.parentPartnerId !== 1000) {
//                             if (partner.parentPartnerRechargeStatus) {
//                               const parentPartnerUserProfit =
//                                 parseFloat(
//                                   partner.parentPartnerProfitPercentage
//                                 ) +
//                                 parseFloat(
//                                   partner.parentPartnerRechargePercentage
//                                 ) -
//                                 parseFloat(partner.profitPercentage);

//                               const parentPartnerUserAmount =
//                                 (parentPartnerUserProfit / 100) *
//                                 profitBasedOnContribution;

//                               // Ensure userId is unique in profitDistributiveArray
//                               const existingUser = profitDistributiveArray.find(
//                                 (item) =>
//                                   item.userId === partner.parentPartnerId
//                               );

//                               if (existingUser) {
//                                 existingUser.amount += partnerUserAmount;
//                               } else {
//                                 profitDistributiveArray.push({
//                                   userId: partner.parentPartnerId,
//                                   walletId: partner.parentPartnerWalletTwo,
//                                   amount: parentPartnerUserAmount,
//                                 });
//                               }
//                             } else {
//                               const parentPartnerUserProfit =
//                                 parseFloat(
//                                   partner.parentPartnerProfitPercentage
//                                 ) - parseFloat(partner.profitPercentage);

//                               const parentPartnerUserAmount =
//                                 (parentPartnerUserProfit / 100) *
//                                 profitBasedOnContribution;

//                               // Ensure userId is unique in profitDistributiveArray
//                               const existingUser = profitDistributiveArray.find(
//                                 (item) =>
//                                   item.userId === partner.parentPartnerId
//                               );

//                               if (existingUser) {
//                                 existingUser.amount += partnerUserAmount;
//                               } else {
//                                 profitDistributiveArray.push({
//                                   userId: partner.parentPartnerId,
//                                   walletId: partner.parentPartnerWalletTwo,
//                                   amount: parentPartnerUserAmount,
//                                 });
//                               }
//                             }
//                           }

//                           // CHECKING FOR THE PARENT PARENT PARTNER
//                           if (partner.parentParentPartnerId !== 1000) {
//                             if (partner.parentParentPartnerRechargeStatus) {
//                               const parentParentPartnerUserProfit =
//                                 parseFloat(
//                                   partner.parentParentPartnerProfitPercentage
//                                 ) +
//                                 parseFloat(
//                                   partner.parentParentPartnerRechargePercentage
//                                 ) -
//                                 parseFloat(
//                                   partner.parentPartnerProfitPercentage
//                                 );

//                               const parentParentPartnerUserAmount =
//                                 (parentParentPartnerUserProfit / 100) *
//                                 profitBasedOnContribution;

//                               // Ensure userId is unique in profitDistributiveArray
//                               const existingUser = profitDistributiveArray.find(
//                                 (item) =>
//                                   item.userId === partner.parentParentPartnerId
//                               );

//                               if (existingUser) {
//                                 existingUser.amount += partnerUserAmount;
//                               } else {
//                                 profitDistributiveArray.push({
//                                   userId: partner.parentParentPartnerId,
//                                   walletId:
//                                     partner.parentParentPartnerWalletTwo,
//                                   amount: parentParentPartnerUserAmount,
//                                 });
//                               }
//                             } else {
//                               const parentParentPartnerUserProfit =
//                                 parseFloat(
//                                   partner.parentParentPartnerProfitPercentage
//                                 ) -
//                                 parseFloat(
//                                   partner.parentPartnerProfitPercentage
//                                 );

//                               const parentParentPartnerUserAmount =
//                                 (parentParentPartnerUserProfit / 100) *
//                                 profitBasedOnContribution;

//                               // Ensure userId is unique in profitDistributiveArray
//                               const existingUser = profitDistributiveArray.find(
//                                 (item) =>
//                                   item.userId === partner.parentParentPartnerId
//                               );

//                               if (existingUser) {
//                                 existingUser.amount += partnerUserAmount;
//                               } else {
//                                 profitDistributiveArray.push({
//                                   userId: partner.parentParentPartnerId,
//                                   walletId:
//                                     partner.parentParentPartnerWalletTwo,
//                                   amount: parentParentPartnerUserAmount,
//                                 });
//                               }
//                             }
//                           }
//                         }
//                       }

//                       // Update partner.profitAmount based on profitDistributiveArray
//                       for (const profitEntry of profitDistributiveArray) {
//                         const partner = partnerperformance.performances.find(
//                           (p) => p.partnerId === profitEntry.userId
//                         );

//                         if (partner) {
//                           partner.profitAmount = profitEntry.amount;
//                         }
//                       }

//                       // Save the updated partnerperformance document
//                       await partnerperformance.save();

//                       // DISTRIBUTE PROFIT TO PARTNERS
//                       for (const userz of profitDistributiveArray) {
//                         console.log("GETTING EACH USER");
//                         console.log(userz);
//                         const userId = userz.userId;
//                         const amount = parseInt(userz.amount);

//                         const user = await User.findOne({ userId });

//                         if (!user) {
//                           return next(new ErrorHandler("User not found", 404));
//                         }

//                         // FOR DEPOSITING MONEY IN USER WALLET ONE

//                         const walletId = user.walletOne._id;
//                         const wallet = await WalletOne.findById(walletId);
//                         const totalBalanceAmount = parseFloat(wallet.balance);
//                         const remainingWalletBalance =
//                           totalBalanceAmount + parseFloat(amount);

//                         // Update wallet
//                         await WalletOne.findByIdAndUpdate(
//                           walletId,
//                           { balance: remainingWalletBalance },
//                           { new: true }
//                         );

//                         // FOR NOTIFICATION
//                         const notification = await Notification.create({
//                           title: "Partner Profit",
//                           description: `Your partner profit amount ${amount} credited.`,
//                         });

//                         // Add notification to the user's notifications array
//                         user.notifications.push(notification._id);
//                         await user.save();

//                         // FOR PLAYBET HISTORY
//                         const playbet = await Playbet.create({
//                           playnumbers: [
//                             {
//                               playnumber: playnumberEntry.playnumber,
//                               amount: userz.amount,
//                               winningamount: userz.amount,
//                             },
//                           ],
//                           username: user.name,
//                           userid: user.userId,
//                           currency: user.country._id.toString(), // Assuming currency is related to the user
//                           lotdate: date._id,
//                           lottime: time._id,
//                           lotlocation: location._id,
//                           walletName: wallet.walletName,
//                           gameType: "playarena",
//                           forProcess: "partnercredit",
//                         });

//                         // Add playbet history to the user's playbetHistory array
//                         user.playbetHistory.push(playbet._id);
//                         await user.save();
//                       }

//                       // [END PARTNER PAYOUT]

//                       // FOR BALANCE SHEET

//                       // Fetch all WalletTwo balances and populate currencyId
//                       const walletTwoBalances = await WalletTwo.find(
//                         {}
//                       ).populate("currencyId");
//                       let gameBalance = 0;

//                       walletTwoBalances.forEach((wallet) => {
//                         const walletCurrencyConverter = parseFloat(
//                           wallet.currencyId.countrycurrencyvaluecomparedtoinr
//                         );
//                         gameBalance += wallet.balance * walletCurrencyConverter;
//                       });

//                       // Fetch all WalletOne balances and populate currencyId
//                       const walletOneBalances = await WalletOne.find(
//                         {}
//                       ).populate("currencyId");
//                       let withdrawalBalance = 0;

//                       walletOneBalances.forEach((wallet) => {
//                         const walletCurrencyConverter = parseFloat(
//                           wallet.currencyId.countrycurrencyvaluecomparedtoinr
//                         );
//                         withdrawalBalance +=
//                           wallet.balance * walletCurrencyConverter;
//                       });

//                       // Calculate total balance as the sum of walletOne and walletTwo balances
//                       const totalBalance = withdrawalBalance + gameBalance;

//                       // Search for the "INR" countrycurrencysymbol in the Currency Collection
//                       const currency = await Currency.findOne({
//                         countrycurrencysymbol: "INR",
//                       });
//                       if (!currency) {
//                         continue;
//                       }

//                       let existingWalletOne = await WalletOne.findOne().sort({
//                         _id: 1,
//                       }); // Sort by _id to get the first created
//                       let walletOneName = existingWalletOne
//                         ? existingWalletOne.walletName
//                         : "Wallet One";

//                       // Create a new AppBalanceSheet document
//                       const appBalanceSheet = new AppBalanceSheet({
//                         amount: playnumberEntry.distributiveamount,
//                         withdrawalbalance: withdrawalBalance,
//                         gamebalance: gameBalance,
//                         totalbalance: totalBalance,
//                         usercurrency: currency._id, // Use the _id of the found currency
//                         activityType: "Winning",
//                         userId: playnumberEntry?.users[0]?.userId || "1000",
//                         payzoneId: playzone._id,
//                         paymentProcessType: "Credit",
//                         walletName: walletOneName,
//                       });

//                       // Save the AppBalanceSheet document
//                       await appBalanceSheet.save();
//                       console.log("AppBalanceSheet Created Successfully");
//                       console.log(
//                         "playnumberEntry?.users[0]?.userId :: " +
//                           playnumberEntry?.users[0]?.userId
//                       );

//                       // END BALANCE SHEET

//                       // await Result.create({
//                       //   resultNumber: addLeadingZero(playnumber),
//                       //   lotdate: date._id,
//                       //   lottime: time._id,
//                       //   lotlocation: location._id,
//                       //   nextresulttime: nextResultTime,
//                       //   resultCreatedMethod: "automatic",
//                       // });

//                       try {
//                         // Create and save a new result document
//                         const result = await Result.create({
//                           resultNumber: addLeadingZero(playnumber),
//                           lotdate: date._id,
//                           lottime: time._id,
//                           lotlocation: location._id,
//                           nextresulttime: nextResultTime,
//                           resultCreatedMethod: "automatic",
//                         });
//                         console.log("Result created successfully:"); // Successfully created document
//                       } catch (err) {
//                         console.error("Error creating result:", err.message); // Handle validation or save errors
//                       }

//                       console.log(
//                         `Result created for Location ${location._id}, Time ${time._id}, Date ${date._id}`
//                       );
//                     } else {
//                       console.log(
//                         "Result already exists for Location:",
//                         location.lotlocation,
//                         "Time:",
//                         time.lottime,
//                         "Date:",
//                         date.lotdate
//                       );
//                     }
//                   } else {
//                     console.log(
//                       `Current date and time is before the provided time  ${scheduledDateTime.format(
//                         "hh:mm A"
//                       )} and date.  ${scheduledDateTime.format("DD-MM-YYYY")}`
//                     );
//                   }
//                 }
//               }

//               if (!dateExists) {
//                 console.log(
//                   "Date does not exist, creating new LotDate and Playzone"
//                 );

//                 const newLotDate = await LotDate.create({
//                   lotdate: now.format("DD-MM-YYYY"),
//                   lottime: time._id,
//                 });

//                 console.log(
//                   `Added LotDate for location ${location.lotlocation} at time ${time.lottime}`
//                 );

//                 const playnumbers = createPlaynumbersArray(
//                   location.maximumNumber
//                 );
//                 const playzoneData = {
//                   lotlocation: location._id,
//                   lottime: time._id,
//                   lotdate: newLotDate._id,
//                   playnumbers,
//                 };
//                 await Playzone.create(playzoneData);

//                 console.log(
//                   `Added Playzone for location ${location.lotlocation} at time ${time.lottime} on date ${newLotDate.lotdate}`
//                 );
//               }
//             }
//           }
//         }
//       }
//     }
//   } catch (error) {
//     console.error("Error running automation script:", error);
//   }
// });

// ===================================================================
// POWERBALL DATE CREATION CRON JOB (RUNS AT 11:30 PM KOLKATA TIME)
// ===================================================================
// cron.schedule(
//   "30 23 * * *",
//   async () => {
//     console.log("⏰ Running Powerball date creation at 11:30 PM Asia/Kolkata");

//     try {
//       const currentDate = getCurrentDate();
//       const nextDate = getNextDate();
//       const powerTimes = await PowerTime.find({});

//       for (const powerTime of powerTimes) {
//         // Check and create for current date
//         await checkAndCreatePowerballDate(powerTime, currentDate);

//         // Check and create for next date
//         await checkAndCreatePowerballDate(powerTime, nextDate);
//       }

//       console.log(
//         "✅ Successfully verified/created Powerball dates for",
//         currentDate,
//         "and",
//         nextDate
//       );
//     } catch (error) {
//       console.error("❌ Failed to create Powerball dates:", error);
//       // Add your error notification logic here
//     }
//   },
//   {
//     scheduled: true,
//     timezone: "Asia/Kolkata",
//   }
// );

async function checkAndCreatePowerballDate(powerTime, dateStr) {
  try {
    // Check if PowerDate already exists
    const existingPowerDate = await PowerDate.findOne({
      powerdate: dateStr,
      powertime: powerTime._id,
    });

    if (!existingPowerDate) {
      // Create PowerDate
      const newPowerDate = await PowerDate.create({
        powerdate: dateStr,
        powertime: powerTime._id,
      });

      // Create PowerballGameTickets
      await PowerballGameTickets.create({
        powerdate: newPowerDate._id,
        powertime: powerTime._id,
        alltickets: [],
      });

      // Create PartnerPerformancePowerball if not exists
      const existingPerformance = await PartnerPerformancePowerball.findOne({
        powertime: powerTime._id,
        powerdate: newPowerDate._id,
      });

      if (!existingPerformance) {
        await PartnerPerformancePowerball.create({
          powertime: powerTime._id,
          powerdate: newPowerDate._id,
          performances: [],
        });
      }

      console.log(
        `➕ Created Powerball setup for ${powerTime.powertime} on ${dateStr}`
      );
    } else {
      console.log(
        `ℹ️ Powerball date already exists for ${powerTime.powertime} on ${dateStr}`
      );
    }
  } catch (error) {
    console.error(
      `Failed to create Powerball date for ${powerTime.powertime}`,
      error
    );
  }
}

app.listen(process.env.PORT, () => {
  console.log(
    `Server listening on port ${process.env.PORT}, in ${process.env.NODE_ENV} mode`
  );
});

module.exports = {
  app,
};

// MONGO_URI=mongodb://root:root1234@95.169.196.62:27017/sinceapp?authSource=admin
// MONGO_URI=mongodb+srv://whoami:whoami@cluster0.utfo6lu.mongodb.net/?retryWrites=true&w=majority&appName=sinceapp
