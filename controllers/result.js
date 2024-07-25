const asyncError = require("../middlewares/error.js").asyncError;
const Result = require("../models/result.js");
const ErrorHandler = require("../utils/error.js");
const LotDate = require("../models/lotdate.js");
const LotTime = require("../models/lottime.js");
const LotLocation = require("../models/lotlocation.js");
const PaymentType = require("../models/paymenttype.js");
const mongoose = require("mongoose");
const moment = require("moment");
const paymenttype = require("../models/paymenttype.js");
const UpiPaymentType = require("../models/upipayment.js");
const BankPaymentType = require("../models/bankpayment.js");
const PaypalPaymentType = require("../models/paypalpayment.js");
const CryptoPaymentType = require("../models/cryptopayment.js");
const SkrillPaymentType = require("../models/skrillpayment.js");
const Playzone = require("../models/playapp.js");
const Playbet = require("../models/playbet.js");
const User = require("../models/user.js");
const Currency = require("../models/currency");
const fs = require("fs");
const path = require("path");
const { json } = require("express");
const WalletTwo = require("../models/wallettwo.js");

// ####################
// RESULTS
// ####################

// Searching for Reasult
// const results = await Result.find({}).populate("lotdate");

// const getAllResult = asyncError(async (req, res, next) => {
//   const results = await Result.find({})
//     .populate("lotdate")
//     .populate("lottime")
//     .populate("lotlocation")
//     .sort({ createdAt: -1 });

//   res.status(200).json({
//     success: true,
//     results,
//   });
// });

const getAllResult = asyncError(async (req, res, next) => {
  const results = await Result.find({})
    .populate("lotdate")
    .populate("lottime")
    .populate("lotlocation")
    .sort({ _id: -1 }); // Sort by _id in descending order

  res.status(200).json({
    success: true,
    results,
  });
});

const getAllResultAccordingToLocation = asyncError(async (req, res, next) => {
  const { locationid } = req.query;

  let results = await Result.find({})
    .populate("lotdate")
    .populate("lottime")
    .populate("lotlocation")
    .sort({ createdAt: -1 });

  if (locationid) {
    // Filter results array based on locationid
    results = results.filter(
      (item) => item.lotlocation._id.toString() === locationid
    );
  }

  // Sort the filtered results by _id in descending order
  results.sort((a, b) => (a._id < b._id ? 1 : -1));

  res.status(200).json({
    success: true,
    results,
  });
});

// const getAllResultAccordingToLocation = asyncError(
//   async (req, res, next) => {
//     const { locationid } = req.query;

//     let results = await Result.find({})
//       .populate("lotdate")
//       .populate("lottime")
//       .populate("lotlocation")
//       .sort({ createdAt: -1 });

//     if (locationid) {
//       // Filter results array based on locationid
//       results = results.filter(
//         (item) => item.lotlocation._id.toString() === locationid
//       );
//     }

//     res.status(200).json({
//       success: true,
//       results,
//     });
//   }
// );

const getNextResult = asyncError(async (req, res, next) => {
  const { locationid } = req.query;

  // Get current date and time
  const currentDate = new Date()
    .toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
    .replace(/\//g, "-");
  const currentTime = new Date().toLocaleTimeString("en-US", {
    hour12: true,
    hour: "2-digit",
    minute: "2-digit",
  });

  console.log("Current Date:", currentDate);
  console.log("Current Time:", currentTime);

  let results = await Result.find({})
    .populate("lotdate")
    .populate("lottime")
    .populate("lotlocation");

  console.log("All Results:", results.length);

  // Filter results based on current date and time
  results = results.filter((item) => {
    const lotDate = item.lotdate.lotdate;
    const lotTime = item.lottime.lottime;

    console.log("Lot Date:", lotDate, " Lot Time:", lotTime);

    // Check if lotdate is same as current date and lottime is greater than or equal to current time
    return (
      lotDate === currentDate &&
      (lotTime >= currentTime || !item.lotdate.lotdate)
    );
  });

  console.log("Filtered Results:", results);

  if (locationid) {
    results = results.filter((item) => {
      // Log the values and types for debugging
      console.log(
        "Query locationid length :: ",
        locationid.length,
        " :: ",
        locationid
      );

      console.log(
        "item.lotlocation._id.toString():",
        item.lotlocation._id.toString().length,
        " :: ",
        item.lotlocation._id.toString()
      );

      console.log(
        "Status === :: ",
        item.lotlocation._id.toString() === locationid
      );

      // Compare locationid with item.lotlocation._id as strings
      return item.lotlocation._id.toString() === locationid;
    });
  }

  console.log("Final result length:", results.length);

  res.status(200).json({
    success: true,
    results,
  });
});

const getAllResultAccordingToDateTimeLocation = asyncError(
  async (req, res, next) => {
    const { lotdateId, lottimeId, lotlocationId } = req.query;

    try {
      let results = await Result.find({})
        .populate("lotdate")
        .populate("lottime")
        .populate("lotlocation")
        .sort({ createdAt: -1 });

      if (lotdateId && lottimeId && lotlocationId) {
        // Filter results array based on all three parameters
        results = results.filter(
          (item) =>
            item.lotdate &&
            item.lottime &&
            item.lotlocation && // Ensure all populated fields are not null
            item.lotdate._id.toString() === lotdateId &&
            item.lottime._id.toString() === lottimeId &&
            item.lotlocation._id.toString() === lotlocationId
        );
      }

      res.status(200).json({
        success: true,
        results,
      });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  }
);

const getResultDetails = asyncError(async (req, res, next) => {
  const result = await Result.findById(req.params.id);

  if (!result) return next(new ErrorHandler("Result not found", 404));

  res.status(200).json({
    success: true,
    result,
  });
});

const createResult = asyncError(async (req, res, next) => {
  const { resultNumber, lotdate, lottime, lotlocation, nextresulttime } =
    req.body;
  // if (!result) return next(new ErrorHandler("Result not found", 404))
  await Result.create({
    resultNumber,
    lotdate,
    lottime,
    lotlocation,
    nextresulttime,
  });

  res.status(200).json({
    success: true,
    message: "Result Created Successfully",
  });
});

const updateResult = asyncError(async (req, res, next) => {
  const { resultNumber, nextresulttime } = req.body;

  const result = await Result.findById(req.params.id);

  if (!result) return next(new ErrorHandler("Result not found", 404));

  if (resultNumber) result.resultNumber = resultNumber;
  if (nextresulttime) result.nextresulttime = nextresulttime;

  await result.save();

  res.status(200).json({
    success: true,
    message: "Result Updated Successfully",
  });
});

// To delete a result
const deleteResult = asyncError(async (req, res, next) => {
  const result = await Result.findById(req.params.id);

  if (!result) {
    return next(new ErrorHandler("Result not found", 404));
  }

  await Result.deleteOne({ _id: req.params.id });

  res.status(200).json({
    success: true,
    message: "Result Deleted Successfully",
  });
});

// ####################
// LOT DATE
// ####################

const addLotDate = asyncError(async (req, res, next) => {
  await LotDate.create(req.body);

  res.status(201).json({
    success: true,
    message: "Date Added Successfully",
  });
});

const getAllLotDate = asyncError(async (req, res, next) => {
  const lotdates = await LotDate.find({})
    .populate("lottime")
    .sort({ createdAt: -1 });
  res.status(200).json({
    success: true,
    lotdates,
  });
});

const getAllLotDateAccordindLocationAndTime = asyncError(
  async (req, res, next) => {
    const { lottimeId, lotlocationId } = req.query;

    let lotdates = await LotDate.find({})
      .populate("lottime")
      .sort({ "lottime.lotdate": -1 }); // Sort based on lotdate in descending order

    if (lottimeId && lotlocationId) {
      // Filter lotdates array based on both lottimeId and lotlocationId
      lotdates = lotdates.filter(
        (item) =>
          item.lottime._id.toString() === lottimeId &&
          item.lottime.lotlocation.toString() === lotlocationId
      );
    } else if (lottimeId) {
      // Filter lotdates array based on lottimeId
      lotdates = lotdates.filter(
        (item) => item.lottime._id.toString() === lottimeId
      );
    } else if (lotlocationId) {
      // Filter lotdates array based on lotlocationId
      lotdates = lotdates.filter(
        (item) => item.lottime.lotlocation.toString() === lotlocationId
      );
    }

    res.status(200).json({
      success: true,
      lotdates,
    });
  }
);

const deleteLotDate = asyncError(async (req, res, next) => {
  const lotdate = await LotDate.findById(req.params.id);

  if (!lotdate) return next(new ErrorHandler("Date not found", 404));

  const results = await Result.find({ lotdate: lotdate._id });

  for (let index = 0; index < results.length; index++) {
    const result = array[index];
    result.lotdate = undefined;
    await result.save();
  }

  await lotdate.deleteOne();

  res.status(200).json({
    success: true,
    message: "Date Deleted Successfully",
  });
});

const updateDate = asyncError(async (req, res, next) => {
  const { lotdate } = req.body;

  const ldate = await LotDate.findById(req.params.id);

  if (!ldate) return next(new ErrorHandler("Date not found", 404));

  if (lotdate) ldate.lotdate = lotdate;

  await ldate.save();

  res.status(200).json({
    success: true,
    message: "Date Updated Successfully",
  });
});

// ####################
// LOT TIME
// ####################

const addLotTime = asyncError(async (req, res, next) => {
  await LotTime.create(req.body);

  res.status(201).json({
    success: true,
    message: "Time Added Successfully",
  });
});

const getAllLotTime = asyncError(async (req, res, next) => {
  //   const lottimes = await LotTime.find({}).populate("lotlocation").sort({ createdAt: -1 });

  const lottimes = await LotTime.find({}).populate("lotlocation");

  res.status(200).json({
    success: true,
    lottimes,
  });
});

const getAllLotTimeAccordindLocation = asyncError(async (req, res, next) => {
  const { locationid } = req.query;

  // let lottimes = await LotTime.find({}).populate("lotlocation").sort({ createdAt: -1 });

  let lottimes = await LotTime.find({}).populate("lotlocation");

  if (locationid) {
    // Filter lottimes array based on locationid
    lottimes = lottimes.filter(
      (item) => item.lotlocation._id.toString() === locationid
    );
  }

  res.status(200).json({
    success: true,
    lottimes,
  });
});

const deleteLotTime = asyncError(async (req, res, next) => {
  const lottime = await LotTime.findById(req.params.id);

  if (!lottime) return next(new ErrorHandler("Time not found", 404));

  const lottimes = await LotDate.find({ lottime: lottime._id });

  for (let index = 0; index < lottimes.length; index++) {
    const lottime = array[index];
    lottime.lottime = undefined;
    await lottime.save();
  }

  await lottime.deleteOne();

  res.status(200).json({
    success: true,
    message: "Time Deleted Successfully",
  });
});

const updateTime = asyncError(async (req, res, next) => {
  const { lottime } = req.body;

  const ltime = await LotTime.findById(req.params.id);

  if (!ltime) return next(new ErrorHandler("Time not found", 404));

  if (lottime) ltime.lottime = lottime;

  await ltime.save();

  res.status(200).json({
    success: true,
    message: "TIme Updated Successfully",
  });
});

// ####################
// LOT LOCATION
// ####################

const addLotLocatin = asyncError(async (req, res, next) => {
  const { lotlocation, maximumRange, maximumNumber, maximumReturn } = req.body;

  if (!lotlocation)
    return next(new ErrorHandler("enter lotlocation missing", 404));
  if (!maximumRange) return next(new ErrorHandler("enter maximum range", 404));
  if (!maximumNumber)
    return next(new ErrorHandler("enter maximum number", 404));
  if (!maximumReturn)
    return next(new ErrorHandler("enter maximum return", 404));

  await LotLocation.create(req.body);

  res.status(201).json({
    success: true,
    message: "Location Added Successfully",
  });
});

const getAllLotLocation = asyncError(async (req, res, next) => {
  //   const lotlocations = await LotLocation.find({}).sort({ createdAt: -1 });
  const lotlocations = await LotLocation.find({});

  res.status(200).json({
    success: true,
    lotlocations,
  });
});

const deleteLotLocation = asyncError(async (req, res, next) => {
  const lotlocation = await LotLocation.findById(req.params.id);

  if (!lotlocation) return next(new ErrorHandler("Location not found", 404));

  const lotlocations = await LotTime.find({ lotlocation: lotlocation._id });

  for (let index = 0; index < lotlocations.length; index++) {
    const lotlocation = array[index];
    lotlocation.lottime = undefined;
    await lotlocation.save();
  }

  await lotlocation.deleteOne();

  res.status(200).json({
    success: true,
    message: "Location Deleted Successfully",
  });
});

const updateLocation = asyncError(async (req, res, next) => {
  const {
    lotlocation,
    locationTitle,
    locationDescription,
    maximumNumber,
    maximumRange,
    maximumReturn,
  } = req.body;

  console.log("Request body:", req.body); // Log the request body to check incoming data

  const llocation = await LotLocation.findById(req.params.id);

  if (!llocation) return next(new ErrorHandler("Location not found", 404));
  if (maximumReturn !== undefined) llocation.maximumReturn = maximumReturn;
  if (lotlocation !== undefined) llocation.lotlocation = lotlocation;
  if (locationTitle !== undefined) llocation.locationTitle = locationTitle;
  if (locationDescription !== undefined)
    llocation.locationDescription = locationDescription;
  if (maximumRange !== undefined) llocation.maximumRange = maximumRange;
  if (maximumNumber !== undefined) llocation.maximumNumber = maximumNumber;

  await llocation.save();

  res.status(200).json({
    success: true,
    message: "Location Updated Successfully",
  });
});

// const getAllLotLocationWithTimes = asyncError(async (req, res, next) => {
//   // Fetch all lot locations
//   const lotlocations = await LotLocation.find({});

//   // Fetch all lot times and populate the related lotlocation field
//   const lottimes = await LotTime.find({}).populate('lotlocation');

//   // Combine data
//   const locationData = lotlocations.map(location => {
//     const timesForLocation = lottimes
//       .filter(time => time.lotlocation._id.toString() === location._id.toString())
//       .map(time => ({
//         _id: time._id,
//         time: time.lottime, // Include any other fields you need from LotTime
//         createdAt: time.createdAt
//       }));

//     return {
//       _id: location._id,
//       name: location.lotlocation,
//       limit: location.maximumRange,
//       maximumNumber:location.maximumNumber,
//       maximumReturn:location.maximumNumber,
//       times: timesForLocation,
//       createdAt: location.createdAt
//     };
//   });

//   // Send response
//   res.status(200).json({
//     success: true,
//     locationData,
//   });
// });

const getAllLotLocationWithTimes = asyncError(async (req, res, next) => {
  // Fetch all lot locations sorted by createdAt in descending order
  const lotlocations = await LotLocation.find({}).sort({ createdAt: -1 });

  // Fetch all lot times, populate the related lotlocation field, and sort by createdAt in descending order
  const lottimes = await LotTime.find({})
    .populate("lotlocation")
    .sort({ createdAt: -1 });

  // Combine data
  const locationData = lotlocations.map((location) => {
    const timesForLocation = lottimes
      .filter(
        (time) => time.lotlocation._id.toString() === location._id.toString()
      )
      .map((time) => ({
        _id: time._id,
        time: time.lottime, // Include any other fields you need from LotTime
        createdAt: time.createdAt,
      }));

    return {
      _id: location._id,
      name: location.lotlocation,
      limit: location.maximumRange,
      maximumNumber: location.maximumNumber,
      maximumReturn: location.maximumReturn,
      times: timesForLocation,
      createdAt: location.createdAt,
    };
  });

  // Send response
  res.status(200).json({
    success: true,
    locationData,
  });
});

const addPayment = asyncError(async (req, res, next) => {
  const { paymentName } = req.body;

  if (!paymentName)
    return next(new ErrorHandler("Payment name is missing", 404));

  await PaymentType.create(req.body);

  res.status(201).json({
    success: true,
    message: "Payment Added Successfully",
  });
});

const getAllPayments = asyncError(async (req, res, next) => {
  const payments = await PaymentType.find();

  res.status(200).json({
    success: true,
    payments,
  });
});

const deletePayment = asyncError(async (req, res, next) => {
  const { id } = req.params;

  const payment = await PaymentType.findByIdAndDelete(id);

  if (!payment) {
    return next(new ErrorHandler("Payment not found", 404));
  }

  res.status(200).json({
    success: true,
    message: "Payment Deleted Successfully",
  });
});

// ##############################
// UPI PAYMENT
// ##############################

const addUpiPayment = asyncError(async (req, res, next) => {
  const { upiholdername, upiid } = req.body;

  if (!upiholdername)
    return next(new ErrorHandler("UPI holder name is missing", 404));
  if (!upiid) return next(new ErrorHandler("UPI ID is missing", 404));

  await UpiPaymentType.create(req.body);

  res.status(201).json({
    success: true,
    message: "UPI Added Successfully",
  });
});

const getAllUPIPayments = asyncError(async (req, res, next) => {
  const payments = await UpiPaymentType.find();

  res.status(200).json({
    success: true,
    payments,
  });
});

const deleteUPIPayment = asyncError(async (req, res, next) => {
  const { id } = req.params;

  const payment = await UpiPaymentType.findByIdAndDelete(id);

  if (!payment) {
    return next(new ErrorHandler("UPI Payment not found", 404));
  }

  res.status(200).json({
    success: true,
    message: "UPI Payment Deleted Successfully",
  });
});

// ##############################
// Bank PAYMENT
// ##############################

const addBankPayment = asyncError(async (req, res, next) => {
  const { bankname, accountholdername, ifsccode, accountnumber } = req.body;

  if (!bankname) return next(new ErrorHandler("Bank name is missing", 404));
  if (!accountholdername)
    return next(new ErrorHandler("Account holder name is missing", 404));
  if (!ifsccode) return next(new ErrorHandler("IFSC code is missing", 404));
  if (!accountnumber)
    return next(new ErrorHandler("Account number is missing", 404));

  await BankPaymentType.create(req.body);

  res.status(201).json({
    success: true,
    message: "Bank Added Successfully",
  });
});

const getAllBankPayments = asyncError(async (req, res, next) => {
  const payments = await BankPaymentType.find();

  res.status(200).json({
    success: true,
    payments,
  });
});

const deleteBankPayment = asyncError(async (req, res, next) => {
  const { id } = req.params;

  const payment = await BankPaymentType.findByIdAndDelete(id);

  if (!payment) {
    return next(new ErrorHandler("Bank Payment not found", 404));
  }

  res.status(200).json({
    success: true,
    message: "Bank Payment Deleted Successfully",
  });
});

// ##############################
// PAYPAL PAYMENT
// ##############################

const addPaypalPayment = asyncError(async (req, res, next) => {
  const { emailaddress } = req.body;

  if (!emailaddress)
    return next(new ErrorHandler("Email address is missing", 404));

  await PaypalPaymentType.create(req.body);

  res.status(201).json({
    success: true,
    message: "Paypal Added Successfully",
  });
});

const getAllPaypalPayments = asyncError(async (req, res, next) => {
  const payments = await PaypalPaymentType.find();

  res.status(200).json({
    success: true,
    payments,
  });
});

const deletePaypalPayment = asyncError(async (req, res, next) => {
  const { id } = req.params;

  const payment = await PaypalPaymentType.findByIdAndDelete(id);

  if (!payment) {
    return next(new ErrorHandler("Paypal Payment not found", 404));
  }

  res.status(200).json({
    success: true,
    message: "Paypal Payment Deleted Successfully",
  });
});

// ##############################
// Crypto PAYMENT
// ##############################

const addCryptoPayment = asyncError(async (req, res, next) => {
  const { walletaddress, networktype } = req.body;

  if (!walletaddress)
    return next(new ErrorHandler("Wallet address is missing", 404));
  if (!networktype)
    return next(new ErrorHandler("Network type is missing", 404));

  await CryptoPaymentType.create(req.body);

  res.status(201).json({
    success: true,
    message: "Crypto Added Successfully",
  });
});

const getAllCryptoPayments = asyncError(async (req, res, next) => {
  const payments = await CryptoPaymentType.find();

  res.status(200).json({
    success: true,
    payments,
  });
});

const deleteCryptoPayment = asyncError(async (req, res, next) => {
  const { id } = req.params;

  const payment = await CryptoPaymentType.findByIdAndDelete(id);

  if (!payment) {
    return next(new ErrorHandler("Crypto Payment not found", 404));
  }

  res.status(200).json({
    success: true,
    message: "Crypto Payment Deleted Successfully",
  });
});

// ##############################
// SKRILL PAYMENT
// ##############################

const addSkrillPayment = asyncError(async (req, res, next) => {
  const { address } = req.body;

  if (!address)
    return next(
      new ErrorHandler("Email address or phone number is missing", 404)
    );

  await SkrillPaymentType.create(req.body);

  res.status(201).json({
    success: true,
    message: "Skrill Added Successfully",
  });
});

const getAllSkrillPayments = asyncError(async (req, res, next) => {
  const payments = await SkrillPaymentType.find();

  res.status(200).json({
    success: true,
    payments,
  });
});

const deleteSkrillPayment = asyncError(async (req, res, next) => {
  const { id } = req.params;

  const payment = await SkrillPaymentType.findByIdAndDelete(id);

  if (!payment) {
    return next(new ErrorHandler("Skrill Payment not found", 404));
  }

  res.status(200).json({
    success: true,
    message: "Skrill Payment Deleted Successfully",
  });
});

// ##########################
//  PLAYZONE
// ##########################

// Controller to add a new Playzone entry
// const addPlayzone = async (req, res) => {
//   const { playnumbers, amount, lotdate, lottime, lotlocation } = req.body;

//    // Validate required fields
//    if (!playnumbers || !Array.isArray(playnumbers) || playnumbers.length === 0) {
//     return next(new ErrorHandler("Please provide playnumbers array", 400));
//   }
//   if (!lotdate) {
//     return next(new ErrorHandler("Please provide lotdate", 400));
//   }
//   if (!lottime) {
//     return next(new ErrorHandler("Please provide lottime", 400));
//   }
//   if (!lotlocation) {
//     return next(new ErrorHandler("Please provide lotlocation", 400));
//   }

//   // Create a new Playzone document
//   const newPlayzone = new Playzone({
//     playnumbers,
//     amount,
//     lotdate,
//     lottime,
//     lotlocation
//   });

//   // Save the Playzone document
//   await newPlayzone.save();

//   // Update user's playzoneHistory
//   const userId = req.user._id; // Assuming user is authenticated and user ID is available in req.user

//   await User.findByIdAndUpdate(userId, {
//     $push: {
//       playzoneHistory: newPlayzone._id
//     }
//   });

//   res.status(201).json({
//     success: true,
//     message: "Playzone entry added successfully",
//     playzone: newPlayzone
//   });
// };

// FOR ALL PLAYZONE
const getAllPlay = asyncError(async (req, res, next) => {
  const plays = await Playzone.find().sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    plays,
  });
});

// GET A SINGLE PLAY ACCORDING TO LOCATION, TIME AND DATE
const getSinglePlayzone = asyncError(async (req, res, next) => {
  const { lotlocation, lottime, lotdate } = req.query;

  try {
    // Find the Playzone entry by lotlocation, lottime, and lotdate
    const playzone = await Playzone.findOne({
      lotlocation,
      lottime,
      lotdate,
    });

    if (!playzone) {
      return res.status(404).json({
        success: false,
        message: "Playzone entry not found",
      });
    }

    res.status(200).json({
      success: true,
      playzone,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve Playzone entry",
      error: error.message,
    });
  }
});

// ALL PLAYZONE FOR A SINGLE USER
const getUserPlayHistory = asyncError(async (req, res, next) => {
  const { userid } = req.query;

  const playhistory = await Playzone.find({ userId: userid });

  if (!playhistory || playhistory.length === 0) {
    return next(new ErrorHandler("No Play History found for this user", 404));
  }

  res.status(200).json({
    success: true,
    playhistory,
  });
});

// Add Playzone
const addPlayzone = asyncError(async (req, res) => {
  const { lotlocation, lottime, lotdate, playnumbers } = req.body;

  if (
    !lotlocation ||
    !lottime ||
    !lotdate ||
    !playnumbers ||
    !Array.isArray(playnumbers) ||
    playnumbers.length === 0
  ) {
    return res.status(400).json({
      success: false,
      message:
        "All fields are required and playnumbers must be a non-empty array",
    });
  }

  // Validate playnumbers
  // for (const playnumber of playnumbers) {
  //   if (!playnumber.playnumber || !playnumber.numbercount || !playnumber.amount || !playnumber.distributiveamount  ) {
  //     return res.status(400).json({
  //       success: false,
  //       message: "Each playnumber must have playnumber, numbercount, amount, distributiveamount and a non-empty users array"
  //     });
  //   }

  //   // for (const user of playnumber.users) {
  //   //   if (!user.userid || !user.username || !user.amount || !user.numberid) {
  //   //     return res.status(400).json({
  //   //       success: false,
  //   //       message: "Each user must have userid, username, amount and numberid"
  //   //     });
  //   //   }
  //   // }
  // }

  // Create a new Playzone document
  const newPlayzone = new Playzone({
    lotlocation,
    lottime,
    lotdate,
    playnumbers,
  });

  // Save the Playzone document
  await newPlayzone.save();

  // Update users' playzoneHistory
  // for (const playnumber of playnumbers) {
  //   for (const user of playnumber.users) {
  //     await User.findByIdAndUpdate(user.userid, {
  //       $push: {
  //         playzoneHistory: newPlayzone._id
  //       }
  //     });
  //   }
  // }

  res.status(201).json({
    success: true,
    message: "Playzone entry added successfully",
    playzone: newPlayzone,
  });
});

// FOR UPDATE PLAYZONE EACH OBJECT
const updatePlaynumber = asyncError(async (req, res, next) => {
  const playzoneId = req.params.id; // Assuming you pass the Playzone ID as a route parameter
  const { playnumber, numbercount, amount, distributiveamount, users } =
    req.body;

  try {
    // Find the Playzone entry by ID
    const playzone = await Playzone.findById(playzoneId);

    if (!playzone) {
      return res.status(404).json({
        success: false,
        message: "Playzone entry not found",
      });
    }

    // Find the index of the playnumber to update
    const playnumberIndex = playzone.playnumbers.findIndex(
      (pn) => pn.playnumber === playnumber
    );

    if (playnumberIndex === -1) {
      return res.status(404).json({
        success: false,
        message: `Playnumber ${playnumber} not found in Playzone entry`,
      });
    }

    // Update the playnumber object
    playzone.playnumbers[playnumberIndex].numbercount = numbercount;
    playzone.playnumbers[playnumberIndex].amount = amount;
    playzone.playnumbers[playnumberIndex].distributiveamount =
      distributiveamount;
    playzone.playnumbers[playnumberIndex].users = users;

    // Save the updated Playzone entry
    await playzone.save();

    res.status(200).json({
      success: true,
      message: `Playnumber ${playnumber} updated successfully`,
      playzone: playzone.playnumbers[playnumberIndex],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update Playnumber",
      error: error.message,
    });
  }
});

// FOR ADDING USER TO PLAYZONE
// const addUserToPlaynumber  = asyncError(async (req, res, next) => {
//   const playzoneId = req.params.id; // Assuming you pass the Playzone ID as a route parameter
//   const playnumber = parseInt(req.params.playnumber); // Assuming you pass the playnumber as a route parameter
//   const { userId, username, amount, usernumber } = req.body;

//   try {
//     // Find the Playzone entry by ID
//     const playzone = await Playzone.findById(playzoneId);

//     if (!playzone) {
//       return res.status(404).json({
//         success: false,
//         message: "Playzone entry not found"
//       });
//     }

//     // Find the index of the playnumber to update
//     const playnumberIndex = playzone.playnumbers.findIndex(pn => pn.playnumber === playnumber);

//     if (playnumberIndex === -1) {
//       return res.status(404).json({
//         success: false,
//         message: `Playnumber ${playnumber} not found in Playzone entry`
//       });
//     }

//     // Push the new user to the users array
//     playzone.playnumbers[playnumberIndex].users.push({
//       userId,
//       username,
//       amount,
//       usernumber
//     });

//     // Save the updated Playzone entry
//     await playzone.save();

//     res.status(200).json({
//       success: true,
//       message: `User added to Playnumber ${playnumber} successfully`,
//       playzone: playzone.playnumbers[playnumberIndex]
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Failed to add user to Playnumber",
//       error: error.message
//     });
//   }
// });

const addUserToPlaynumber = asyncError(async (req, res, next) => {
  const playzoneId = req.params.id; // Assuming you pass the Playzone ID as a route parameter
  const playnumber = parseInt(req.params.playnumber); // Assuming you pass the playnumber as a route parameter
  const { userId, username, amount, usernumber, winningamount } = req.body;

  try {
    // Find the Playzone entry by ID
    const playzone = await Playzone.findById(playzoneId);

    if (!playzone) {
      return res.status(404).json({
        success: false,
        message: "Playzone entry not found",
      });
    }

    // Find the index of the playnumber to update
    const playnumberIndex = playzone.playnumbers.findIndex(
      (pn) => pn.playnumber === playnumber
    );

    if (playnumberIndex === -1) {
      return res.status(404).json({
        success: false,
        message: `Playnumber ${playnumber} not found in Playzone entry`,
      });
    }

    // Push the new user to the users array
    playzone.playnumbers[playnumberIndex].users.push({
      userId,
      username,
      amount,
      usernumber,
      winningamount,
    });

    // Update numbercount and amount
    playzone.playnumbers[playnumberIndex].numbercount =
      playzone.playnumbers[playnumberIndex].users.length;
    playzone.playnumbers[playnumberIndex].amount = playzone.playnumbers[
      playnumberIndex
    ].users.reduce((total, user) => total + user.amount, 0);
    playzone.playnumbers[playnumberIndex].distributiveamount =
      playzone.playnumbers[playnumberIndex].users.reduce(
        (total, user) => total + user.winningamount,
        0
      );

    // Save the updated Playzone entry
    await playzone.save();

    res.status(200).json({
      success: true,
      message: `User added to Playnumber ${playnumber} successfully`,
      playzone: playzone.playnumbers[playnumberIndex],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to add user to Playnumber",
      error: error.message,
    });
  }
});

const addPlaybet = asyncError(async (req, res, next) => {
  const { playnumbers, lotdate, lottime, lotlocation } = req.body;
  const userId = req.user._id; // Assuming user is authenticated and user ID is available in req.user

  console.log("Username :: " + req.user.name);
  console.log("Username :: " + userId);

  // Calculate the total amount from the playnumbers array
  const totalAmount = playnumbers.reduce(
    (sum, playbet) => sum + playbet.amount,
    0
  );
  console.log("Total Amount :: " + totalAmount);

  // Find the user and update their walletTwo balance
  const user = await User.findById(userId)
    .populate("walletOne")
    .populate("walletTwo");
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  if (user.walletTwo.balance < totalAmount) {
    return res.status(400).json({
      success: false,
      message: "Insufficient balance in walletTwo",
    });
  }

  console.log("user details :: " + JSON.stringify(user));

  const walletId = user.walletTwo._id;

  console.log("Before User Wallet Two balance :: " + user.walletTwo.balance);
  console.log("Amount deducted :: " + totalAmount);

  const totalBalanceAmount = parseFloat(user.walletTwo.balance);

  console.log("Float User Wallet Two balance :: " + totalBalanceAmount);

  const remainingWalletBalance = totalBalanceAmount - parseFloat(totalAmount);
  console.log("REMAINING AMOUNT AFTER DEDUCTION :: " + remainingWalletBalance);

  // Update wallet
  const updatedWallet = await WalletTwo.findByIdAndUpdate(
    walletId,
    { balance: remainingWalletBalance },
    { new: true }
  );

  // user.walletTwo.balance = remainingWalletBalance;
  // await user.save();
  console.log("User's walletTwo updated successfully :: " + updatedWallet);

  // Create a new Playbet document
  const newPlaybet = new Playbet({
    playnumbers,
    username: req.user.name,
    userid: req.user.userId,
    lotdate,
    lottime,
    lotlocation,
  });

  console.log("New Bet :: " + JSON.stringify(newPlaybet));

  // Save the Playbet document
  await newPlaybet.save();
  console.log("New Bet Created Success");

  // Update user's playbetHistory
  await User.findByIdAndUpdate(userId, {
    $push: {
      playbetHistory: newPlaybet._id,
    },
  });

  console.log("New Bet Added to the User Betting History Success");

  console.log("Now Searcing for the Playzone of the Admin to Add user");

  // Find the Playzone entry by lotdate, lottime, and lotlocation
  const playzone = await Playzone.findOne({
    lotdate,
    lottime,
    lotlocation,
  });

  if (!playzone) {
    return res.status(404).json({
      success: false,
      message: "Playzone entry not found",
    });
  }

  console.log("New going to update the playzone");
  console.log("Playzone found :: " + JSON.stringify(playzone));
  console.log("Playnumber Array Users :: " + JSON.stringify(playnumbers));

  // Update the playnumbers in Playzone
  playnumbers.forEach((playbet) => {
    console.log("Element Playment :: ", JSON.stringify(playbet));
    console.log("Searching for the index");
    const playnumberIndex = playzone.playnumbers.findIndex(
      (pn) => pn.playnumber === playbet.playnumber
    );
    console.log("Playnumber index :: " + playnumberIndex);

    if (playnumberIndex !== -1) {
      const userIndex = playzone.playnumbers[playnumberIndex].users.findIndex(
        (user) => user.userId == req.user.userId
      );
      console.log("User index :: " + userIndex);

      if (userIndex !== -1) {
        // User exists, update amount and winningamount
        playzone.playnumbers[playnumberIndex].users[userIndex].amount +=
          playbet.amount;
        playzone.playnumbers[playnumberIndex].users[userIndex].winningamount +=
          playbet.winningamount;
      } else {
        // User does not exist, add new user
        playzone.playnumbers[playnumberIndex].users.push({
          userId: req.user.userId,
          username: req.user.name,
          amount: playbet.amount,
          usernumber: playbet.playnumber,
          winningamount: playbet.winningamount,
        });
      }

      // Update numbercount and amount
      playzone.playnumbers[playnumberIndex].numbercount =
        playzone.playnumbers[playnumberIndex].users.length;
      playzone.playnumbers[playnumberIndex].amount = playzone.playnumbers[
        playnumberIndex
      ].users.reduce((total, user) => total + user.amount, 0);
      playzone.playnumbers[playnumberIndex].distributiveamount =
        playzone.playnumbers[playnumberIndex].users.reduce(
          (total, user) => total + user.winningamount,
          0
        );
    }
  });

  // Save the updated Playzone entry
  await playzone.save();
  console.log("Playzone Update Success");

  res.status(201).json({
    success: true,
    message: "Playbet entry added successfully",
    playbet: newPlaybet,
  });
});

// const addPlaybet = asyncError(async (req, res, next) => {
//   const { playnumbers, lotdate, lottime, lotlocation } = req.body;
//   const userId = req.user._id; // Assuming user is authenticated and user ID is available in req.user
//   // const userId = req.user.userId; // Assuming user is authenticated and user ID is available in req.user

//   console.log("Username :: " + req.user.name);
//   console.log("Username :: " + userId);

//   // Create a new Playbet document
//   const newPlaybet = new Playbet({
//     playnumbers,
//     username: req.user.name,
//     userid: req.user.userId,
//     lotdate,
//     lottime,
//     lotlocation,
//   });

//   console.log("New Bet :: " + JSON.stringify(newPlaybet));

//   // Save the Playbet document
//   await newPlaybet.save();

//   console.log("New Bet Created Success");

//   // Update user's playbetHistory
//   await User.findByIdAndUpdate(userId, {
//     $push: {
//       playbetHistory: newPlaybet._id,
//     },
//   });

//   console.log("New Bet Added to the User Betting History Success");

//   console.log("Now Searcing for the Playzone of the Admin to Add user");

//   // Find the Playzone entry by lotdate, lottime, and lotlocation
//   const playzone = await Playzone.findOne({
//     lotdate,
//     lottime,
//     lotlocation,
//   });

//   if (!playzone) {
//     return res.status(404).json({
//       success: false,
//       message: "Playzone entry not found",
//     });
//   }

//   console.log("New going to update the playzone");

//   console.log("Playzone found :: " + JSON.stringify(playzone));

//   console.log("Playnumber Array Users :: " + JSON.stringify(playnumbers));

//   // // Update the playnumbers in Playzone
//   // playnumbers.forEach(playbet => {
//   //   console.log('Element Playment :: ',JSON.stringify(playbet))
//   //   console.log('Searching for the index')
//   //   const playnumberIndex = playzone.playnumbers.findIndex(pn => pn.playnumber === playbet.playnumber);
//   //   console.log('Playnumber index :: '+playnumberIndex)

//   //   if (playnumberIndex !== -1) {
//   //     // Add the user to the users array of the found playnumber
//   //     playzone.playnumbers[playnumberIndex].users.push({
//   //       userId:req.user.userId,
//   //       username: req.user.name,
//   //       amount: playbet.amount,
//   //       usernumber: playbet.playnumber,// Assuming this is the PlayNumber's ID
//   //       winningamount: playbet.winningamount
//   //     });

//   //     // Update numbercount and amount
//   //     playzone.playnumbers[playnumberIndex].numbercount += 1;
//   //     playzone.playnumbers[playnumberIndex].amount += playbet.amount;
//   //     playzone.playnumbers[playnumberIndex].distributiveamount += playbet.winningamount;
//   //   }
//   // });

//   // Update the playnumbers in Playzone
//   playnumbers.forEach((playbet) => {
//     console.log("Element Playment :: ", JSON.stringify(playbet));
//     console.log("Searching for the index");
//     const playnumberIndex = playzone.playnumbers.findIndex(
//       (pn) => pn.playnumber === playbet.playnumber
//     );
//     console.log("Playnumber index :: " + playnumberIndex);
//     if (playnumberIndex !== -1) {
//       const userIndex = playzone.playnumbers[playnumberIndex].users.findIndex(
//         (user) => user.userId == req.user.userId
//       );
//       console.log("User index index :: " + userIndex);
//       if (userIndex !== -1) {
//         // User exists, update amount and winningamount
//         playzone.playnumbers[playnumberIndex].users[userIndex].amount +=
//           playbet.amount;
//         playzone.playnumbers[playnumberIndex].users[userIndex].winningamount +=
//           playbet.winningamount;
//       } else {
//         // User does not exist, add new user
//         playzone.playnumbers[playnumberIndex].users.push({
//           userId: req.user.userId,
//           username: req.user.name,
//           amount: playbet.amount,
//           usernumber: playbet.playnumber,
//           winningamount: playbet.winningamount,
//         });
//       }

//       // Update numbercount and amount
//       playzone.playnumbers[playnumberIndex].numbercount =
//         playzone.playnumbers[playnumberIndex].users.length;
//       playzone.playnumbers[playnumberIndex].amount = playzone.playnumbers[
//         playnumberIndex
//       ].users.reduce((total, user) => total + user.amount, 0);
//       playzone.playnumbers[playnumberIndex].distributiveamount =
//         playzone.playnumbers[playnumberIndex].users.reduce(
//           (total, user) => total + user.winningamount,
//           0
//         );
//     }
//   });

//   // Save the updated Playzone entry
//   await playzone.save();

//   console.log("Playzone Update Success");

//   res.status(201).json({
//     success: true,
//     message: "Playbet entry added successfully",
//     playbet: newPlaybet,
//   });
// });

// TO GET ALL THE PLAY BET HISTORY OF A USER


const getUserPlaybets = asyncError(async (req, res, next) => {
  const userId = req.user._id; // Assuming user is authenticated and user ID is available in req.user

  try {
    // Find the user by ID to get the playbetHistory
    const user = await User.findById(userId).populate({
      path: "playbetHistory",
      populate: [
        { path: "lotdate", model: "LotDate" },
        { path: "lottime", model: "LotTime" },
        { path: "lotlocation", model: "LotLocation" },
      ],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Get the playbetHistory array from the user document
    let playbets = user.playbetHistory;

    // Sort playbets by createdAt in descending order
    playbets = playbets.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json({
      success: true,
      playbets,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve playbets",
      error: error.message,
    });
  }
});

// const getUserPlaybets = asyncError(async (req, res, next) => {
//   const userId = req.user._id; // Assuming user is authenticated and user ID is available in req.user

//   try {
//     // Find the user by ID to get the playbetHistory
//     const user = await User.findById(userId).populate({
//       path: "playbetHistory",
//       populate: [
//         { path: "lotdate", model: "LotDate" },
//         { path: "lottime", model: "LotTime" },
//         { path: "lotlocation", model: "LotLocation" },
//       ],
//     });

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: "User not found",
//       });
//     }

//     // Get the playbetHistory array from the user document
//     const playbets = user.playbetHistory;

//     res.status(200).json({
//       success: true,
//       playbets,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Failed to retrieve playbets",
//       error: error.message,
//     });
//   }
// });

//#####################################
// CURRENCY MODULE
//#####################################

// Create a new currency
const createCurrency = asyncError(async (req, res, next) => {
  const {
    countryname,
    countryicon,
    countrycurrencysymbol,
    countrycurrencyvaluecomparedtoinr,
  } = req.body;

  if (!countryname)
    return next(new ErrorHandler("country name is missing", 404));

  if (!countrycurrencysymbol)
    return next(new ErrorHandler("country currency symbol is missing", 404));

  if (!countrycurrencyvaluecomparedtoinr)
    return next(
      new ErrorHandler("country currency value compared to inr is missing", 404)
    );

  if (!req.file) return next(new ErrorHandler("country icon is missing", 404));

  const newCurrency = await Currency.create({
    countryname,
    countryicon: req.file ? req.file.filename : undefined,
    countrycurrencysymbol,
    countrycurrencyvaluecomparedtoinr,
  });

  res.status(201).json({
    success: true,
    currency: newCurrency,
  });
});

// Get all currencies
const getAllCurrencies = asyncError(async (req, res, next) => {
  const currencies = await Currency.find();

  res.status(200).json({
    success: true,
    currencies,
  });
});

// Update a currency
const updateCurrency = asyncError(async (req, res, next) => {
  const { id } = req.params;
  const {
    countryname,
    countryicon,
    countrycurrencysymbol,
    countrycurrencyvaluecomparedtoinr,
  } = req.body;

  const updatedCurrency = await Currency.findByIdAndUpdate(
    id,
    {
      countryname,
      countryicon,
      countrycurrencysymbol,
      countrycurrencyvaluecomparedtoinr,
    },
    { new: true }
  );

  if (!updatedCurrency) {
    return res.status(404).json({
      success: false,
      message: "Currency not found",
    });
  }

  res.status(200).json({
    success: true,
    currency: updatedCurrency,
  });
});

// // Delete a currency
// const deleteCurrency = asyncError(async (req, res, next) => {
//   const { id } = req.params;

//   const deletedCurrency = await Currency.findByIdAndDelete(id);

//   if (!deletedCurrency) {
//     return res.status(404).json({
//       success: false,
//       message: "Currency not found",
//     });
//   }

//   res.status(200).json({
//     success: true,
//     message: "Currency deleted successfully",
//   });
// });

// Delete a currency
const deleteCurrency = asyncError(async (req, res, next) => {
  const { id } = req.params;

  const currency = await Currency.findById(id);

  if (!currency) {
    return next(new ErrorHandler("Currency not found", 404));
  }

  // Delete the associated image file
  const imagePath = path.join(
    __dirname,
    "../public/uploads/currency",
    currency.countryicon
  );

  fs.unlink(imagePath, async (err) => {
    if (err) {
      return next(
        new ErrorHandler("Failed to delete associated image file", 500)
      );
    }

    await currency.deleteOne();

    res.status(200).json({
      success: true,
      message: "Currency deleted successfully",
    });
  });
});

module.exports = {
  createCurrency,
  getAllCurrencies,
  updateCurrency,
  deleteCurrency,
  getAllResult,
  getAllResultAccordingToLocation,
  getNextResult,
  getAllResultAccordingToDateTimeLocation,
  getResultDetails,
  createResult,
  updateResult,
  deleteResult,
  addLotDate,
  getAllLotDate,
  getAllLotDateAccordindLocationAndTime,
  deleteLotDate,
  updateDate,
  addLotTime,
  getAllLotTime,
  getAllLotTimeAccordindLocation,
  deleteLotTime,
  updateTime,
  addLotLocatin,
  getAllLotLocation,
  deleteLotLocation,
  updateLocation,
  addPayment,
  getAllPayments,
  deletePayment,
  addUpiPayment,
  getAllUPIPayments,
  deleteUPIPayment,
  addBankPayment,
  getAllBankPayments,
  deleteBankPayment,
  addPaypalPayment,
  getAllPaypalPayments,
  deletePaypalPayment,
  addCryptoPayment,
  getAllCryptoPayments,
  deleteCryptoPayment,
  addSkrillPayment,
  getAllSkrillPayments,
  deleteSkrillPayment,
  addPlayzone,
  getAllPlay,
  getUserPlayHistory,
  updatePlaynumber,
  addUserToPlaynumber,
  addPlaybet,
  getSinglePlayzone,
  getUserPlaybets,
  getAllLotLocationWithTimes,
};

// const asyncError = require("../middlewares/error.js").asyncError;
// const  Result  = require("../models/result.js");
// const ErrorHandler = require("../utils/error.js");
// const  LotDate  = require("../models/lotdate.js");
// const  LotTime  = require("../models/lottime.js");
// const  LotLocation  = require("../models/lotlocation.js");
// const mongoose = require('mongoose');
// const moment = require("moment");
// // ####################
// // RESULTS
// // ####################

// // Searching for Reasult
// // const results = await Result.find({}).populate("lotdate");

// const getAllResult = asyncError(async (req, res, next) => {
//   const results = await Result.find({})
//     .populate("lotdate")
//     .populate("lottime")
//     .populate("lotlocation")
//     .sort({ createdAt: -1 });

//   res.status(200).json({
//     success: true,
//     results,
//   });
// });

// const getAllResultAccordingToLocation = asyncError(
//   async (req, res, next) => {
//     const { locationid } = req.query;

//     let results = await Result.find({})
//       .populate("lotdate")
//       .populate("lottime")
//       .populate("lotlocation")
//       .sort({ createdAt: -1 });

//     if (locationid) {
//       // Filter results array based on locationid
//       results = results.filter(
//         (item) => item.lotlocation._id.toString() === locationid
//       );
//     }

//     res.status(200).json({
//       success: true,
//       results,
//     });
//   }
// );

// const getNextResult = asyncError(
//   async (req, res, next) => {
//     const { locationid } = req.query;

//     // Get current date and time
//     const currentDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
//     const currentTime = new Date().toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit' });

//     console.log("Current Date:", currentDate);
//     console.log("Current Time:", currentTime);

//     let results = await Result.find({})
//       .populate("lotdate")
//       .populate("lottime")
//       .populate("lotlocation");

//     console.log("All Results:", results.length);

//     // Filter results based on current date and time
//     results = results.filter(item => {
//       const lotDate = item.lotdate.lotdate;
//       const lotTime = item.lottime.lottime;

//       console.log("Lot Date:", lotDate," Lot Time:", lotTime);

//       // Check if lotdate is same as current date and lottime is greater than or equal to current time
//       return lotDate === currentDate && (lotTime >= currentTime || !item.lotdate.lotdate);
//     });

//     console.log("Filtered Results:", results);

//     if (locationid) {
//       results = results.filter(item => {
//           // Log the values and types for debugging
//           console.log("Query locationid length :: ", locationid.length," :: ",locationid);

//           console.log("item.lotlocation._id.toString():", item.lotlocation._id.toString().length," :: ",item.lotlocation._id.toString());

//           console.log("Status === :: ",item.lotlocation._id.toString() === locationid)

//           // Compare locationid with item.lotlocation._id as strings
//           return item.lotlocation._id.toString() === locationid;
//       });

//   }

// console.log("Final result length:", results.length);

//     res.status(200).json({
//       success: true,
//       results,
//     });
//   }
// );

// const getAllResultAccordingToDateTimeLocation = asyncError(
//   async (req, res, next) => {
//     const { lotdateId, lottimeId, lotlocationId } = req.query;

//     try {
//       let results = await Result.find({})
//         .populate("lotdate")
//         .populate("lottime")
//         .populate("lotlocation")
//         .sort({ createdAt: -1 });

//       if (lotdateId && lottimeId && lotlocationId) {
//         // Filter results array based on all three parameters
//         results = results.filter(
//           (item) =>
//             item.lotdate &&
//             item.lottime &&
//             item.lotlocation && // Ensure all populated fields are not null
//             item.lotdate._id.toString() === lotdateId &&
//             item.lottime._id.toString() === lottimeId &&
//             item.lotlocation._id.toString() === lotlocationId
//         );
//       }

//       res.status(200).json({
//         success: true,
//         results,
//       });
//     } catch (error) {
//       console.error(error);
//       res
//         .status(500)
//         .json({ success: false, message: "Internal Server Error" });
//     }
//   }
// );

// const getResultDetails = asyncError(async (req, res, next) => {
//   const result = await Result.findById(req.params.id);

//   if (!result) return next(new ErrorHandler("Result not found", 404));

//   res.status(200).json({
//     success: true,
//     result,
//   });
// });

// const createResult = asyncError(async (req, res, next) => {
//   const { resultNumber, lotdate, lottime, lotlocation,nextresulttime } = req.body;
//   // if (!result) return next(new ErrorHandler("Result not found", 404))
//   await Result.create({
//     resultNumber,
//     lotdate,
//     lottime,
//     lotlocation,
//     nextresulttime
//   });

//   res.status(200).json({
//     success: true,
//     message: "Result Created Successfully",
//   });
// });

// const updateResult = asyncError(async (req, res, next) => {
//   const { resultNumber,nextresulttime } = req.body;

//   const result = await Result.findById(req.params.id);

//   if (!result) return next(new ErrorHandler("Result not found", 404));

//   if (resultNumber) result.resultNumber = resultNumber;
//   if (nextresulttime) result.nextresulttime = nextresulttime;

//   await result.save();

//   res.status(200).json({
//     success: true,
//     message: "Result Updated Successfully",
//   });
// });

// // To delete a result
// const deleteResult = asyncError(async (req, res, next) => {
//   const result = await Result.findById(req.params.id);

//   if (!result) {
//     return next(new ErrorHandler("Result not found", 404));
//   }

//   await Result.deleteOne({ _id: req.params.id });

//   res.status(200).json({
//     success: true,
//     message: "Result Deleted Successfully",
//   });
// });

// // ####################
// // LOT DATE
// // ####################

// const addLotDate = asyncError(async (req, res, next) => {
//   await LotDate.create(req.body);

//   res.status(201).json({
//     success: true,
//     message: "Date Added Successfully",
//   });
// });

// const getAllLotDate = asyncError(async (req, res, next) => {
//   const lotdates = await LotDate.find({}).populate("lottime").sort({ createdAt: -1 });
//   res.status(200).json({
//     success: true,
//     lotdates,
//   });
// });

// const getAllLotDateAccordindLocationAndTime = asyncError(
//   async (req, res, next) => {
//     const { lottimeId, lotlocationId } = req.query;

//     let lotdates = await LotDate.find({})
//       .populate("lottime")
//       .sort({ "lottime.lotdate": -1 }); // Sort based on lotdate in descending order

//     if (lottimeId && lotlocationId) {
//       // Filter lotdates array based on both lottimeId and lotlocationId
//       lotdates = lotdates.filter(
//         (item) =>
//           item.lottime._id.toString() === lottimeId &&
//           item.lottime.lotlocation.toString() === lotlocationId
//       );
//     } else if (lottimeId) {
//       // Filter lotdates array based on lottimeId
//       lotdates = lotdates.filter(
//         (item) => item.lottime._id.toString() === lottimeId
//       );
//     } else if (lotlocationId) {
//       // Filter lotdates array based on lotlocationId
//       lotdates = lotdates.filter(
//         (item) => item.lottime.lotlocation.toString() === lotlocationId
//       );
//     }

//     res.status(200).json({
//       success: true,
//       lotdates,
//     });
//   }
// );

// const deleteLotDate = asyncError(async (req, res, next) => {
//   const lotdate = await LotDate.findById(req.params.id);

//   if (!lotdate) return next(new ErrorHandler("Date not found", 404));

//   const results = await Result.find({ lotdate: lotdate._id });

//   for (let index = 0; index < results.length; index++) {
//     const result = array[index];
//     result.lotdate = undefined;
//     await result.save();
//   }

//   await lotdate.deleteOne();

//   res.status(200).json({
//     success: true,
//     message: "Date Deleted Successfully",
//   });
// });

// const updateDate = asyncError(async (req, res, next) => {
//   const { lotdate } = req.body;

//   const ldate = await LotDate.findById(req.params.id);

//   if (!ldate) return next(new ErrorHandler("Date not found", 404));

//   if (lotdate) ldate.lotdate = lotdate;

//   await ldate.save();

//   res.status(200).json({
//     success: true,
//     message: "Date Updated Successfully",
//   });
// });

// // ####################
// // LOT TIME
// // ####################

// const addLotTime = asyncError(async (req, res, next) => {
//   await LotTime.create(req.body);

//   res.status(201).json({
//     success: true,
//     message: "Time Added Successfully",
//   });
// });

// const getAllLotTime = asyncError(async (req, res, next) => {
//   const lottimes = await LotTime.find({}).populate("lotlocation").sort({ createdAt: -1 });
//   res.status(200).json({
//     success: true,
//     lottimes,
//   });
// });

// const getAllLotTimeAccordindLocation = asyncError(
//   async (req, res, next) => {
//     const { locationid } = req.query;

//     let lottimes = await LotTime.find({}).populate("lotlocation").sort({ createdAt: -1 });

//     if (locationid) {
//       // Filter lottimes array based on locationid
//       lottimes = lottimes.filter(
//         (item) => item.lotlocation._id.toString() === locationid
//       );
//     }

//     res.status(200).json({
//       success: true,
//       lottimes,
//     });
//   }
// );

// const deleteLotTime = asyncError(async (req, res, next) => {
//   const lottime = await LotTime.findById(req.params.id);

//   if (!lottime) return next(new ErrorHandler("Time not found", 404));

//   const lottimes = await LotDate.find({ lottime: lottime._id });

//   for (let index = 0; index < lottimes.length; index++) {
//     const lottime = array[index];
//     lottime.lottime = undefined;
//     await lottime.save();
//   }

//   await lottime.deleteOne();

//   res.status(200).json({
//     success: true,
//     message: "Time Deleted Successfully",
//   });
// });

// const updateTime = asyncError(async (req, res, next) => {
//   const { lottime } = req.body;

//   const ltime = await LotTime.findById(req.params.id);

//   if (!ltime) return next(new ErrorHandler("Time not found", 404));

//   if (lottime) ltime.lottime = lottime;

//   await ltime.save();

//   res.status(200).json({
//     success: true,
//     message: "TIme Updated Successfully",
//   });
// });

// // ####################
// // LOT LOCATION
// // ####################

// const addLotLocatin = asyncError(async (req, res, next) => {

//   const { lotlocation, maximumRange } = req.body;

//   if (!lotlocation) return next(new ErrorHandler("enter lotlocation missing", 404));
//   if (!maximumRange) return next(new ErrorHandler("enter maximum range", 404));

//   await LotLocation.create(req.body);

//   res.status(201).json({
//     success: true,
//     message: "Location Added Successfully",
//   });
// });

// const getAllLotLocation = asyncError(async (req, res, next) => {
//   const lotlocations = await LotLocation.find({}).sort({ createdAt: -1 });

//   res.status(200).json({
//     success: true,
//     lotlocations,
//   });
// });

// const deleteLotLocation = asyncError(async (req, res, next) => {
//   const lotlocation = await LotLocation.findById(req.params.id);

//   if (!lotlocation) return next(new ErrorHandler("Location not found", 404));

//   const lotlocations = await LotTime.find({ lotlocation: lotlocation._id });

//   for (let index = 0; index < lotlocations.length; index++) {
//     const lotlocation = array[index];
//     lotlocation.lottime = undefined;
//     await lotlocation.save();
//   }

//   await lotlocation.deleteOne();

//   res.status(200).json({
//     success: true,
//     message: "Location Deleted Successfully",
//   });
// });

// const updateLocation = asyncError(async (req, res, next) => {
//   const { lotlocation,locationTitle, locationDescription } = req.body;

//   const llocation = await LotLocation.findById(req.params.id);

//   if (!llocation) return next(new ErrorHandler("Location not found", 404));

//   if (lotlocation) llocation.lotlocation = lotlocation;
//   if (locationTitle) llocation.locationTitle = locationTitle;
//   if (locationDescription) llocation.locationDescription = locationDescription;

//   await llocation.save();

//   res.status(200).json({
//     success: true,
//     message: "Location Updated Successfully",
//   });
// });

// module.exports = {
//   getAllResult,
//   getAllResultAccordingToLocation,
//   getNextResult,
//   getAllResultAccordingToDateTimeLocation,
//   getResultDetails,
//   createResult,
//   updateResult,
//   deleteResult,
//   addLotDate,
//   getAllLotDate,
//   getAllLotDateAccordindLocationAndTime,
//   deleteLotDate,
//   updateDate,
//   addLotTime,
//   getAllLotTime,
//   getAllLotTimeAccordindLocation,
//   deleteLotTime,
//   updateTime,
//   addLotLocatin,
//   getAllLotLocation,
//   deleteLotLocation,
//   updateLocation
// };
