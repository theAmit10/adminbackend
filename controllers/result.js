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
const walletone = require("../models/walletone.js");
const WalletOne = require("../models/walletone.js");
const AppBalanceSheet = require("../models/AppBalanceSheet.js");
const currency = require("../models/currency");
const AppLink = require("../models/AppLink");
const Notification = require("../models/Notification.js");
const topwinner = require("../models/topwinner.js");
const PartnerPerformance = require("../models/PartnerPerformance.js");
const PartnerModule = require("../models/PartnerModule.js");
const RechargeModule = require("../models/RechargeModule.js");
const PowerBet = require("../models/PowerBet.js");
const PowerballGameTickets = require("../models/PowerballGameTickets.js");
const powerresult = require("../models/powerresult.js");
const OtherPayment = require("../models/OtherPayment.js");
const PartnerPerformancePowerball = require("../models/PartnerPerformancePowerball.jsx");
const user = require("../models/user.js");
const PowerTime = require("../models/PowerTime.js");
const PowerBallGame = require("../models/PowerBallGame.js");

// ####################
// RESULTS
// ####################

// const getAllResult = asyncError(async (req, res, next) => {
//   const results = await Result.find({})
//     .populate("lotdate")
//     .populate("lottime")
//     .populate("lotlocation")
//     .sort({ _id: -1 }); // Sort by _id in descending order

//   res.status(200).json({
//     success: true,
//     results,
//   });
// });
const getAllResult = asyncError(async (req, res, next) => {
  const { lotdateId, lottimeId, lotlocationId, page, limit } = req.query;

  // Set default page and limit values
  const currentPage = parseInt(page) || 1;
  const itemsPerPage = parseInt(limit) || 20;
  const skip = (currentPage - 1) * itemsPerPage;

  // Build the query object to include filters if provided
  let query = {};
  if (lotdateId) query.lotdate = lotdateId;
  if (lottimeId) query.lottime = lottimeId;
  if (lotlocationId) query.lotlocation = lotlocationId;

  try {
    // Fetch the results with the applied filters, pagination, and sorting
    const results = await Result.find(query)
      .populate("lotdate")
      .populate("lottime")
      .populate("lotlocation")
      .skip(skip) // Apply pagination
      .limit(itemsPerPage) // Limit the number of results per page
      .sort({ _id: -1 }); // Sort by _id in descending order

    // Get the total count of results matching the filter
    const totalResults = await Result.countDocuments(query);

    res.status(200).json({
      success: true,
      results,
      totalResults,
      totalPages: Math.ceil(totalResults / itemsPerPage),
      currentPage,
    });
  } catch (error) {
    next(error);
  }
});

const getAllTopWinner = asyncError(async (req, res, next) => {
  const topwinners = await topwinner
    .find({})
    .populate("currency")
    .sort({ createdAt: -1 }); // Sort by _id in descending order

  res.status(200).json({
    success: true,
    topwinners,
  });
});

const getAllResultsByLocationWithTimes = asyncError(async (req, res, next) => {
  const { locationid } = req.query; // Extract the location ID from the query parameters

  // Fetch all results from the database and populate the related fields
  let results = await Result.find({})
    .populate("lotdate") // Populate the lotdate field with its full document
    .populate("lottime") // Populate the lottime field with its full document
    .populate("lotlocation") // Populate the lotlocation field with its full document
    .sort({ createdAt: -1 }); // Sort results by creation date in descending order

  // If a location ID is provided, filter results by that location ID
  if (locationid) {
    results = results.filter(
      (item) => item.lotlocation._id.toString() === locationid
    );
  }

  // Initialize an empty object to group results by lottime
  const groupedResults = {};

  // Iterate through each result to group them by lottime and lotdate
  results.forEach((item) => {
    const lottimeId = item.lottime._id.toString(); // Convert the lottime ID to a string for easier comparison

    // Check if the lottime group exists in groupedResults; if not, create it
    if (!groupedResults[lottimeId]) {
      groupedResults[lottimeId] = {
        _id: lottimeId, // Store the lottime ID
        lottime: item.lottime.toObject(), // Store the populated lottime object
        dates: [], // Initialize an empty array to hold the lotdates for this lottime
        createdAt: item.createdAt, // Store the creation date of the result
      };
    }

    // Check if the lotdate already exists within the current lottime group
    let dateGroup = groupedResults[lottimeId].dates.find(
      (date) => date.lotdate._id.toString() === item.lotdate._id.toString()
    );

    // If the lotdate group doesn't exist, create it
    if (!dateGroup) {
      dateGroup = {
        lotdate: item.lotdate.toObject(), // Store the populated lotdate object
        lotlocation: item.lotlocation.toObject(), // Store the populated lotlocation object
        results: [], // Initialize an empty array to hold the results for this lotdate
        createdAt: item.createdAt, // Store the creation date of the result
      };
      groupedResults[lottimeId].dates.push(dateGroup); // Add the new date group to the lottime's dates array
    }

    // Add the current result to the results array within the date group
    dateGroup.results.push({
      resultNumber: item.resultNumber, // Store the result number
      lotdate: item.lotdate.toObject(), // Store the populated lotdate object
      lottime: item.lottime.toObject(), // Store the populated lottime object
      lotlocation: item.lotlocation.toObject(), // Store the populated lotlocation object
      nextresulttime: item.nextresulttime, // Store the next result time
      createdAt: item.createdAt, // Store the creation date of the result
    });
  });

  // Convert the groupedResults object into an array of lottimes with nested lotdates and results
  const finalResults = Object.values(groupedResults);

  // Send the grouped results as a JSON response with a success status
  res.status(200).json({
    success: true,
    results: finalResults, // Send the final grouped results array
  });
});

const getAllResultsByLocationWithTimesMonthYear = asyncError(
  async (req, res, next) => {
    const { locationid, year, month } = req.query; // Extract the location ID, year, and month from the query parameters

    // Validate the year and month
    if (!year || !month) {
      return res.status(400).json({
        success: false,
        message: "Year and month are required.",
      });
    }

    console.log(`Year Provided: ${year}`);
    console.log(`Month Provided: ${month}`);

    // Convert month name to number (e.g., "july" to 7)
    const monthMap = {
      january: 1,
      february: 2,
      march: 3,
      april: 4,
      may: 5,
      june: 6,
      july: 7,
      august: 8,
      september: 9,
      october: 10,
      november: 11,
      december: 12,
    };

    const monthNumber = monthMap[month.toLowerCase()];
    if (!monthNumber) {
      return res.status(400).json({
        success: false,
        message: "Invalid month provided.",
      });
    }

    console.log(`Converted Month Number: ${monthNumber}`);

    // Define the start and end dates for the specified month and year
    // const startDate = new Date(`${year}-${monthNumber.toString().padStart(2, '0')}-01T00:00:00.000Z`);
    // const endDate = new Date(`${year}-${(monthNumber + 1).toString().padStart(2, '0')}-01T00:00:00.000Z`);

    // Define the start and end dates for the specified month and year
    const startDate = new Date(
      `${year}-${monthNumber.toString().padStart(2, "0")}-01T00:00:00.000Z`
    );

    // Handle end date properly, considering the year transition
    const endMonth = monthNumber === 12 ? 1 : monthNumber + 1; // Next month or January
    const endYear = monthNumber === 12 ? parseInt(year) + 1 : year; // Increment year if December
    const endDate = new Date(
      `${endYear}-${endMonth.toString().padStart(2, "0")}-01T00:00:00.000Z`
    );

    console.log(`Start Date: ${startDate}`);
    console.log(`End Date: ${endDate}`);

    // Check if dates are valid
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date range.",
      });
    }

    // Fetch all results from the database with the specified location ID
    let results = await Result.find({
      lotlocation: locationid,
      createdAt: {
        $gte: startDate,
        $lt: endDate,
      },
    })
      .populate("lotdate") // Populate the lotdate field with its full document
      .populate("lottime") // Populate the lottime field with its full document
      .populate("lotlocation") // Populate the lotlocation field with its full document
      .sort({ createdAt: -1 }); // Sort results by creation date in descending order

    console.log(`Fetched Results Count: ${results.length}`);
    // console.log('Fetched Results:', results);

    results = results.filter((item) => {
      if (!item.lotdate || !item.lotdate.lotdate) {
        // console.warn('Skipping result due to missing lotdate:', item);
        return false;
      }

      // Parse the lotdate in "DD-MM-YYYY" format
      const [day, month, year] = item.lotdate.lotdate.split("-").map(Number);
      const lotdate = new Date(year, month - 1, day); // month is 0-based in JavaScript

      // Extract year and month for comparison
      const lotdateYear = lotdate.getFullYear();
      const lotdateMonth = lotdate.getMonth() + 1; // JavaScript months are 0-based

      console.log(
        `Checking Result - date ${item.lotdate.lotdate} Mine Year ${year} Year: ${lotdateYear}, Month: ${lotdateMonth} Mine month ${monthNumber}`
      );
      return lotdateYear === parseInt(year) && lotdateMonth === monthNumber;
    });

    console.log(`Filtered Results Count: ${results.length}`);
    // console.log('Filtered Results:', results);

    // Initialize an empty object to group results by lottime
    const groupedResults = {};

    // Iterate through each result to group them by lottime and lotdate
    results.forEach((item) => {
      const lottimeId = item.lottime._id.toString(); // Convert the lottime ID to a string for easier comparison

      // Check if the lottime group exists in groupedResults; if not, create it
      if (!groupedResults[lottimeId]) {
        groupedResults[lottimeId] = {
          _id: lottimeId, // Store the lottime ID
          lottime: item.lottime.toObject(), // Store the populated lottime object
          dates: [], // Initialize an empty array to hold the lotdates for this lottime
          createdAt: item.createdAt, // Store the creation date of the result
        };
      }

      // Check if the lotdate already exists within the current lottime group
      let dateGroup = groupedResults[lottimeId].dates.find(
        (date) => date.lotdate._id.toString() === item.lotdate._id.toString()
      );

      // If the lotdate group doesn't exist, create it
      if (!dateGroup) {
        dateGroup = {
          lotdate: item.lotdate.toObject(), // Store the populated lotdate object
          lotlocation: item.lotlocation.toObject(), // Store the populated lotlocation object
          results: [], // Initialize an empty array to hold the results for this lotdate
          createdAt: item.createdAt, // Store the creation date of the result
        };
        groupedResults[lottimeId].dates.push(dateGroup); // Add the new date group to the lottime's dates array
      }

      // Add the current result to the results array within the date group
      dateGroup.results.push({
        resultNumber: item.resultNumber, // Store the result number
        lotdate: item.lotdate.toObject(), // Store the populated lotdate object
        lottime: item.lottime.toObject(), // Store the populated lottime object
        lotlocation: item.lotlocation.toObject(), // Store the populated lotlocation object
        nextresulttime: item.nextresulttime, // Store the next result time
        createdAt: item.createdAt, // Store the creation date of the result
      });
    });

    // Convert the groupedResults object into an array of lottimes with nested lotdates and results
    const finalResults = Object.values(groupedResults);

    // console.log('Final Grouped Results:', finalResults);

    // Send the grouped results as a JSON response with a success status
    res.status(200).json({
      success: true,
      results: finalResults, // Send the final grouped results array
    });
  }
);

const getAllPowerBallResultsByLocationWithTimesMonthYear = asyncError(
  async (req, res, next) => {
    const { powertimeid, year, month } = req.query; // Extract the location ID, year, and month from the query parameters

    // Validate the year and month
    if (!year || !month) {
      return res.status(400).json({
        success: false,
        message: "Year and month are required.",
      });
    }

    console.log(`Year Provided: ${year}`);
    console.log(`Month Provided: ${month}`);

    // Convert month name to number (e.g., "july" to 7)
    const monthMap = {
      january: 1,
      february: 2,
      march: 3,
      april: 4,
      may: 5,
      june: 6,
      july: 7,
      august: 8,
      september: 9,
      october: 10,
      november: 11,
      december: 12,
    };

    const monthNumber = monthMap[month.toLowerCase()];
    if (!monthNumber) {
      return res.status(400).json({
        success: false,
        message: "Invalid month provided.",
      });
    }

    console.log(`Converted Month Number: ${monthNumber}`);

    // Define the start and end dates for the specified month and year
    // const startDate = new Date(`${year}-${monthNumber.toString().padStart(2, '0')}-01T00:00:00.000Z`);
    // const endDate = new Date(`${year}-${(monthNumber + 1).toString().padStart(2, '0')}-01T00:00:00.000Z`);

    // Define the start and end dates for the specified month and year
    const startDate = new Date(
      `${year}-${monthNumber.toString().padStart(2, "0")}-01T00:00:00.000Z`
    );

    // Handle end date properly, considering the year transition
    const endMonth = monthNumber === 12 ? 1 : monthNumber + 1; // Next month or January
    const endYear = monthNumber === 12 ? parseInt(year) + 1 : year; // Increment year if December
    const endDate = new Date(
      `${endYear}-${endMonth.toString().padStart(2, "0")}-01T00:00:00.000Z`
    );

    console.log(`Start Date: ${startDate}`);
    console.log(`End Date: ${endDate}`);

    // Check if dates are valid
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date range.",
      });
    }

    // Fetch all results from the database with the specified location ID
    let results = await powerresult
      .find({
        powertime: powertimeid,
        createdAt: {
          $gte: startDate,
          $lt: endDate,
        },
      })
      .populate("powerdate") // Populate the lotdate field with its full document
      .populate("powertime") // Populate the lottime field with its full document
      .sort({ createdAt: -1 }); // Sort results by creation date in descending order

    console.log(`Fetched Results Count: ${results.length}`);
    // console.log('Fetched Results:', results);

    results = results.filter((item) => {
      if (!item.powerdate || !item.powerdate.powerdate) {
        // console.warn('Skipping result due to missing lotdate:', item);
        return false;
      }

      // Parse the lotdate in "DD-MM-YYYY" format
      const [day, month, year] = item.powerdate.powerdate
        .split("-")
        .map(Number);
      const powerdate = new Date(year, month - 1, day); // month is 0-based in JavaScript

      // Extract year and month for comparison
      const powerdateYear = powerdate.getFullYear();
      const powerdateMonth = powerdate.getMonth() + 1; // JavaScript months are 0-based

      console.log(
        `Checking Result - date ${item.powerdate.powerdate} Mine Year ${year} Year: ${powerdateYear}, Month: ${powerdateMonth} Mine month ${monthNumber}`
      );
      return powerdateYear === parseInt(year) && powerdateMonth === monthNumber;
    });

    console.log(`Filtered Results Count: ${results.length}`);
    // console.log('Filtered Results:', results);

    // Initialize an empty object to group results by lottime
    const groupedResults = {};

    // Iterate through each result to group them by lottime and powerdate
    results.forEach((item) => {
      const powertimeId = item.powertime._id.toString(); // Convert the lottime ID to a string for easier comparison

      // Check if the lottime group exists in groupedResults; if not, create it
      if (!groupedResults[powertimeId]) {
        groupedResults[powertimeId] = {
          _id: powertimeId, // Store the lottime ID
          powertime: item.powertime.toObject(), // Store the populated lottime object
          dates: [], // Initialize an empty array to hold the powerdates for this lottime
          createdAt: item.createdAt, // Store the creation date of the result
        };
      }

      // Check if the powerdate already exists within the current lottime group
      let dateGroup = groupedResults[powertimeId].dates.find(
        (date) =>
          date.powerdate._id.toString() === item.powerdate._id.toString()
      );

      // If the powerdate group doesn't exist, create it
      if (!dateGroup) {
        dateGroup = {
          powerdate: item.powerdate.toObject(), // Store the populated powerdate object
          results: [], // Initialize an empty array to hold the results for this powerdate
          createdAt: item.createdAt, // Store the creation date of the result
        };
        groupedResults[powertimeId].dates.push(dateGroup); // Add the new date group to the lottime's dates array
      }

      // Add the current result to the results array within the date group
      dateGroup.results.push({
        jackpotnumber: item.jackpotnumber, // Store the result number
        powerdate: item.powerdate.toObject(), // Store the populated lotdate object
        powertime: item.powertime.toObject(), // Store the populated lottime object
        createdAt: item.createdAt, // Store the creation date of the result
      });
    });

    // Convert the groupedResults object into an array of lottimes with nested lotdates and results
    const finalResults = Object.values(groupedResults);

    // console.log('Final Grouped Results:', finalResults);

    // Send the grouped results as a JSON response with a success status
    res.status(200).json({
      success: true,
      results: finalResults, // Send the final grouped results array
    });
  }
);

const getAllResultsByLocationWithDates = asyncError(async (req, res, next) => {
  const { locationid } = req.query; // Get the location ID from the request query parameters

  // Fetch all results and populate the related fields (lotdate, lottime, lotlocation)
  let results = await Result.find({})
    .populate("lotdate")
    .populate("lottime")
    .populate("lotlocation")
    .sort({ createdAt: -1 }); // Sort the results by creation date in descending order

  // If a location ID is provided, filter results to only include those for the specified location
  if (locationid) {
    results = results.filter(
      (item) => item.lotlocation._id.toString() === locationid
    );
  }

  // Initialize an object to group results by lotdate
  const groupedResults = {};

  // Iterate over the results to group them by lotdate and then by lottime
  results.forEach((item) => {
    const lotdateId = item.lotdate._id.toString(); // Get the lotdate ID

    // If the lotdate group doesn't exist, create it with an empty times array
    if (!groupedResults[lotdateId]) {
      groupedResults[lotdateId] = {
        _id: item.lotdate._id, // Store the lotdate ID
        lotdate: item.lotdate.lotdate, // Store the lotdate value
        times: [], // Initialize an empty array for lottimes
      };
    }

    // Prepare the lottime object with its corresponding results
    const lottimeObj = {
      _id: item.lottime._id, // Store the lottime ID
      lottime: item.lottime.lottime, // Store the lottime value
      results: [], // Initialize an empty array for results
    };

    // Check if the lottime already exists in the times array for this lotdate
    const existingLottime = groupedResults[lotdateId].times.find(
      (t) => t._id.toString() === item.lottime._id.toString()
    );

    if (existingLottime) {
      // If the lottime exists, add the current result to the existing lottime's results array
      existingLottime.results.push(item.toObject());
    } else {
      // If the lottime doesn't exist, add the result to the new lottime object and push it to the times array
      lottimeObj.results.push(item.toObject());
      groupedResults[lotdateId].times.push(lottimeObj);
    }
  });

  // Convert the grouped results object into an array for easy consumption in the response
  const finalResults = Object.values(groupedResults);

  res.status(200).json({
    success: true,
    results: finalResults, // Send the grouped and structured results back in the response
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

const getResultAccordingToLocationTY = asyncError(async (req, res, next) => {
  const { locationid, year, month } = req.query;

  // Validate the year and month
  if (!year || !month) {
    return res.status(400).json({
      success: false,
      message: "Year and month are required.",
    });
  }

  // Convert month name to number
  const monthMap = {
    january: 1,
    february: 2,
    march: 3,
    april: 4,
    may: 5,
    june: 6,
    july: 7,
    august: 8,
    september: 9,
    october: 10,
    november: 11,
    december: 12,
  };

  const monthNumber = monthMap[month.toLowerCase()];
  if (!monthNumber) {
    return res.status(400).json({
      success: false,
      message: "Invalid month provided.",
    });
  }

  // Define start and end dates for filtering
  const startDate = new Date(
    `${year}-${monthNumber.toString().padStart(2, "0")}-01T00:00:00.000Z`
  );

  const endMonth = monthNumber === 12 ? 1 : monthNumber + 1;
  const endYear = monthNumber === 12 ? parseInt(year) + 1 : year;
  const endDate = new Date(
    `${endYear}-${endMonth.toString().padStart(2, "0")}-01T00:00:00.000Z`
  );

  // Fetch results within the specified year, month, and location
  let results = await Result.find({
    lotlocation: locationid, // Filter by location ID
    createdAt: {
      $gte: startDate,
      $lt: endDate,
    },
  })
    .populate("lotdate")
    .populate("lottime")
    .populate("lotlocation")
    .sort({ createdAt: -1 });

  // Sort the filtered results by _id in descending order (as before)
  results.sort((a, b) => (a._id < b._id ? 1 : -1));

  // Return the same response format
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

// FUNCTION TO CHECK NUMBER EXIST OR NOT IN PLAYNUMBERS LIST
const checkPlaynumberExists = (data, playnumberToCheck) => {
  return data.playnumbers.some(
    (playnumber) => playnumber.playnumber === parseInt(playnumberToCheck, 10)
  );
};

// const createResult = asyncError(async (req, res, next) => {
//   const { resultNumber, lotdate, lottime, lotlocation, nextresulttime } =
//     req.body;

//   if (!resultNumber)
//     return next(new ErrorHandler("Result number not found", 404));
//   if (!lotdate) return next(new ErrorHandler("Date not found", 404));
//   if (!lottime) return next(new ErrorHandler("Time not found", 404));
//   if (!lotlocation) return next(new ErrorHandler("Location not found", 404));

//   // Find the Playzone entry by lotlocation, lottime, and lotdate
//   const playzone = await Playzone.findOne({
//     lotlocation,
//     lottime,
//     lotdate,
//   });

//   if (!playzone) {
//     return res.status(404).json({
//       success: false,
//       message: "Playzone entry not found",
//     });
//   }

//   if (!checkPlaynumberExists(playzone, resultNumber)) {
//     return next(new ErrorHandler("Result number not in range", 404));
//   }

//   // Find the playnumber in the playzone
//   const playnumberEntry = playzone.playnumbers.find(
//     (pn) => pn.playnumber === parseInt(resultNumber, 10)
//   );

//   if (!playnumberEntry) {
//     return next(new ErrorHandler("Playnumber entry not found", 404));
//   }

//   console.log("now getting users");
//   // Update walletOne for each user in the playnumber's users list
//   for (const userz of playnumberEntry.users) {
//     console.log("GETTING EACH USER");
//     console.log(userz);
//     const userId = userz.userId;
//     const amount = parseInt(userz.winningamount);

//     const user = await User.findOne({ userId });

//     if (!user) {
//       return next(new ErrorHandler("User not found", 404));
//     }

//     console.log("SEARCHING FOR USER");
//     console.log(user);

//     // FOR DEPOSITING MONEY IN USER WALLET ONE

//     const walletId = user.walletOne._id;
//     const wallet = await WalletOne.findById(walletId);
//     const totalBalanceAmount = parseFloat(wallet.balance);
//     const remainingWalletBalance = totalBalanceAmount + parseFloat(amount);

//     // Update wallet
//     await WalletOne.findByIdAndUpdate(
//       walletId,
//       { balance: remainingWalletBalance },
//       { new: true }
//     );

//     // FOR NOTIFICATION
//     const notification = await Notification.create({
//       title: "Congratulations! You won!",
//       description: `You have won an amount of ${amount}.`,
//     });

//     // Add notification to the user's notifications array
//     user.notifications.push(notification._id);
//     await user.save();

//     // FOR PLAYBET HISTORY
//     const playbet = await Playbet.create({
//       playnumbers: [
//         {
//           playnumber: playnumberEntry.playnumber,
//           amount: userz.winningamount,
//           winningamount: userz.winningamount,
//         },
//       ],
//       username: user.name,
//       userid: user.userId,
//       currency: user.country._id.toString(), // Assuming currency is related to the user
//       lotdate: lotdate,
//       lottime: lottime,
//       lotlocation: lotlocation,
//       walletName: wallet.walletName,
//       gameType: "playarena",
//     });

//     // Add playbet history to the user's playbetHistory array
//     user.playbetHistory.push(playbet._id);
//     await user.save();

//     // Creating top winner list
//     const topWinner = await topwinner.create({
//       userId: user.userId,
//       name: user.name,
//       avatar: user?.avatar,
//       playnumber: playnumberEntry.playnumber,
//       amount: userz.amount,
//       winningamount: userz.winningamount,
//       currency: user.country._id.toString(),
//     });

//     console.log(topWinner);
//     console.log({
//       userId: user.userId,
//       name: user.name,
//       avatar: user?.avatar,
//       playnumber: playnumberEntry.playnumber,
//       amount: userz.amount,
//       winningamount: userz.winningamount,
//       currency: user.country._id.toString(),
//     });
//   }

//   // [FOR PARTNER PAYOUT]

//   // [FOR PARTNER PAYOUT]

//   const winningAmount = playnumberEntry.distributiveamount;

//   // Calculate totalBetAmount by summing all amounts in playnumberEntry.playnumbers[]
//   const totalBetAmount = playzone.playnumbers.reduce(
//     (sum, entry) => sum + parseFloat(entry.amount),
//     0
//   );

//   // Calculate totalProfit
//   const totalProfit = totalBetAmount - winningAmount;

//   // Find partner performance
//   const partnerperformance = await PartnerPerformance.findOne({
//     lotlocation,
//     lottime,
//     lotdate,
//   });

//   if (!partnerperformance) {
//     return next(new ErrorHandler("Partner performance not found", 404));
//   }

//   partnerperformance.totalAmount = totalBetAmount;
//   partnerperformance.totalProfit = totalProfit;
//   partnerperformance.winningAmount = winningAmount
//   await partnerperformance.save();

//   // Initialize profitDistributiveArray
//   const profitDistributiveArray = [];

//   for (const partner of partnerperformance.performances) {
//     // Calculate contributionAmount by summing users[].convertedAmount
//     const contributionAmount = partner.users.reduce(
//       (sum, user) => sum + parseFloat(user.convertedAmount || 0),
//       0
//     );

//     // Calculate contributionPercentage
//     const contributionPercentage = (contributionAmount / totalBetAmount) * 100;

//     // Calculate profitBasedOnContribution
//     const profitBasedOnContribution =
//       (contributionPercentage / 100) * totalProfit;

//     // Check if partnerStatus is true
//     if (!partner.partnerStatus) continue;

//     // Check rechargeStatus
//     if (partner.rechargeStatus) {
//       // Calculate partnerUserProfit
//       const partnerUserProfit =
//         parseFloat(partner.profitPercentage) +
//         parseFloat(partner.rechargePercentage);

//       // Calculate partnerUserAmount
//       const partnerUserAmount =
//         (partnerUserProfit / 100) * profitBasedOnContribution;

//       // Ensure userId is unique in profitDistributiveArray
//       const existingUser = profitDistributiveArray.find(
//         (item) => item.userId === partner.partnerId
//       );

//       if (existingUser) {
//         existingUser.amount += partnerUserAmount;
//       } else {
//         profitDistributiveArray.push({
//           userId: partner.partnerId,
//           walletId: partner.partnerWalletTwo,
//           amount: partnerUserAmount,
//         });
//       }

//       // CHECKING FOR THE PARENT PARTNER
//       if (partner.parentPartnerId !== 1000) {
//         const parentPartnerUserProfit =
//           parseFloat(partner.parentPartnerProfitPercentage) -
//           parseFloat(partner.profitPercentage);

//         const parentPartnerUserAmount =
//           (parentPartnerUserProfit / 100) * profitBasedOnContribution;

//         // Ensure userId is unique in profitDistributiveArray
//         const existingUser = profitDistributiveArray.find(
//           (item) => item.userId === partner.parentPartnerId
//         );

//         if (existingUser) {
//           existingUser.amount += partnerUserAmount;
//         } else {
//           profitDistributiveArray.push({
//             userId: partner.parentPartnerId,
//             walletId: partner.parentPartnerWalletTwo,
//             amount: parentPartnerUserAmount,
//           });
//         }
//       }

//       // CHECKING FOR THE PARENT PARENT PARTNER

//       if (partner.parentParentPartnerId !== 1000) {
//         const parentParentPartnerUserProfit =
//           parseFloat(partner.parentParentPartnerProfitPercentage) -
//           parseFloat(partner.parentPartnerProfitPercentage);

//         const parentParentPartnerUserAmount =
//           (parentParentPartnerUserProfit / 100) * profitBasedOnContribution;

//         // Ensure userId is unique in profitDistributiveArray
//         const existingUser = profitDistributiveArray.find(
//           (item) => item.userId === partner.parentParentPartnerId
//         );

//         if (existingUser) {
//           existingUser.amount += partnerUserAmount;
//         } else {
//           profitDistributiveArray.push({
//             userId: partner.parentParentPartnerId,
//             walletId: partner.parentParentPartnerWalletTwo,
//             amount: parentParentPartnerUserAmount,
//           });
//         }
//       }
//     } else {
//       // Calculate partnerUserProfit
//       const partnerUserProfit = parseFloat(partner.profitPercentage);

//       // Calculate partnerUserAmount
//       const partnerUserAmount =
//         (partnerUserProfit / 100) * profitBasedOnContribution;

//       // Ensure userId is unique in profitDistributiveArray
//       const existingUser = profitDistributiveArray.find(
//         (item) => item.userId === partner.partnerId
//       );

//       if (existingUser) {
//         existingUser.amount += partnerUserAmount;
//       } else {
//         profitDistributiveArray.push({
//           userId: partner.partnerId,
//           walletId: partner.partnerWalletTwo,
//           amount: partnerUserAmount,
//         });
//       }

//       // CHECKING FOR THE PARENT PARTNER
//       if (partner.parentPartnerId !== 1000) {
//         if (partner.parentPartnerRechargeStatus) {
//           const parentPartnerUserProfit =
//             parseFloat(partner.parentPartnerProfitPercentage) +
//             parseFloat(partner.parentPartnerRechargePercentage) -
//             parseFloat(partner.profitPercentage);

//           const parentPartnerUserAmount =
//             (parentPartnerUserProfit / 100) * profitBasedOnContribution;

//           // Ensure userId is unique in profitDistributiveArray
//           const existingUser = profitDistributiveArray.find(
//             (item) => item.userId === partner.parentPartnerId
//           );

//           if (existingUser) {
//             existingUser.amount += partnerUserAmount;
//           } else {
//             profitDistributiveArray.push({
//               userId: partner.parentPartnerId,
//               walletId: partner.parentPartnerWalletTwo,
//               amount: parentPartnerUserAmount,
//             });
//           }
//         } else {
//           const parentPartnerUserProfit =
//             parseFloat(partner.parentPartnerProfitPercentage) -
//             parseFloat(partner.profitPercentage);

//           const parentPartnerUserAmount =
//             (parentPartnerUserProfit / 100) * profitBasedOnContribution;

//           // Ensure userId is unique in profitDistributiveArray
//           const existingUser = profitDistributiveArray.find(
//             (item) => item.userId === partner.parentPartnerId
//           );

//           if (existingUser) {
//             existingUser.amount += partnerUserAmount;
//           } else {
//             profitDistributiveArray.push({
//               userId: partner.parentPartnerId,
//               walletId: partner.parentPartnerWalletTwo,
//               amount: parentPartnerUserAmount,
//             });
//           }
//         }
//       }

//       // CHECKING FOR THE PARENT PARENT PARTNER

//       if (partner.parentParentPartnerId !== 1000) {
//         if (partner.parentParentPartnerRechargeStatus) {
//           const parentParentPartnerUserProfit =
//             parseFloat(partner.parentParentPartnerProfitPercentage) +
//             parseFloat(partner.parentParentPartnerRechargePercentage) -
//             parseFloat(partner.parentPartnerProfitPercentage);

//           const parentParentPartnerUserAmount =
//             (parentParentPartnerUserProfit / 100) * profitBasedOnContribution;

//           // Ensure userId is unique in profitDistributiveArray
//           const existingUser = profitDistributiveArray.find(
//             (item) => item.userId === partner.parentParentPartnerId
//           );

//           if (existingUser) {
//             existingUser.amount += partnerUserAmount;
//           } else {
//             profitDistributiveArray.push({
//               userId: partner.parentParentPartnerId,
//               walletId: partner.parentParentPartnerWalletTwo,
//               amount: parentParentPartnerUserAmount,
//             });
//           }
//         } else {
//           const parentParentPartnerUserProfit =
//             parseFloat(partner.parentParentPartnerProfitPercentage) -
//             parseFloat(partner.parentPartnerProfitPercentage);

//           const parentParentPartnerUserAmount =
//             (parentParentPartnerUserProfit / 100) * profitBasedOnContribution;

//           // Ensure userId is unique in profitDistributiveArray
//           const existingUser = profitDistributiveArray.find(
//             (item) => item.userId === partner.parentParentPartnerId
//           );

//           if (existingUser) {
//             existingUser.amount += partnerUserAmount;
//           } else {
//             profitDistributiveArray.push({
//               userId: partner.parentParentPartnerId,
//               walletId: partner.parentParentPartnerWalletTwo,
//               amount: parentParentPartnerUserAmount,
//             });
//           }
//         }
//       }
//     }
//   }

//   // DISTRIBUTE PROFIT TO PARTNERS
//   for (const userz of profitDistributiveArray) {
//     console.log("GETTING EACH USER");
//     console.log(userz);
//     const userId = userz.userId;
//     const amount = parseInt(userz.amount);

//     const user = await User.findOne({ userId });

//     if (!user) {
//       return next(new ErrorHandler("User not found", 404));
//     }

//     // FOR DEPOSITING MONEY IN USER WALLET ONE

//     const walletId = user.walletOne._id;
//     const wallet = await WalletOne.findById(walletId);
//     const totalBalanceAmount = parseFloat(wallet.balance);
//     const remainingWalletBalance = totalBalanceAmount + parseFloat(amount);

//     // Update wallet
//     await WalletOne.findByIdAndUpdate(
//       walletId,
//       { balance: remainingWalletBalance },
//       { new: true }
//     );

//     // FOR NOTIFICATION
//     const notification = await Notification.create({
//       title: "Partner Profit",
//       description: `Your partner profit amount ${amount} credited.`,
//     });

//     // Add notification to the user's notifications array
//     user.notifications.push(notification._id);
//     await user.save();

//     // FOR PLAYBET HISTORY
//     const playbet = await Playbet.create({
//       playnumbers: [
//         {
//           playnumber: playnumberEntry.playnumber,
//           amount: userz.amount,
//           winningamount: userz.amount,
//         },
//       ],
//       username: user.name,
//       userid: user.userId,
//       currency: user.country._id.toString(), // Assuming currency is related to the user
//       lotdate: lotdate,
//       lottime: lottime,
//       lotlocation: lotlocation,
//       walletName: wallet.walletName,
//       gameType: "playarena",
//     });

//     // Add playbet history to the user's playbetHistory array
//     user.playbetHistory.push(playbet._id);
//     await user.save();
//   }

//   // [END PARTNER PAYOUT]

//   // [END PARTNER PAYOUT]

//   // FOR BALANCE SHEET
//   // Fetch all WalletTwo balances and populate currencyId
//   const walletTwoBalances = await WalletTwo.find({}).populate("currencyId");
//   let gameBalance = 0;

//   walletTwoBalances.forEach((wallet) => {
//     const walletCurrencyConverter = parseFloat(
//       wallet.currencyId.countrycurrencyvaluecomparedtoinr
//     );
//     gameBalance += wallet.balance * walletCurrencyConverter;
//   });

//   // Fetch all WalletOne balances and populate currencyId
//   const walletOneBalances = await WalletOne.find({}).populate("currencyId");
//   let withdrawalBalance = 0;

//   walletOneBalances.forEach((wallet) => {
//     const walletCurrencyConverter = parseFloat(
//       wallet.currencyId.countrycurrencyvaluecomparedtoinr
//     );
//     withdrawalBalance += wallet.balance * walletCurrencyConverter;
//   });

//   // Calculate total balance as the sum of walletOne and walletTwo balances
//   const totalBalance = withdrawalBalance + gameBalance;

//   // Search for the "INR" countrycurrencysymbol in the Currency Collection
//   const currency = await Currency.findOne({ countrycurrencysymbol: "INR" });
//   if (!currency) {
//     return next(new ErrorHandler("Currency not found", 404));
//   }

//   // Create a new AppBalanceSheet document
//   const appBalanceSheet = new AppBalanceSheet({
//     amount: playnumberEntry.distributiveamount,
//     withdrawalbalance: withdrawalBalance,
//     gamebalance: gameBalance,
//     totalbalance: totalBalance,
//     usercurrency: currency._id, // Use the _id of the found currency
//     activityType: "Winning",
//     userId: playnumberEntry?.users[0]?.userId || "1000",
//     payzoneId: playzone._id,
//     paymentProcessType: "Credit",
//     walletName: req.user.walletOne.walletName,
//   });

//   // Save the AppBalanceSheet document
//   await appBalanceSheet.save();
//   console.log("AppBalanceSheet Created Successfully");

//   // END BALANCE SHEET

//   // // Create a result entry
//   // await Result.create({
//   //   resultNumber,
//   //   lotdate,
//   //   lottime,
//   //   lotlocation,
//   //   nextresulttime,
//   //   resultCreatedMethod: "mannual",
//   // });
//   try {
//     // Create and save a new result document
//     const result = await Result.create({
//       resultNumber,
//       lotdate,
//       lottime,
//       lotlocation,
//       nextresulttime,
//       resultCreatedMethod: "mannual", // Ensure this field is provided
//     });
//     console.log("Result created successfully:", result); // Successfully created document
//   } catch (err) {
//     console.error("Error creating result:", err.message); // Handle validation or save errors
//   }

//   res.status(200).json({
//     success: true,
//     message:
//       "Result Created and Wallets Updated Successfully, Notifications sent, and Playbet History Updated",
//   });
// });

const createResult = asyncError(async (req, res, next) => {
  const { resultNumber, lotdate, lottime, lotlocation, nextresulttime } =
    req.body;

  if (!resultNumber)
    return next(new ErrorHandler("Result number not found", 404));
  if (!lotdate) return next(new ErrorHandler("Date not found", 404));
  if (!lottime) return next(new ErrorHandler("Time not found", 404));
  if (!lotlocation) return next(new ErrorHandler("Location not found", 404));

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

  if (!checkPlaynumberExists(playzone, resultNumber)) {
    return next(new ErrorHandler("Result number not in range", 404));
  }

  // Find the playnumber in the playzone
  const playnumberEntry = playzone.playnumbers.find(
    (pn) => pn.playnumber === parseInt(resultNumber, 10)
  );

  if (!playnumberEntry) {
    return next(new ErrorHandler("Playnumber entry not found", 404));
  }

  console.log("now getting users");
  // Update walletOne for each user in the playnumber's users list
  for (const userz of playnumberEntry.users) {
    console.log("GETTING EACH USER");
    console.log(userz);
    const userId = userz.userId;
    const amount = parseInt(userz.winningamount);

    const user = await User.findOne({ userId });

    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }

    console.log("SEARCHING FOR USER");
    console.log(user);

    // FOR DEPOSITING MONEY IN USER WALLET ONE

    const walletId = user.walletOne._id;
    const wallet = await WalletOne.findById(walletId);
    const totalBalanceAmount = parseFloat(wallet.balance);
    const remainingWalletBalance = totalBalanceAmount + parseFloat(amount);

    // Update wallet
    await WalletOne.findByIdAndUpdate(
      walletId,
      { balance: remainingWalletBalance },
      { new: true }
    );

    // FOR NOTIFICATION
    const notification = await Notification.create({
      title: "Congratulations! You won!",
      description: `An amount of ${amount} has been credited to your ${wallet.walletName} wallet.`,
    });

    // Add notification to the user's notifications array
    user.notifications.push(notification._id);
    await user.save();

    // FOR PLAYBET HISTORY
    const playbet = await Playbet.create({
      playnumbers: [
        {
          playnumber: playnumberEntry.playnumber,
          amount: userz.winningamount,
          winningamount: userz.winningamount,
        },
      ],
      username: user.name,
      userid: user.userId,
      currency: user.country._id.toString(), // Assuming currency is related to the user
      lotdate: lotdate,
      lottime: lottime,
      lotlocation: lotlocation,
      walletName: wallet.walletName,
      gameType: "playarena",
    });

    // Add playbet history to the user's playbetHistory array
    user.playbetHistory.push(playbet._id);
    await user.save();

    // Creating top winner list
    const topWinner = await topwinner.create({
      userId: user.userId,
      name: user.name,
      avatar: user?.avatar,
      playnumber: playnumberEntry.playnumber,
      amount: userz.amount,
      winningamount: userz.winningamount,
      currency: user.country._id.toString(),
    });

    console.log(topWinner);
    console.log({
      userId: user.userId,
      name: user.name,
      avatar: user?.avatar,
      playnumber: playnumberEntry.playnumber,
      amount: userz.amount,
      winningamount: userz.winningamount,
      currency: user.country._id.toString(),
    });
  }

  // [FOR PARTNER PAYOUT]

  // [FOR PARTNER PAYOUT]

  const winningAmount = playnumberEntry.distributiveamount;

  // Calculate totalBetAmount by summing all amounts in playnumberEntry.playnumbers[]
  const totalBetAmount = playzone.playnumbers.reduce(
    (sum, entry) => sum + parseFloat(entry.amount),
    0
  );

  // Calculate totalProfit
  const totalProfit = totalBetAmount - winningAmount;

  // Find partner performance
  const partnerperformance = await PartnerPerformance.findOne({
    lotlocation,
    lottime,
    lotdate,
  });

  if (!partnerperformance) {
    return next(new ErrorHandler("Partner performance not found", 404));
  }

  partnerperformance.totalAmount = totalBetAmount;
  partnerperformance.totalProfit = totalProfit;
  partnerperformance.winningAmount = winningAmount;

  // Initialize profitDistributiveArray
  const profitDistributiveArray = [];

  // Loop through each partner in partnerperformance.performances
  for (const partner of partnerperformance.performances) {
    // Calculate contributionAmount by summing users[].convertedAmount
    const contributionAmount = partner.users.reduce(
      (sum, user) => sum + parseFloat(user.convertedAmount || 0),
      0
    );

    // Calculate contributionPercentage
    const contributionPercentage = (contributionAmount / totalBetAmount) * 100;

    // Calculate profitBasedOnContribution
    const profitBasedOnContribution =
      (contributionPercentage / 100) * totalProfit;

    // Update the partner's contributionAmount and contributionPercentage
    partner.contributionAmount = contributionAmount;
    partner.contributionPercentage = contributionPercentage;

    // Check if partnerStatus is true
    if (!partner.partnerStatus) continue;

    // Check rechargeStatus
    if (partner.rechargeStatus) {
      // Calculate partnerUserProfit
      const partnerUserProfit =
        parseFloat(partner.profitPercentage) +
        parseFloat(partner.rechargePercentage);

      // Calculate partnerUserAmount
      const partnerUserAmount =
        (partnerUserProfit / 100) * profitBasedOnContribution;

      // Ensure userId is unique in profitDistributiveArray
      const existingUser = profitDistributiveArray.find(
        (item) => item.userId === partner.partnerId
      );

      if (existingUser) {
        existingUser.amount += partnerUserAmount;
      } else {
        profitDistributiveArray.push({
          userId: partner.partnerId,
          walletId: partner.partnerWalletTwo,
          amount: partnerUserAmount,
        });
      }

      // CHECKING FOR THE PARENT PARTNER
      if (partner.parentPartnerId !== 1000) {
        const parentPartnerUserProfit =
          parseFloat(partner.parentPartnerProfitPercentage) -
          parseFloat(partner.profitPercentage);

        const parentPartnerUserAmount =
          (parentPartnerUserProfit / 100) * profitBasedOnContribution;

        // Ensure userId is unique in profitDistributiveArray
        const existingUser = profitDistributiveArray.find(
          (item) => item.userId === partner.parentPartnerId
        );

        if (existingUser) {
          existingUser.amount += parentPartnerUserAmount;
        } else {
          profitDistributiveArray.push({
            userId: partner.parentPartnerId,
            walletId: partner.parentPartnerWalletTwo,
            amount: parentPartnerUserAmount,
          });
        }
      }

      // CHECKING FOR THE PARENT PARENT PARTNER
      if (partner.parentParentPartnerId !== 1000) {
        const parentParentPartnerUserProfit =
          parseFloat(partner.parentParentPartnerProfitPercentage) -
          parseFloat(partner.parentPartnerProfitPercentage);

        const parentParentPartnerUserAmount =
          (parentParentPartnerUserProfit / 100) * profitBasedOnContribution;

        // Ensure userId is unique in profitDistributiveArray
        const existingUser = profitDistributiveArray.find(
          (item) => item.userId === partner.parentParentPartnerId
        );

        if (existingUser) {
          existingUser.amount += parentParentPartnerUserAmount;
        } else {
          profitDistributiveArray.push({
            userId: partner.parentParentPartnerId,
            walletId: partner.parentParentPartnerWalletTwo,
            amount: parentParentPartnerUserAmount,
          });
        }
      }
    } else {
      // Calculate partnerUserProfit
      const partnerUserProfit = parseFloat(partner.profitPercentage);

      // Calculate partnerUserAmount
      const partnerUserAmount =
        (partnerUserProfit / 100) * profitBasedOnContribution;

      // Ensure userId is unique in profitDistributiveArray
      const existingUser = profitDistributiveArray.find(
        (item) => item.userId === partner.partnerId
      );

      if (existingUser) {
        existingUser.amount += partnerUserAmount;
      } else {
        profitDistributiveArray.push({
          userId: partner.partnerId,
          walletId: partner.partnerWalletTwo,
          amount: partnerUserAmount,
        });
      }

      // CHECKING FOR THE PARENT PARTNER
      if (partner.parentPartnerId !== 1000) {
        if (partner.parentPartnerRechargeStatus) {
          const parentPartnerUserProfit =
            parseFloat(partner.parentPartnerProfitPercentage) +
            parseFloat(partner.parentPartnerRechargePercentage) -
            parseFloat(partner.profitPercentage);

          const parentPartnerUserAmount =
            (parentPartnerUserProfit / 100) * profitBasedOnContribution;

          // Ensure userId is unique in profitDistributiveArray
          const existingUser = profitDistributiveArray.find(
            (item) => item.userId === partner.parentPartnerId
          );

          if (existingUser) {
            existingUser.amount += parentPartnerUserAmount;
          } else {
            profitDistributiveArray.push({
              userId: partner.parentPartnerId,
              walletId: partner.parentPartnerWalletTwo,
              amount: parentPartnerUserAmount,
            });
          }
        } else {
          const parentPartnerUserProfit =
            parseFloat(partner.parentPartnerProfitPercentage) -
            parseFloat(partner.profitPercentage);

          const parentPartnerUserAmount =
            (parentPartnerUserProfit / 100) * profitBasedOnContribution;

          // Ensure userId is unique in profitDistributiveArray
          const existingUser = profitDistributiveArray.find(
            (item) => item.userId === partner.parentPartnerId
          );

          if (existingUser) {
            existingUser.amount += parentPartnerUserAmount;
          } else {
            profitDistributiveArray.push({
              userId: partner.parentPartnerId,
              walletId: partner.parentPartnerWalletTwo,
              amount: parentPartnerUserAmount,
            });
          }
        }
      }

      // CHECKING FOR THE PARENT PARENT PARTNER
      if (partner.parentParentPartnerId !== 1000) {
        if (partner.parentParentPartnerRechargeStatus) {
          // const parentParentPartnerUserProfit =
          //   parseFloat(partner.parentParentPartnerProfitPercentage) +
          //   parseFloat(partner.parentParentPartnerRechargePercentage) -
          //   parseFloat(partner.parentPartnerProfitPercentage);

          let parentParentPartnerUserProfit = 0;

          if (partner.parentPartnerRechargeStatus) {
            parentParentPartnerUserProfit =
              parseFloat(partner.parentParentPartnerProfitPercentage) -
              parseFloat(partner.parentPartnerProfitPercentage);
          } else {
            parentParentPartnerUserProfit =
              parseFloat(partner.parentParentPartnerProfitPercentage) +
              parseFloat(partner.parentParentPartnerRechargePercentage) -
              parseFloat(partner.parentPartnerProfitPercentage);
          }

          const parentParentPartnerUserAmount =
            (parentParentPartnerUserProfit / 100) * profitBasedOnContribution;

          // Ensure userId is unique in profitDistributiveArray
          const existingUser = profitDistributiveArray.find(
            (item) => item.userId === partner.parentParentPartnerId
          );

          if (existingUser) {
            existingUser.amount += parentParentPartnerUserAmount;
          } else {
            profitDistributiveArray.push({
              userId: partner.parentParentPartnerId,
              walletId: partner.parentParentPartnerWalletTwo,
              amount: parentParentPartnerUserAmount,
            });
          }
        } else {
          const parentParentPartnerUserProfit =
            parseFloat(partner.parentParentPartnerProfitPercentage) -
            parseFloat(partner.parentPartnerProfitPercentage);

          const parentParentPartnerUserAmount =
            (parentParentPartnerUserProfit / 100) * profitBasedOnContribution;

          // Ensure userId is unique in profitDistributiveArray
          const existingUser = profitDistributiveArray.find(
            (item) => item.userId === partner.parentParentPartnerId
          );

          if (existingUser) {
            existingUser.amount += parentParentPartnerUserAmount;
          } else {
            profitDistributiveArray.push({
              userId: partner.parentParentPartnerId,
              walletId: partner.parentParentPartnerWalletTwo,
              amount: parentParentPartnerUserAmount,
            });
          }
        }
      }
    }
  }

  // Update partner.profitAmount based on profitDistributiveArray
  for (const profitEntry of profitDistributiveArray) {
    const partner = partnerperformance.performances.find(
      (p) => p.partnerId === profitEntry.userId
    );

    if (partner) {
      partner.profitAmount = profitEntry.amount;
    }
  }

  // Save the updated partnerperformance document
  await partnerperformance.save();

  // DISTRIBUTE PROFIT TO PARTNERS
  for (const userz of profitDistributiveArray) {
    console.log("GETTING EACH USER");
    console.log(userz);
    const userId = userz.userId;
    // const amount = parseInt(userz.amount);
    // Check if amount is negative and replace with 0
    const amount = Math.max(0, parseInt(userz.amount)); // This will take the higher value (0 if amount is negative)

    const user = await User.findOne({ userId });

    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }

    // FOR DEPOSITING MONEY IN USER WALLET ONE

    const walletId = user.walletOne._id;
    const wallet = await WalletOne.findById(walletId);
    const totalBalanceAmount = parseFloat(wallet.balance);
    const remainingWalletBalance = totalBalanceAmount + parseFloat(amount);

    // Update wallet
    await WalletOne.findByIdAndUpdate(
      walletId,
      { balance: remainingWalletBalance },
      { new: true }
    );

    // FOR NOTIFICATION
    const notification = await Notification.create({
      title: "Partner Profit",
      description: `Your partner profit amount ${amount} credited to ${wallet.walletName} wallet.`,
    });

    // Add notification to the user's notifications array
    user.notifications.push(notification._id);
    await user.save();

    // FOR PLAYBET HISTORY
    const playbet = await Playbet.create({
      playnumbers: [
        {
          playnumber: playnumberEntry.playnumber,
          amount: amount,
          winningamount: amount,
        },
      ],
      username: user.name,
      userid: user.userId,
      currency: user.country._id.toString(), // Assuming currency is related to the user
      lotdate: lotdate,
      lottime: lottime,
      lotlocation: lotlocation,
      walletName: wallet.walletName,
      gameType: "playarena",
      forProcess: "partnercredit",
    });

    // Add playbet history to the user's playbetHistory array
    user.playbetHistory.push(playbet._id);
    await user.save();
  }

  // [END PARTNER PAYOUT]

  // [END PARTNER PAYOUT]

  // [END PARTNER PAYOUT]

  // FOR BALANCE SHEET
  // Fetch all WalletTwo balances and populate currencyId
  const walletTwoBalances = await WalletTwo.find({}).populate("currencyId");
  let gameBalance = 0;

  walletTwoBalances.forEach((wallet) => {
    const walletCurrencyConverter = parseFloat(
      wallet.currencyId.countrycurrencyvaluecomparedtoinr
    );
    gameBalance += wallet.balance * walletCurrencyConverter;
  });

  // Fetch all WalletOne balances and populate currencyId
  const walletOneBalances = await WalletOne.find({}).populate("currencyId");
  let withdrawalBalance = 0;

  walletOneBalances.forEach((wallet) => {
    const walletCurrencyConverter = parseFloat(
      wallet.currencyId.countrycurrencyvaluecomparedtoinr
    );
    withdrawalBalance += wallet.balance * walletCurrencyConverter;
  });

  // Calculate total balance as the sum of walletOne and walletTwo balances
  const totalBalance = withdrawalBalance + gameBalance;

  // Search for the "INR" countrycurrencysymbol in the Currency Collection
  const currency = await Currency.findOne({ countrycurrencysymbol: "INR" });
  if (!currency) {
    return next(new ErrorHandler("Currency not found", 404));
  }

  // Create a new AppBalanceSheet document
  const appBalanceSheet = new AppBalanceSheet({
    amount: playnumberEntry.distributiveamount,
    withdrawalbalance: withdrawalBalance,
    gamebalance: gameBalance,
    totalbalance: totalBalance,
    usercurrency: currency._id, // Use the _id of the found currency
    activityType: "Winning",
    userId: playnumberEntry?.users[0]?.userId || "1000",
    payzoneId: playzone._id,
    paymentProcessType: "Credit",
    walletName: req.user.walletOne.walletName,
  });

  // Save the AppBalanceSheet document
  await appBalanceSheet.save();
  console.log("AppBalanceSheet Created Successfully");

  // END BALANCE SHEET

  // // Create a result entry
  // await Result.create({
  //   resultNumber,
  //   lotdate,
  //   lottime,
  //   lotlocation,
  //   nextresulttime,
  //   resultCreatedMethod: "mannual",
  // });
  try {
    // Create and save a new result document
    const result = await Result.create({
      resultNumber,
      lotdate,
      lottime,
      lotlocation,
      nextresulttime,
      resultCreatedMethod: "mannual", // Ensure this field is provided
    });
    console.log("Result created successfully:", result); // Successfully created document
  } catch (err) {
    console.error("Error creating result:", err.message); // Handle validation or save errors
  }

  res.status(200).json({
    success: true,
    message:
      "Result Created and Wallets Updated Successfully, Notifications sent, and Playbet History Updated",
  });
});

// const createResult = asyncError(async (req, res, next) => {
//   const { resultNumber, lotdate, lottime, lotlocation, nextresulttime } =
//     req.body;

//   if (!resultNumber)
//     return next(new ErrorHandler("Result number not found", 404));
//   if (!lotdate) return next(new ErrorHandler("Date not found", 404));
//   if (!lottime) return next(new ErrorHandler("Time not found", 404));
//   if (!lotlocation) return next(new ErrorHandler("Location not found", 404));

//   // Find the Playzone entry by lotlocation, lottime, and lotdate
//   const playzone = await Playzone.findOne({
//     lotlocation,
//     lottime,
//     lotdate,
//   });

//   if (!playzone) {
//     return res.status(404).json({
//       success: false,
//       message: "Playzone entry not found",
//     });
//   }

//   if (!checkPlaynumberExists(playzone, resultNumber)) {
//     return next(new ErrorHandler("Result number not in range", 404));
//   }

//   // Find the playnumber in the playzone
//   const playnumberEntry = playzone.playnumbers.find(
//     (pn) => pn.playnumber === parseInt(resultNumber, 10)
//   );

//   if (!playnumberEntry) {
//     return next(new ErrorHandler("Playnumber entry not found", 404));
//   }

//   console.log("now getting users");
//   // Update walletOne for each user in the playnumber's users list
//   for (const userz of playnumberEntry.users) {
//     console.log("GETTING EACH USER");
//     console.log(userz);
//     const userId = userz.userId;
//     const amount = parseInt(userz.winningamount);

//     const user = await User.findOne({ userId });

//     if (!user) {
//       return next(new ErrorHandler("User not found", 404));
//     }

//     console.log("SEARCHING FOR USER");
//     console.log(user);

//     // FOR DEPOSITING MONEY IN USER WALLET ONE

//     const walletId = user.walletOne._id;
//     const wallet = await WalletOne.findById(walletId);
//     const totalBalanceAmount = parseFloat(wallet.balance);
//     const remainingWalletBalance = totalBalanceAmount + parseFloat(amount);

//     // Update wallet
//     await WalletOne.findByIdAndUpdate(
//       walletId,
//       { balance: remainingWalletBalance },
//       { new: true }
//     );

//     // FOR NOTIFICATION
//     const notification = await Notification.create({
//       title: "Congratulations! You won!",
//       description: `You have won an amount of ${amount}.`,
//     });

//     // Add notification to the user's notifications array
//     user.notifications.push(notification._id);
//     await user.save();

//     // FOR PLAYBET HISTORY
//     const playbet = await Playbet.create({
//       playnumbers: [
//         {
//           playnumber: playnumberEntry.playnumber,
//           amount: userz.winningamount,
//           winningamount: userz.winningamount,
//         },
//       ],
//       username: user.name,
//       userid: user.userId,
//       currency: user.country._id.toString(), // Assuming currency is related to the user
//       lotdate: lotdate,
//       lottime: lottime,
//       lotlocation: lotlocation,
//       walletName: wallet.walletName,
//     });

//     // Add playbet history to the user's playbetHistory array
//     user.playbetHistory.push(playbet._id);
//     await user.save();

//     // Creating top winner list
//     const topWinner = await topwinner.create({
//       userId: user.userId,
//       name: user.name,
//       avatar: user?.avatar,
//       playnumber: playnumberEntry.playnumber,
//       amount: userz.amount,
//       winningamount: userz.winningamount,
//       currency: user.country._id.toString(),
//     });

//     console.log(topWinner);
//     console.log({
//       userId: user.userId,
//       name: user.name,
//       avatar: user?.avatar,
//       playnumber: playnumberEntry.playnumber,
//       amount: userz.amount,
//       winningamount: userz.winningamount,
//       currency: user.country._id.toString(),
//     });
//   }

//   // FOR BALANCE SHEET
//   // Fetch all WalletTwo balances and populate currencyId
//   const walletTwoBalances = await WalletTwo.find({}).populate("currencyId");
//   let gameBalance = 0;

//   walletTwoBalances.forEach((wallet) => {
//     const walletCurrencyConverter = parseFloat(
//       wallet.currencyId.countrycurrencyvaluecomparedtoinr
//     );
//     gameBalance += wallet.balance * walletCurrencyConverter;
//   });

//   // Fetch all WalletOne balances and populate currencyId
//   const walletOneBalances = await WalletOne.find({}).populate("currencyId");
//   let withdrawalBalance = 0;

//   walletOneBalances.forEach((wallet) => {
//     const walletCurrencyConverter = parseFloat(
//       wallet.currencyId.countrycurrencyvaluecomparedtoinr
//     );
//     withdrawalBalance += wallet.balance * walletCurrencyConverter;
//   });

//   // Calculate total balance as the sum of walletOne and walletTwo balances
//   const totalBalance = withdrawalBalance + gameBalance;

//   // Search for the "INR" countrycurrencysymbol in the Currency Collection
//   const currency = await Currency.findOne({ countrycurrencysymbol: "INR" });
//   if (!currency) {
//     return next(new ErrorHandler("Currency not found", 404));
//   }

//   // Create a new AppBalanceSheet document
//   const appBalanceSheet = new AppBalanceSheet({
//     amount: playnumberEntry.distributiveamount,
//     withdrawalbalance: withdrawalBalance,
//     gamebalance: gameBalance,
//     totalbalance: totalBalance,
//     usercurrency: currency._id, // Use the _id of the found currency
//     activityType: "Winning",
//     userId: playnumberEntry?.users[0]?.userId || "1000",
//     payzoneId: playzone._id,
//     paymentProcessType: "Credit",
//     walletName: req.user.walletOne.walletName,
//   });

//   // Save the AppBalanceSheet document
//   await appBalanceSheet.save();
//   console.log("AppBalanceSheet Created Successfully");

//   // END BALANCE SHEET

//   // // Create a result entry
//   // await Result.create({
//   //   resultNumber,
//   //   lotdate,
//   //   lottime,
//   //   lotlocation,
//   //   nextresulttime,
//   //   resultCreatedMethod: "mannual",
//   // });
//   try {
//     // Create and save a new result document
//     const result = await Result.create({
//       resultNumber,
//       lotdate,
//       lottime,
//       lotlocation,
//       nextresulttime,
//       resultCreatedMethod: "mannual", // Ensure this field is provided
//     });
//     console.log("Result created successfully:", result); // Successfully created document
//   } catch (err) {
//     console.error("Error creating result:", err.message); // Handle validation or save errors
//   }

//   res.status(200).json({
//     success: true,
//     message:
//       "Result Created and Wallets Updated Successfully, Notifications sent, and Playbet History Updated",
//   });
// });
const createPowerResult = asyncError(async (req, res, next) => {
  const { jackpotnumber, powerdate, powertime, prize } = req.body;

  try {
    // Validate request body
    if (
      !jackpotnumber ||
      !Array.isArray(jackpotnumber) ||
      jackpotnumber.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Jackpot numbers are required and must be an array.",
      });
    }
    if (!powerdate || !powertime) {
      return res.status(400).json({
        success: false,
        message: "Powerdate and Powertime are required.",
      });
    }
    if (!prize || typeof prize !== "object") {
      return res.status(400).json({
        success: false,
        message: "Prize details are required.",
      });
    }

    // Step 1: Create new PowerResult
    const powerResult = await powerresult.create({
      jackpotnumber,
      powerdate,
      powertime,
      prize,
    });

    console.log(
      `New PowerResult Created: ID: ${powerResult._id}, Created At: ${powerResult.createdAt}`
    );

    const games = await PowerBallGame.find().sort({ createdAt: -1 });

    if (games.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No Powerball Game winner rule found.",
      });
    }

    const game = games[0];

    // Step 2: Find the PowerballGameTickets for the given powerdate and powertime
    const powerGame = await PowerballGameTickets.findOne({
      powerdate,
      powertime,
    });

    if (!powerGame) {
      return res.status(404).json({
        success: false,
        message: "No Powerball Game found for the given date and time.",
      });
    }

    // Step 3: Get all tickets from the found power game
    const allTickets = powerGame.alltickets;

    // Step 4: Function to distribute prize

    let winningAmount = 0;

    // Distribute prize
    for (let holder of allTickets) {
      for (let ticket of holder.tickets) {
        const user = await User.findOne({ userId: holder.userId });
        if (!user) continue;

        const wallet = await WalletOne.findById(user.walletOne._id);
        if (!wallet) continue;

        const isMatch = (count) =>
          ticket.usernumber
            .slice(0, count)
            .every((n, i) => n === jackpotnumber[i]);

        let wonAmount = 0;
        if (isMatch(6)) {
          wonAmount = prize.winnerPrize.firstprize * ticket.multiplier;
          console.log("First Prize");
          console.log(wonAmount);
        } else if (isMatch(5)) {
          wonAmount = prize.winnerPrize.secondPrize * ticket.multiplier;
          console.log("2 Prize");
          console.log(wonAmount);
        } else if (isMatch(4)) {
          wonAmount = prize.winnerPrize.thirdprize * ticket.multiplier;
          console.log("3 Prize");
          console.log(wonAmount);
        } else if (isMatch(3)) {
          wonAmount =
            ticket.convertedAmount * parseFloat(prize.winnerPrize.fourthPrize);
          console.log("4 Prize");
          console.log(wonAmount);
        } else if (isMatch(2)) {
          wonAmount =
            ticket.convertedAmount * parseFloat(prize.winnerPrize.fifthprize);
          console.log("5 Prize");
          console.log(wonAmount);
        } else if (isMatch(1)) {
          wonAmount =
            ticket.convertedAmount * parseFloat(game.winnerPrize.sixthPrize);
          console.log("6 Prize");
          console.log(wonAmount);
          console.log(ticket);
          console.log(jackpotnumber);
          console.log(ticket.convertedAmount);
          console.log(game.winnerPrize.sixthPrize);
        }

        if (wonAmount > 0) {
          winningAmount += wonAmount;
          await WalletOne.findByIdAndUpdate(wallet._id, {
            balance: wallet.balance + wonAmount,
          });

          // const notification = await Notification.create({
          //   title: "Congratulations! You won!",
          //   description: `You have won an amount of ${wonAmount}.`,
          // });

          const notification = await Notification.create({
            title: "Congratulations! You won!",
            description: `An amount of ${wonAmount} has been credited to your ${wallet.walletName} wallet.`,
          });

          user.notifications.push(notification._id);
          await user.save();

          const playbet = await Playbet.create({
            tickets: [
              {
                amount: wonAmount,
                convertedAmount: wonAmount,
                multiplier: ticket.multiplier,
                usernumber: jackpotnumber,
              },
            ],
            username: user.name,
            userid: user.userId,
            currency: user.country._id.toString(),
            powerdate,
            powertime,
            gameType: "powerball",
            walletName: wallet.walletName,
          });

          user.playbetHistory.push(playbet._id);
          await user.save();
        }
      }
    }

    // Function to distribute prize
    // const distributePrize = async (matchCount, prizeAmount) => {
    //   for (let ticketHolder of allTickets) {
    //     for (let ticket of ticketHolder.tickets) {
    //       // Count the number of matching numbers
    //       // const matches = ticket.usernumber.filter((num) =>
    //       //   jackpotnumber.includes(num)
    //       // ).length;

    //       const matches = ticket.usernumber.filter((num) =>
    //         jackpotnumber.includes(num)
    //       ).length;

    //       if (matches === matchCount) {
    //         const user = await User.findOne({ userId: ticketHolder.userId });

    //         if (user) {
    //           const walletId = user.walletOne._id;
    //           const wallet = await WalletOne.findById(walletId);
    //           const totalBalanceAmount = parseFloat(wallet.balance);

    //           let wonAmount = 0;

    //           // Calculate wonAmount based on matchCount
    //           if (matchCount === 6) {
    //             wonAmount = prize.firstprize.amount * ticket.multiplier;
    //           } else if (matchCount === 5) {
    //             wonAmount = prize.secondprize.amount * ticket.multiplier;
    //           } else if (matchCount === 4) {
    //             wonAmount = prize.thirdprize.amount * ticket.multiplier;
    //           } else if (matchCount === 3) {
    //             wonAmount =
    //               ticket.convertedAmount * parseFloat(prize.fourthprize.amount);
    //           } else if (matchCount === 2) {
    //             wonAmount =
    //               ticket.convertedAmount * parseFloat(prize.fifthprize.amount);
    //           } else if (matchCount === 1) {
    //             wonAmount =
    //               ticket.convertedAmount * parseFloat(prize.sixthprize.amount);
    //           }

    //           // Accumulate winningAmount
    //           winningAmount += wonAmount;

    //           // Log the wonAmount for debugging
    //           console.log(
    //             `User: ${ticketHolder.username}, Ticket: ${ticket._id}, Matches: ${matchCount}, Won Amount: ${wonAmount}`
    //           );

    //           const remainingWalletBalance =
    //             totalBalanceAmount + parseFloat(wonAmount);

    //           // Update wallet
    //           await WalletOne.findByIdAndUpdate(
    //             walletId,
    //             { balance: remainingWalletBalance },
    //             { new: true }
    //           );

    //           // FOR NOTIFICATION
    //           const notification = await Notification.create({
    //             title: "Congratulations! You won!",
    //             description: `You have won an amount of ${wonAmount}.`,
    //           });

    //           // Add notification to the user's notifications array
    //           user.notifications.push(notification._id);
    //           await user.save();

    //           // FOR PLAYBET HISTORY
    //           const playbet = await Playbet.create({
    //             tickets: [
    //               {
    //                 amount: wonAmount,
    //                 convertedAmount: wonAmount,
    //                 multiplier: ticket.multiplier,
    //                 usernumber: jackpotnumber,
    //               },
    //             ],
    //             username: user.name,
    //             userid: user.userId,
    //             currency: user.country._id.toString(),
    //             powerdate: powerdate,
    //             powertime: powertime,
    //             gameType: "powerball",
    //             walletName: wallet.walletName,
    //           });

    //           // Add playbet history to the user's playbetHistory array
    //           user.playbetHistory.push(playbet._id);
    //           await user.save();
    //         }
    //       }
    //     }
    //   }
    // };

    // // Step 5: Distribute prizes based on matches
    // await distributePrize(6, prize.firstprize.amount);
    // await distributePrize(5, prize.secondprize.amount);
    // await distributePrize(4, prize.thirdprize.amount);
    // await distributePrize(3, prize.fourthprize.amount);
    // await distributePrize(2, prize.fifthprize.amount);
    // await distributePrize(1, prize.sixthprize.amount);

    // [FOR PARTNER PAYOUT]

    const totalBetAmount = allTickets.reduce((sum, user) => {
      return (
        sum +
        user.tickets.reduce((userSum, ticket) => {
          return userSum + ticket.convertedAmount;
        }, 0)
      );
    }, 0);

    // Calculate totalProfit
    const totalProfit = totalBetAmount - winningAmount;

    // Log the results for debugging
    console.log(`Total Bet Amount: ${totalBetAmount}`);
    console.log(`Total Winning Amount: ${winningAmount}`);
    console.log(`Total Profit: ${totalProfit}`);

    // Find partner performance
    const partnerperformance = await PartnerPerformancePowerball.findOne({
      powertime,
      powerdate,
    });

    if (!partnerperformance) {
      return next(new ErrorHandler("Partner performance not found", 404));
    }

    partnerperformance.totalAmount = totalBetAmount;
    partnerperformance.totalProfit = totalProfit;
    partnerperformance.winningAmount = winningAmount;
    // Initialize profitDistributiveArray
    const profitDistributiveArray = [];

    // Loop through each partner in partnerperformance.performances
    for (const partner of partnerperformance.performances) {
      // Calculate contributionAmount by summing users[].convertedAmount
      const contributionAmount = partner.users.reduce(
        (sum, user) => sum + parseFloat(user.convertedAmount || 0),
        0
      );

      // Calculate contributionPercentage
      const contributionPercentage =
        (contributionAmount / totalBetAmount) * 100;

      // Calculate profitBasedOnContribution
      const profitBasedOnContribution =
        (contributionPercentage / 100) * totalProfit;

      // Update the partner's contributionAmount and contributionPercentage
      partner.contributionAmount = contributionAmount;
      partner.contributionPercentage = contributionPercentage;

      // Check if partnerStatus is true
      if (!partner.partnerStatus) continue;

      // Check rechargeStatus
      if (partner.rechargeStatus) {
        // Calculate partnerUserProfit
        const partnerUserProfit =
          parseFloat(partner.profitPercentage) +
          parseFloat(partner.rechargePercentage);

        // Calculate partnerUserAmount
        const partnerUserAmount =
          (partnerUserProfit / 100) * profitBasedOnContribution;

        // Ensure userId is unique in profitDistributiveArray
        const existingUser = profitDistributiveArray.find(
          (item) => item.userId === partner.partnerId
        );

        if (existingUser) {
          existingUser.amount += partnerUserAmount;
        } else {
          profitDistributiveArray.push({
            userId: partner.partnerId,
            amount: partnerUserAmount,
          });
        }

        // CHECKING FOR THE PARENT PARTNER
        if (partner.parentPartnerId !== 1000) {
          const parentPartnerUserProfit =
            parseFloat(partner.parentPartnerProfitPercentage) -
            parseFloat(partner.profitPercentage);

          const parentPartnerUserAmount =
            (parentPartnerUserProfit / 100) * profitBasedOnContribution;

          // Ensure userId is unique in profitDistributiveArray
          const existingUser = profitDistributiveArray.find(
            (item) => item.userId === partner.parentPartnerId
          );

          if (existingUser) {
            existingUser.amount += parentPartnerUserAmount;
          } else {
            profitDistributiveArray.push({
              userId: partner.parentPartnerId,
              amount: parentPartnerUserAmount,
            });
          }
        }

        // CHECKING FOR THE PARENT PARENT PARTNER
        if (partner.parentParentPartnerId !== 1000) {
          const parentParentPartnerUserProfit =
            parseFloat(partner.parentParentPartnerProfitPercentage) -
            parseFloat(partner.parentPartnerProfitPercentage);

          const parentParentPartnerUserAmount =
            (parentParentPartnerUserProfit / 100) * profitBasedOnContribution;

          // Ensure userId is unique in profitDistributiveArray
          const existingUser = profitDistributiveArray.find(
            (item) => item.userId === partner.parentParentPartnerId
          );

          if (existingUser) {
            existingUser.amount += parentParentPartnerUserAmount;
          } else {
            profitDistributiveArray.push({
              userId: partner.parentParentPartnerId,
              amount: parentParentPartnerUserAmount,
            });
          }
        }
      } else {
        // Calculate partnerUserProfit
        const partnerUserProfit = parseFloat(partner.profitPercentage);

        // Calculate partnerUserAmount
        const partnerUserAmount =
          (partnerUserProfit / 100) * profitBasedOnContribution;

        // Ensure userId is unique in profitDistributiveArray
        const existingUser = profitDistributiveArray.find(
          (item) => item.userId === partner.partnerId
        );

        if (existingUser) {
          existingUser.amount += partnerUserAmount;
        } else {
          profitDistributiveArray.push({
            userId: partner.partnerId,
            amount: partnerUserAmount,
          });
        }

        // CHECKING FOR THE PARENT PARTNER
        if (partner.parentPartnerId !== 1000) {
          if (partner.parentPartnerRechargeStatus) {
            const parentPartnerUserProfit =
              parseFloat(partner.parentPartnerProfitPercentage) +
              parseFloat(partner.parentPartnerRechargePercentage) -
              parseFloat(partner.profitPercentage);

            const parentPartnerUserAmount =
              (parentPartnerUserProfit / 100) * profitBasedOnContribution;

            // Ensure userId is unique in profitDistributiveArray
            const existingUser = profitDistributiveArray.find(
              (item) => item.userId === partner.parentPartnerId
            );

            if (existingUser) {
              existingUser.amount += parentPartnerUserAmount;
            } else {
              profitDistributiveArray.push({
                userId: partner.parentPartnerId,
                amount: parentPartnerUserAmount,
              });
            }
          } else {
            const parentPartnerUserProfit =
              parseFloat(partner.parentPartnerProfitPercentage) -
              parseFloat(partner.profitPercentage);

            const parentPartnerUserAmount =
              (parentPartnerUserProfit / 100) * profitBasedOnContribution;

            // Ensure userId is unique in profitDistributiveArray
            const existingUser = profitDistributiveArray.find(
              (item) => item.userId === partner.parentPartnerId
            );

            if (existingUser) {
              existingUser.amount += parentPartnerUserAmount;
            } else {
              profitDistributiveArray.push({
                userId: partner.parentPartnerId,
                amount: parentPartnerUserAmount,
              });
            }
          }
        }

        // CHECKING FOR THE PARENT PARENT PARTNER
        if (partner.parentParentPartnerId !== 1000) {
          if (partner.parentParentPartnerRechargeStatus) {
            let parentParentPartnerUserProfit = 0;

            if (partner.parentPartnerRechargeStatus) {
              parentParentPartnerUserProfit =
                parseFloat(partner.parentParentPartnerProfitPercentage) -
                parseFloat(partner.parentPartnerProfitPercentage);
            } else {
              parentParentPartnerUserProfit =
                parseFloat(partner.parentParentPartnerProfitPercentage) +
                parseFloat(partner.parentParentPartnerRechargePercentage) -
                parseFloat(partner.parentPartnerProfitPercentage);
            }

            const parentParentPartnerUserAmount =
              (parentParentPartnerUserProfit / 100) * profitBasedOnContribution;

            // Ensure userId is unique in profitDistributiveArray
            const existingUser = profitDistributiveArray.find(
              (item) => item.userId === partner.parentParentPartnerId
            );

            if (existingUser) {
              existingUser.amount += parentParentPartnerUserAmount;
            } else {
              profitDistributiveArray.push({
                userId: partner.parentParentPartnerId,
                amount: parentParentPartnerUserAmount,
              });
            }
          } else {
            const parentParentPartnerUserProfit =
              parseFloat(partner.parentParentPartnerProfitPercentage) -
              parseFloat(partner.parentPartnerProfitPercentage);

            const parentParentPartnerUserAmount =
              (parentParentPartnerUserProfit / 100) * profitBasedOnContribution;

            // Ensure userId is unique in profitDistributiveArray
            const existingUser = profitDistributiveArray.find(
              (item) => item.userId === partner.parentParentPartnerId
            );

            if (existingUser) {
              existingUser.amount += parentParentPartnerUserAmount;
            } else {
              profitDistributiveArray.push({
                userId: partner.parentParentPartnerId,
                amount: parentParentPartnerUserAmount,
              });
            }
          }
        }
      }
    }

    // Update partner.profitAmount based on profitDistributiveArray
    for (const profitEntry of profitDistributiveArray) {
      const partner = partnerperformance.performances.find(
        (p) => p.partnerId === profitEntry.userId
      );

      if (partner) {
        partner.profitAmount = profitEntry.amount;
      }
    }

    // Save the updated partnerperformance document
    await partnerperformance.save();

    // DISTRIBUTE PROFIT TO PARTNERS
    for (const userz of profitDistributiveArray) {
      console.log("GETTING EACH USER");
      console.log(userz);
      const userId = userz.userId;
      // const amount = parseInt(userz.amount);
      // Check if amount is negative and replace with 0
      const amount = Math.max(0, parseInt(userz.amount)); // This will take the higher value (0 if amount is negative)

      const user = await User.findOne({ userId });

      if (!user) {
        return next(new ErrorHandler("User not found", 404));
      }

      // FOR DEPOSITING MONEY IN USER WALLET ONE

      const walletId = user.walletOne._id;
      const wallet = await WalletOne.findById(walletId);
      const totalBalanceAmount = parseFloat(wallet.balance);
      const remainingWalletBalance = totalBalanceAmount + parseFloat(amount);

      // Update wallet
      await WalletOne.findByIdAndUpdate(
        walletId,
        { balance: remainingWalletBalance },
        { new: true }
      );

      // FOR NOTIFICATION
      // const notification = await Notification.create({
      //   title: "Partner Profit",
      //   description: `Your partner profit amount ${amount} credited.`,
      // });

      const notification = await Notification.create({
        title: "Partner Profit",
        description: `Your partner profit amount ${amount} credited to ${wallet.walletName} wallet.`,
      });

      // Add notification to the user's notifications array
      user.notifications.push(notification._id);
      await user.save();

      // FOR PLAYBET HISTORY
      const playbet = await Playbet.create({
        tickets: [
          {
            amount: amount,
            convertedAmount: amount,
            multiplier: 1,
            usernumber: jackpotnumber,
          },
        ],
        username: user.name,
        userid: user.userId,
        currency: user.country._id.toString(), // Assuming currency is related to the user
        powerdate: powerdate,
        powertime: powertime,
        walletName: wallet.walletName,
        gameType: "powerball",
        forProcess: "partnercredit",
      });

      // Add playbet history to the user's playbetHistory array
      user.playbetHistory.push(playbet._id);
      await user.save();
    }

    // [END PARTNER PAYOUT]

    // TODO: ADDING TO BALANCE SHEET
    // // Fetch all WalletTwo balances and populate currencyId
    // const walletTwoBalances = await WalletTwo.find({}).populate("currencyId");
    // let gameBalance = 0;

    // walletTwoBalances.forEach((wallet) => {
    //   const walletCurrencyConverter = parseFloat(
    //     wallet.currencyId.countrycurrencyvaluecomparedtoinr
    //   );
    //   gameBalance += wallet.balance * walletCurrencyConverter;
    // });

    // // Fetch all WalletOne balances and populate currencyId
    // const walletOneBalances = await WalletOne.find({}).populate("currencyId");
    // let withdrawalBalance = 0;

    // walletOneBalances.forEach((wallet) => {
    //   const walletCurrencyConverter = parseFloat(
    //     wallet.currencyId.countrycurrencyvaluecomparedtoinr
    //   );
    //   withdrawalBalance += wallet.balance * walletCurrencyConverter;
    // });

    // // Calculate total balance as the sum of walletOne and walletTwo balances
    // const totalBalance = withdrawalBalance + gameBalance;

    // // Search for the "INR" countrycurrencysymbol in the Currency Collection
    // const currency = await Currency.findOne({ countrycurrencysymbol: "INR" });
    // if (!currency) {
    //   return next(new ErrorHandler("Currency not found", 404));
    // }
    // // Create a new AppBalanceSheet document
    // const appBalanceSheet = new AppBalanceSheet({
    //   amount: totalAmount,
    //   withdrawalbalance: withdrawalBalance,
    //   gamebalance: gameBalance,
    //   totalbalance: totalBalance,
    //   usercurrency: currency._id, // Use the _id of the found currency
    //   activityType: "Winning",
    //   userId: playnumberEntry?.users[0]?.userId || "1000",
    //   payzoneId: playzone._id,
    //   paymentProcessType: "Credit",
    //   walletName: req.user.walletOne.walletName,
    // });

    // // Save the AppBalanceSheet document
    // await appBalanceSheet.save();
    // console.log("AppBalanceSheet Created Successfully");

    res.status(201).json({
      success: true,
      message: "PowerResult created and prizes distributed successfully",
      data: powerResult,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create PowerResult and distribute prizes",
      error: error.message,
    });
  }
});

// const createPowerResult = asyncError(async (req, res, next) => {
//   const { jackpotnumber, powerdate, powertime, prize } = req.body;

//   try {
//     // Validate request body
//     if (
//       !jackpotnumber ||
//       !Array.isArray(jackpotnumber) ||
//       jackpotnumber.length === 0
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: "Jackpot numbers are required and must be an array.",
//       });
//     }
//     if (!powerdate || !powertime) {
//       return res.status(400).json({
//         success: false,
//         message: "Powerdate and Powertime are required.",
//       });
//     }
//     if (!prize || typeof prize !== "object") {
//       return res.status(400).json({
//         success: false,
//         message: "Prize details are required.",
//       });
//     }

//     // Step 1: Create new PowerResult
//     const powerResult = await powerresult.create({
//       jackpotnumber,
//       powerdate,
//       powertime,
//       prize,
//     });

//     console.log(
//       `New PowerResult Created: ID: ${powerResult._id}, Created At: ${powerResult.createdAt}`
//     );

//     // Step 2: Find the PowerballGameTickets for the given powerdate and powertime
//     const powerGame = await PowerballGameTickets.findOne({
//       powerdate,
//       powertime,
//     });

//     if (!powerGame) {
//       return res.status(404).json({
//         success: false,
//         message: "No Powerball Game found for the given date and time.",
//       });
//     }

//     // Step 3: Get all tickets from the found power game
//     const allTickets = powerGame.alltickets;

//     // Step 4: Function to distribute prize

//     let winningAmount = 0;

//     // Function to distribute prize
//     const distributePrize = async (matchCount, prizeAmount) => {
//       for (let ticketHolder of allTickets) {
//         for (let ticket of ticketHolder.tickets) {
//           // Count the number of matching numbers
//           const matches = ticket.usernumber.filter((num) =>
//             jackpotnumber.includes(num)
//           ).length;

//           if (matches === matchCount) {
//             const user = await User.findOne({ userId: ticketHolder.userId });

//             if (user) {
//               const walletId = user.walletOne._id;
//               const wallet = await WalletOne.findById(walletId);
//               const totalBalanceAmount = parseFloat(wallet.balance);

//               let wonAmount = 0;

//               // Calculate wonAmount based on matchCount
//               if (matchCount === 6) {
//                 wonAmount = prize.firstprize.amount * ticket.multiplier;
//               } else if (matchCount === 5) {
//                 wonAmount = prize.secondprize.amount * ticket.multiplier;
//               } else if (matchCount === 4) {
//                 wonAmount = prize.thirdprize.amount * ticket.multiplier;
//               } else if (matchCount === 3) {
//                 wonAmount =
//                   ticket.convertedAmount * parseFloat(prize.fourthprize.amount);
//               } else if (matchCount === 2) {
//                 wonAmount =
//                   ticket.convertedAmount * parseFloat(prize.fifthprize.amount);
//               } else if (matchCount === 1) {
//                 wonAmount =
//                   ticket.convertedAmount * parseFloat(prize.sixthprize.amount);
//               }

//               // Accumulate winningAmount
//               winningAmount += wonAmount;

//               // Log the wonAmount for debugging
//               console.log(
//                 `User: ${ticketHolder.username}, Ticket: ${ticket._id}, Matches: ${matchCount}, Won Amount: ${wonAmount}`
//               );

//               const remainingWalletBalance =
//                 totalBalanceAmount + parseFloat(wonAmount);

//               // Update wallet
//               await WalletOne.findByIdAndUpdate(
//                 walletId,
//                 { balance: remainingWalletBalance },
//                 { new: true }
//               );

//               // FOR NOTIFICATION
//               const notification = await Notification.create({
//                 title: "Congratulations! You won!",
//                 description: `You have won an amount of ${wonAmount}.`,
//               });

//               // Add notification to the user's notifications array
//               user.notifications.push(notification._id);
//               await user.save();

//               // FOR PLAYBET HISTORY
//               const playbet = await Playbet.create({
//                 tickets: [
//                   {
//                     amount: wonAmount,
//                     convertedAmount: wonAmount,
//                     multiplier: ticket.multiplier,
//                     usernumber: jackpotnumber,
//                   },
//                 ],
//                 username: user.name,
//                 userid: user.userId,
//                 currency: user.country._id.toString(),
//                 powerdate: powerdate,
//                 powertime: powertime,
//                 gameType: "powerball",
//                 walletName: wallet.walletName,
//               });

//               // Add playbet history to the user's playbetHistory array
//               user.playbetHistory.push(playbet._id);
//               await user.save();
//             }
//           }
//         }
//       }
//     };

//     // Step 5: Distribute prizes based on matches
//     await distributePrize(6, prize.firstprize.amount);
//     await distributePrize(5, prize.secondprize.amount);
//     await distributePrize(4, prize.thirdprize.amount);
//     await distributePrize(3, prize.fourthprize.amount);
//     await distributePrize(2, prize.fifthprize.amount);
//     await distributePrize(1, prize.sixthprize.amount);

//     // [FOR PARTNER PAYOUT]

//     const totalBetAmount = allTickets.reduce((sum, user) => {
//       return (
//         sum +
//         user.tickets.reduce((userSum, ticket) => {
//           return userSum + ticket.convertedAmount;
//         }, 0)
//       );
//     }, 0);

//     // Calculate totalProfit
//     const totalProfit = totalBetAmount - winningAmount;

//     // Log the results for debugging
//     console.log(`Total Bet Amount: ${totalBetAmount}`);
//     console.log(`Total Winning Amount: ${winningAmount}`);
//     console.log(`Total Profit: ${totalProfit}`);

//     // Find partner performance
//     const partnerperformance = await PartnerPerformancePowerball.findOne({
//       powertime,
//       powerdate,
//     });

//     if (!partnerperformance) {
//       return next(new ErrorHandler("Partner performance not found", 404));
//     }

//     partnerperformance.totalAmount = totalBetAmount;
//     partnerperformance.totalProfit = totalProfit;
//     partnerperformance.winningAmount = winningAmount;
//     // Initialize profitDistributiveArray
//     const profitDistributiveArray = [];

//     // Loop through each partner in partnerperformance.performances
//     for (const partner of partnerperformance.performances) {
//       // Calculate contributionAmount by summing users[].convertedAmount
//       const contributionAmount = partner.users.reduce(
//         (sum, user) => sum + parseFloat(user.convertedAmount || 0),
//         0
//       );

//       // Calculate contributionPercentage
//       const contributionPercentage =
//         (contributionAmount / totalBetAmount) * 100;

//       // Calculate profitBasedOnContribution
//       const profitBasedOnContribution =
//         (contributionPercentage / 100) * totalProfit;

//       // Update the partner's contributionAmount and contributionPercentage
//       partner.contributionAmount = contributionAmount;
//       partner.contributionPercentage = contributionPercentage;

//       // Check if partnerStatus is true
//       if (!partner.partnerStatus) continue;

//       // Check rechargeStatus
//       if (partner.rechargeStatus) {
//         // Calculate partnerUserProfit
//         const partnerUserProfit =
//           parseFloat(partner.profitPercentage) +
//           parseFloat(partner.rechargePercentage);

//         // Calculate partnerUserAmount
//         const partnerUserAmount =
//           (partnerUserProfit / 100) * profitBasedOnContribution;

//         // Ensure userId is unique in profitDistributiveArray
//         const existingUser = profitDistributiveArray.find(
//           (item) => item.userId === partner.partnerId
//         );

//         if (existingUser) {
//           existingUser.amount += partnerUserAmount;
//         } else {
//           profitDistributiveArray.push({
//             userId: partner.partnerId,
//             amount: partnerUserAmount,
//           });
//         }

//         // CHECKING FOR THE PARENT PARTNER
//         if (partner.parentPartnerId !== 1000) {
//           const parentPartnerUserProfit =
//             parseFloat(partner.parentPartnerProfitPercentage) -
//             parseFloat(partner.profitPercentage);

//           const parentPartnerUserAmount =
//             (parentPartnerUserProfit / 100) * profitBasedOnContribution;

//           // Ensure userId is unique in profitDistributiveArray
//           const existingUser = profitDistributiveArray.find(
//             (item) => item.userId === partner.parentPartnerId
//           );

//           if (existingUser) {
//             existingUser.amount += partnerUserAmount;
//           } else {
//             profitDistributiveArray.push({
//               userId: partner.parentPartnerId,
//               amount: parentPartnerUserAmount,
//             });
//           }
//         }

//         // CHECKING FOR THE PARENT PARENT PARTNER
//         if (partner.parentParentPartnerId !== 1000) {
//           const parentParentPartnerUserProfit =
//             parseFloat(partner.parentParentPartnerProfitPercentage) -
//             parseFloat(partner.parentPartnerProfitPercentage);

//           const parentParentPartnerUserAmount =
//             (parentParentPartnerUserProfit / 100) * profitBasedOnContribution;

//           // Ensure userId is unique in profitDistributiveArray
//           const existingUser = profitDistributiveArray.find(
//             (item) => item.userId === partner.parentParentPartnerId
//           );

//           if (existingUser) {
//             existingUser.amount += partnerUserAmount;
//           } else {
//             profitDistributiveArray.push({
//               userId: partner.parentParentPartnerId,
//               amount: parentParentPartnerUserAmount,
//             });
//           }
//         }
//       } else {
//         // Calculate partnerUserProfit
//         const partnerUserProfit = parseFloat(partner.profitPercentage);

//         // Calculate partnerUserAmount
//         const partnerUserAmount =
//           (partnerUserProfit / 100) * profitBasedOnContribution;

//         // Ensure userId is unique in profitDistributiveArray
//         const existingUser = profitDistributiveArray.find(
//           (item) => item.userId === partner.partnerId
//         );

//         if (existingUser) {
//           existingUser.amount += partnerUserAmount;
//         } else {
//           profitDistributiveArray.push({
//             userId: partner.partnerId,
//             amount: partnerUserAmount,
//           });
//         }

//         // CHECKING FOR THE PARENT PARTNER
//         if (partner.parentPartnerId !== 1000) {
//           if (partner.parentPartnerRechargeStatus) {
//             const parentPartnerUserProfit =
//               parseFloat(partner.parentPartnerProfitPercentage) +
//               parseFloat(partner.parentPartnerRechargePercentage) -
//               parseFloat(partner.profitPercentage);

//             const parentPartnerUserAmount =
//               (parentPartnerUserProfit / 100) * profitBasedOnContribution;

//             // Ensure userId is unique in profitDistributiveArray
//             const existingUser = profitDistributiveArray.find(
//               (item) => item.userId === partner.parentPartnerId
//             );

//             if (existingUser) {
//               existingUser.amount += partnerUserAmount;
//             } else {
//               profitDistributiveArray.push({
//                 userId: partner.parentPartnerId,
//                 amount: parentPartnerUserAmount,
//               });
//             }
//           } else {
//             const parentPartnerUserProfit =
//               parseFloat(partner.parentPartnerProfitPercentage) -
//               parseFloat(partner.profitPercentage);

//             const parentPartnerUserAmount =
//               (parentPartnerUserProfit / 100) * profitBasedOnContribution;

//             // Ensure userId is unique in profitDistributiveArray
//             const existingUser = profitDistributiveArray.find(
//               (item) => item.userId === partner.parentPartnerId
//             );

//             if (existingUser) {
//               existingUser.amount += partnerUserAmount;
//             } else {
//               profitDistributiveArray.push({
//                 userId: partner.parentPartnerId,
//                 amount: parentPartnerUserAmount,
//               });
//             }
//           }
//         }

//         // CHECKING FOR THE PARENT PARENT PARTNER
//         if (partner.parentParentPartnerId !== 1000) {
//           if (partner.parentParentPartnerRechargeStatus) {
//             const parentParentPartnerUserProfit =
//               parseFloat(partner.parentParentPartnerProfitPercentage) +
//               parseFloat(partner.parentParentPartnerRechargePercentage) -
//               parseFloat(partner.parentPartnerProfitPercentage);

//             const parentParentPartnerUserAmount =
//               (parentParentPartnerUserProfit / 100) * profitBasedOnContribution;

//             // Ensure userId is unique in profitDistributiveArray
//             const existingUser = profitDistributiveArray.find(
//               (item) => item.userId === partner.parentParentPartnerId
//             );

//             if (existingUser) {
//               existingUser.amount += partnerUserAmount;
//             } else {
//               profitDistributiveArray.push({
//                 userId: partner.parentParentPartnerId,
//                 amount: parentParentPartnerUserAmount,
//               });
//             }
//           } else {
//             const parentParentPartnerUserProfit =
//               parseFloat(partner.parentParentPartnerProfitPercentage) -
//               parseFloat(partner.parentPartnerProfitPercentage);

//             const parentParentPartnerUserAmount =
//               (parentParentPartnerUserProfit / 100) * profitBasedOnContribution;

//             // Ensure userId is unique in profitDistributiveArray
//             const existingUser = profitDistributiveArray.find(
//               (item) => item.userId === partner.parentParentPartnerId
//             );

//             if (existingUser) {
//               existingUser.amount += partnerUserAmount;
//             } else {
//               profitDistributiveArray.push({
//                 userId: partner.parentParentPartnerId,
//                 amount: parentParentPartnerUserAmount,
//               });
//             }
//           }
//         }
//       }
//     }

//     // Update partner.profitAmount based on profitDistributiveArray
//     for (const profitEntry of profitDistributiveArray) {
//       const partner = partnerperformance.performances.find(
//         (p) => p.partnerId === profitEntry.userId
//       );

//       if (partner) {
//         partner.profitAmount = profitEntry.amount;
//       }
//     }

//     // Save the updated partnerperformance document
//     await partnerperformance.save();

//     // DISTRIBUTE PROFIT TO PARTNERS
//     for (const userz of profitDistributiveArray) {
//       console.log("GETTING EACH USER");
//       console.log(userz);
//       const userId = userz.userId;
//       const amount = parseInt(userz.amount);

//       const user = await User.findOne({ userId });

//       if (!user) {
//         return next(new ErrorHandler("User not found", 404));
//       }

//       // FOR DEPOSITING MONEY IN USER WALLET ONE

//       const walletId = user.walletOne._id;
//       const wallet = await WalletOne.findById(walletId);
//       const totalBalanceAmount = parseFloat(wallet.balance);
//       const remainingWalletBalance = totalBalanceAmount + parseFloat(amount);

//       // Update wallet
//       await WalletOne.findByIdAndUpdate(
//         walletId,
//         { balance: remainingWalletBalance },
//         { new: true }
//       );

//       // FOR NOTIFICATION
//       const notification = await Notification.create({
//         title: "Partner Profit",
//         description: `Your partner profit amount ${amount} credited.`,
//       });

//       // Add notification to the user's notifications array
//       user.notifications.push(notification._id);
//       await user.save();

//       // FOR PLAYBET HISTORY
//       const playbet = await Playbet.create({
//         tickets: [
//           {
//             amount: amount,
//             convertedAmount: amount,
//             multiplier: 1,
//             usernumber: jackpotnumber,
//           },
//         ],
//         username: user.name,
//         userid: user.userId,
//         currency: user.country._id.toString(), // Assuming currency is related to the user
//         powerdate: powerdate,
//         powertime: powertime,
//         walletName: wallet.walletName,
//         gameType: "powerball",
//         forProcess: "partnercredit",
//       });

//       // Add playbet history to the user's playbetHistory array
//       user.playbetHistory.push(playbet._id);
//       await user.save();
//     }

//     // [END PARTNER PAYOUT]

//     // TODO: ADDING TO BALANCE SHEET
//     // // Fetch all WalletTwo balances and populate currencyId
//     // const walletTwoBalances = await WalletTwo.find({}).populate("currencyId");
//     // let gameBalance = 0;

//     // walletTwoBalances.forEach((wallet) => {
//     //   const walletCurrencyConverter = parseFloat(
//     //     wallet.currencyId.countrycurrencyvaluecomparedtoinr
//     //   );
//     //   gameBalance += wallet.balance * walletCurrencyConverter;
//     // });

//     // // Fetch all WalletOne balances and populate currencyId
//     // const walletOneBalances = await WalletOne.find({}).populate("currencyId");
//     // let withdrawalBalance = 0;

//     // walletOneBalances.forEach((wallet) => {
//     //   const walletCurrencyConverter = parseFloat(
//     //     wallet.currencyId.countrycurrencyvaluecomparedtoinr
//     //   );
//     //   withdrawalBalance += wallet.balance * walletCurrencyConverter;
//     // });

//     // // Calculate total balance as the sum of walletOne and walletTwo balances
//     // const totalBalance = withdrawalBalance + gameBalance;

//     // // Search for the "INR" countrycurrencysymbol in the Currency Collection
//     // const currency = await Currency.findOne({ countrycurrencysymbol: "INR" });
//     // if (!currency) {
//     //   return next(new ErrorHandler("Currency not found", 404));
//     // }
//     // // Create a new AppBalanceSheet document
//     // const appBalanceSheet = new AppBalanceSheet({
//     //   amount: totalAmount,
//     //   withdrawalbalance: withdrawalBalance,
//     //   gamebalance: gameBalance,
//     //   totalbalance: totalBalance,
//     //   usercurrency: currency._id, // Use the _id of the found currency
//     //   activityType: "Winning",
//     //   userId: playnumberEntry?.users[0]?.userId || "1000",
//     //   payzoneId: playzone._id,
//     //   paymentProcessType: "Credit",
//     //   walletName: req.user.walletOne.walletName,
//     // });

//     // // Save the AppBalanceSheet document
//     // await appBalanceSheet.save();
//     // console.log("AppBalanceSheet Created Successfully");

//     res.status(201).json({
//       success: true,
//       message: "PowerResult created and prizes distributed successfully",
//       data: powerResult,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Failed to create PowerResult and distribute prizes",
//       error: error.message,
//     });
//   }
// });

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
  const lotdate = await LotDate.create(req.body);

  res.status(201).json({
    success: true,
    message: "Date Added Successfully",
    lotdate,
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

// const getAllLotDateAccordindLocationAndTime = asyncError(
//   async (req, res, next) => {
//     const { lottimeId, lotlocationId } = req.query;

//     // Fetch and sort LotDate based on the createdAt field in descending order (newest first)
//     let lotdates = await LotDate.find({})
//       .populate({
//         path: "lottime",
//         populate: {
//           path: "lotlocation",
//         },
//       })
//       .sort({ createdAt: -1 }); // Sort by createdAt (newest first)

//     // Apply filtering based on lottimeId and lotlocationId if provided
//     if (lottimeId && lotlocationId) {
//       lotdates = lotdates.filter(
//         (item) =>
//           item.lottime._id.toString() === lottimeId &&
//           item.lottime.lotlocation._id.toString() === lotlocationId
//       );
//     } else if (lottimeId) {
//       lotdates = lotdates.filter(
//         (item) => item.lottime._id.toString() === lottimeId
//       );
//     } else if (lotlocationId) {
//       lotdates = lotdates.filter(
//         (item) => item.lottime.lotlocation._id.toString() === lotlocationId
//       );
//     }

//     // Send the filtered and sorted results
//     res.status(200).json({
//       success: true,
//       lotdates,
//     });
//   }
// );

const getAllLotDateAccordindLocationAndTime = asyncError(
  async (req, res, next) => {
    const { lottimeId, lotlocationId, page = 1, limit = 10 } = req.query;

    // Convert page and limit to numbers
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skip = (pageNumber - 1) * limitNumber;

    // Fetch and sort LotDate based on the createdAt field in descending order (newest first)
    let lotdates = await LotDate.find({})
      .populate({
        path: "lottime",
        populate: {
          path: "lotlocation",
        },
      })
      .sort({ createdAt: -1 }); // Sort by createdAt (newest first)

    // Apply filtering based on lottimeId and lotlocationId if provided
    if (lottimeId && lotlocationId) {
      lotdates = lotdates.filter(
        (item) =>
          item.lottime._id.toString() === lottimeId &&
          item.lottime.lotlocation._id.toString() === lotlocationId
      );
    } else if (lottimeId) {
      lotdates = lotdates.filter(
        (item) => item.lottime._id.toString() === lottimeId
      );
    } else if (lotlocationId) {
      lotdates = lotdates.filter(
        (item) => item.lottime.lotlocation._id.toString() === lotlocationId
      );
    }

    // Get total count after filtering
    const totalResults = lotdates.length;

    // Apply pagination
    const paginatedLotdates = lotdates.slice(skip, skip + limitNumber);

    // Send the paginated, filtered, and sorted results
    res.status(200).json({
      success: true,
      page: pageNumber,
      limit: limitNumber,
      totalResults,
      totalPages: Math.ceil(totalResults / limitNumber),
      lotdates: paginatedLotdates,
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

// const addLotTime = asyncError(async (req, res, next) => {
//   await LotTime.create(req.body);

//   res.status(201).json({
//     success: true,
//     message: "Time Added Successfully",
//   });
// });

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

// const addLotTime = asyncError(async (req, res, next) => {
//   // Create the LotTime
//   const lotTime = await LotTime.create(req.body);

//   // Get the newly created lottime._id
//   const lottimeId = lotTime._id;

//   // Get the current date and format it as DD-MM-YYYY
//   const currentDate = new Date();
//   const formattedDate = `${String(currentDate.getDate()).padStart(2, '0')}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getFullYear()).slice(2)}`;

//   // Create the LotDate using the formatted date and lottimeId
//   const lotDatePayload = {
//     lotdate: formattedDate,
//     lottime: lottimeId
//   };

//   const lotdate = await LotDate.create(lotDatePayload);

//   // Respond with success
//   res.status(201).json({
//     success: true,
//     message: "Time Added Successfully",
//     lottime: lotTime,
//     lotdate
//   });
// });

const addLotTime = asyncError(async (req, res, next) => {
  // 1. Create the LotTime
  const lotTime = await LotTime.create(req.body);

  // 2. Get the newly created lottime._id
  const lottimeId = lotTime._id;

  // 3. Get the current date and format it as DD-MM-YYYY
  const currentDate = new Date();
  const formattedDate = `${String(currentDate.getDate()).padStart(
    2,
    "0"
  )}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(
    currentDate.getFullYear()
  )}`;

  // 4. Create the LotDate using the formatted date and lottimeId
  const lotDatePayload = {
    lotdate: formattedDate,
    lottime: lottimeId,
  };
  const lotdate = await LotDate.create(lotDatePayload);

  // 5. Retrieve the LotLocation details using the lotlocation ID from the payload
  const location = await LotLocation.findById(req.body.lotlocation);

  if (!location) {
    return next(new ErrorHandler("Lot Location not found", 404));
  }

  // 6. Create the playnumbers array based on location.maximumNumber
  const playnumbers = createPlaynumbersArray(location.maximumNumber);

  // 7. Create the Playzone with lotlocation, lottime, lotdate, and playnumbers
  const playzoneData = {
    lotlocation: location._id,
    lottime: lotTime._id,
    lotdate: lotdate._id,
    playnumbers,
  };
  const newPlayzone = await Playzone.create(playzoneData);

  // Check if a PartnerPerformance already exists for the given lotlocation, lottime, and lotdate
  let partnerPerformance = await PartnerPerformance.findOne({
    lotlocation: location._id,
    lottime: lotTime._id,
    lotdate: lotdate._id,
  });

  if (!partnerPerformance) {
    partnerPerformance = new PartnerPerformance({
      lotlocation: location._id,
      lottime: lotTime._id,
      lotdate: lotdate._id,
      performances: [], // Initially empty
    });
    await partnerPerformance.save();
  }

  // 8. Respond with success
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

// const getAllLotTimeAccordindLocation = asyncError(async (req, res, next) => {
//   const { locationid } = req.query;

//   // let lottimes = await LotTime.find({}).populate("lotlocation").sort({ createdAt: -1 });

//   let lottimes = await LotTime.find({}).populate("lotlocation");

//   if (locationid) {
//     // Filter lottimes array based on locationid
//     lottimes = lottimes.filter(
//       (item) => item.lotlocation._id.toString() === locationid
//     );
//   }

//   res.status(200).json({
//     success: true,
//     lottimes,
//   });
// });

const getAllLotTimeAccordindLocation = asyncError(async (req, res, next) => {
  const { locationid } = req.query;

  // Sort by _id to get the newest documents last
  let lottimes = await LotTime.find({})
    .populate("lotlocation")
    .sort({ createdAt: 1 });

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

const deleteLotTime = asyncError(async (req, res, next) => {
  // 1. Find the LotTime by its ID
  const lottime = await LotTime.findById(req.params.id);

  if (!lottime) return next(new ErrorHandler("Time not found", 404));

  // 2. Find all associated LotDate entries
  const lotdates = await LotDate.find({ lottime: lottime._id });

  // 3. Loop through each LotDate and remove associated Playzone entries
  for (let index = 0; index < lotdates.length; index++) {
    const lotdate = lotdates[index];

    // Find and delete Playzones linked to the current LotDate and LotTime
    await Playzone.deleteMany({ lotdate: lotdate._id, lottime: lottime._id });

    // Remove the LotTime reference from the LotDate (optional: delete the LotDate entirely if you prefer)
    await lotdate.deleteOne();
  }

  // 4. Delete the LotTime itself
  await lottime.deleteOne();

  // 5. Respond with success
  res.status(200).json({
    success: true,
    message: "Time deleted successfully",
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

const updateLiveResultAndTimerForTime = asyncError(async (req, res, next) => {
  const { liveresultlink, liveresulttimer } = req.body;

  if (!liveresultlink) {
    return next(new ErrorHandler("Please add live result link", 404));
  }

  const ltime = await LotTime.findById(req.params.id);

  if (!ltime) return next(new ErrorHandler("Time not found", 404));

  if (liveresultlink) ltime.liveresultlink = liveresultlink;
  if (liveresulttimer) ltime.liveresulttimer = liveresulttimer;

  await ltime.save();

  res.status(200).json({
    success: true,
    message: "Time Updated Successfully",
  });
});
const updateLiveResultAndTimerForTimeForPowerball = asyncError(
  async (req, res, next) => {
    const { liveresultlink, liveresulttimer } = req.body;

    if (!liveresultlink) {
      return next(new ErrorHandler("Please add live result link", 404));
    }

    const ltime = await PowerTime.findById(req.params.id);

    if (!ltime) return next(new ErrorHandler("Time not found", 404));

    if (liveresultlink) ltime.liveresultlink = liveresultlink;
    if (liveresulttimer) ltime.liveresulttimer = liveresulttimer;

    await ltime.save();

    res.status(200).json({
      success: true,
      message: "Time Updated Successfully",
    });
  }
);

// ####################
// LOT LOCATION
// ####################

// const addLotLocatin = asyncError(async (req, res, next) => {
//   const { lotlocation, maximumRange, maximumNumber, maximumReturn } = req.body;

//   if (!lotlocation)
//     return next(new ErrorHandler("enter lotlocation missing", 404));
//   if (!maximumRange) return next(new ErrorHandler("enter maximum range", 404));
//   if (!maximumNumber)
//     return next(new ErrorHandler("enter maximum number", 404));
//   if (!maximumReturn)
//     return next(new ErrorHandler("enter maximum return", 404));

//   await LotLocation.create(req.body);

//   res.status(201).json({
//     success: true,
//     message: "Location Added Successfully",
//   });
// });

const addLotLocatin = asyncError(async (req, res, next) => {
  const {
    lotlocation,
    maximumRange,
    maximumNumber,
    maximumReturn,
    bettinglimit,
  } = req.body;

  if (!lotlocation)
    return next(new ErrorHandler("enter lotlocation missing", 404));
  if (!maximumRange) return next(new ErrorHandler("enter maximum range", 404));
  if (!maximumNumber)
    return next(new ErrorHandler("enter maximum number", 404));
  if (!maximumReturn)
    return next(new ErrorHandler("enter maximum return", 404));
  if (!bettinglimit) return next(new ErrorHandler("enter betting limit", 404));

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

// const updateLocation = asyncError(async (req, res, next) => {
//   const {
//     lotlocation,
//     locationTitle,
//     locationDescription,
//     maximumNumber,
//     maximumRange,
//     maximumReturn,
//     automation,
//   } = req.body;

//   console.log("Request body:", req.body); // Log the request body to check incoming data

//   const llocation = await LotLocation.findById(req.params.id);

//   if (!llocation) return next(new ErrorHandler("Location not found", 404));

//   if (maximumReturn !== undefined) llocation.maximumReturn = maximumReturn;
//   if (lotlocation !== undefined) llocation.lotlocation = lotlocation;
//   if (locationTitle !== undefined) llocation.locationTitle = locationTitle;
//   if (locationDescription !== undefined)
//     llocation.locationDescription = locationDescription;
//   if (maximumRange !== undefined) llocation.maximumRange = maximumRange;
//   if (maximumNumber !== undefined) llocation.maximumNumber = maximumNumber;

//   // Update automation and automationUpdatedAt if automation is changed
//   if (automation !== undefined) {
//     llocation.automation = automation;
//     llocation.automationUpdatedAt = Date.now(); // Update automationUpdatedAt to the current time
//   }

//   await llocation.save();

//   res.status(200).json({
//     success: true,
//     message: "Location Updated Successfully",
//   });
// });

const updateLocation = asyncError(async (req, res, next) => {
  const {
    lotlocation,
    locationTitle,
    locationDescription,
    maximumNumber,
    maximumRange,
    maximumReturn,
    automation,
    bettinglimit,
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
  if (bettinglimit !== undefined) llocation.bettinglimit = bettinglimit;

  // Update automation and automationUpdatedAt if automation is changed
  if (automation !== undefined) {
    llocation.automation = automation;
    llocation.automationUpdatedAt = Date.now(); // Update automationUpdatedAt to the current time
  }

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
    .sort({ createdAt: 1 });

  // Combine data
  const locationData = lotlocations.map((location) => {
    const timesForLocation = lottimes
      .filter(
        (time) => time.lotlocation._id.toString() === location._id.toString()
      )
      .map((time) => ({
        _id: time._id,
        time: time.lottime, // Include any other fields you need from LotTime
        liveresultlink: time.liveresultlink,
        liveresulttimer: time.liveresulttimer,
        createdAt: time.createdAt,
      }));

    return {
      _id: location._id,
      name: location.lotlocation,
      limit: location.maximumRange,
      maximumNumber: location.maximumNumber,
      maximumReturn: location.maximumReturn,
      bettinglimit: location.bettinglimit,
      automation: location.automation,
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

// [####################]
// [### OTHER PAYMENT ####]

// const addOtherPayment = asyncError(async (req, res, next) => {
//   const { firstInput, secondInput, thirdInput, paymentnote, userId } = req.body;

//   // Create the document with only the provided fields
//   const newotherPayment = await OtherPayment.create({
//     ...(req.file && { qrcode: req.file.filename }), // Add qrcode only if file exists
//     ...(firstInput && { firstInput }), // Add firstinput only if provided
//     ...(secondInput && { secondInput }), // Add secondInput only if provided
//     ...(thirdInput && { thirdInput }), // Add thirdInput only if provided
//     paymentnote,
//   });

//   if (userId) {
//     // Fetch the PartnerModule by userId
//     const partner = await PartnerModule.findOne({ userId }).populate(
//       "rechargeModule"
//     );

//     if (!partner) {
//       return next(new ErrorHandler("Partner not found", 404));
//     }

//     if (!partner.rechargeModule) {
//       return next(new ErrorHandler("Recharge Module not found", 404));
//     }

//     // Push the new bank ID into the rechargeModule's otherList array
//     partner.rechargeModule.otherList.push(newotherPayment._id);
//     await partner.rechargeModule.save();
//   }

//   res.status(201).json({
//     success: true,
//     message: "Payment Added Successfully",
//   });
// });

const addOtherPayment = asyncError(async (req, res, next) => {
  const {
    paymentName,
    firstInput,
    secondInput,
    thirdInput,
    firstInputName,
    secondInputName,
    thirdInputName,
    qrcodeName,
    paymentnote,
    userId,
    activationStatus,
    paymentStatus,
  } = req.body;

  if (!paymentName) {
    return next(new ErrorHandler("Payment name is missing", 404));
  }

  // Determine activationStatus based on userId presence
  const shouldActivate = !userId;
  const finalActivationStatus = shouldActivate
    ? true
    : activationStatus !== undefined
    ? activationStatus
    : false;

  // Create the document with only the provided fields
  // const newotherPayment = await OtherPayment.create({
  //   paymentName,
  //   ...(req.file && { qrcode: req.file.filename }),
  //   ...(firstInput && { firstInput }),
  //   ...(secondInput && { secondInput }),
  //   ...(thirdInput && { thirdInput }),
  //   ...(firstInputName && { firstInputName }),
  //   ...(secondInputName && { secondInputName }),
  //   ...(thirdInputName && { thirdInputName }),
  //   ...(qrcodeName && { qrcodeName }),
  //   ...(paymentnote && { paymentnote }),
  //   ...(userId && { userId }),
  //   activationStatus: finalActivationStatus, // Set based on our logic above
  //   paymentStatus: userId ? "Pending" : "Approved",
  //   ...(paymentStatus && { paymentStatus }),
  // });

  // Create the document with only the provided fields
  const newotherPayment = await OtherPayment.create({
    paymentName,
    ...(req.file && { qrcode: req.file.filename }),
    ...(firstInput && { firstInput }),
    ...(secondInput && { secondInput }),
    ...(thirdInput && { thirdInput }),
    ...(firstInputName && { firstInputName }),
    ...(secondInputName && { secondInputName }),
    ...(thirdInputName && { thirdInputName }),
    ...(qrcodeName && { qrcodeName }),
    ...(paymentnote && { paymentnote }),
    ...(userId && { userId }),
    activationStatus: finalActivationStatus, // Set based on our logic above
    paymentStatus: userId ? "Pending" : "Approved",
  });

  if (userId) {
    // Fetch the PartnerModule by userId
    const partner = await PartnerModule.findOne({ userId }).populate(
      "rechargeModule"
    );

    if (!partner) {
      return next(new ErrorHandler("Partner not found", 404));
    }

    if (!partner.rechargeModule) {
      return next(new ErrorHandler("Recharge Module not found", 404));
    }

    // Push the new bank ID into the rechargeModule's otherList array
    partner.rechargeModule.otherList.push(newotherPayment._id);
    await partner.rechargeModule.save();
  }

  res.status(201).json({
    success: true,
    message: "Payment Added Successfully",
    data: newotherPayment,
  });
});

// const getAllOtherPayments = asyncError(async (req, res, next) => {
//   const payments = await OtherPayment.find();

//   res.status(200).json({
//     success: true,
//     payments,
//   });
// });

const getAllOtherPayments = asyncError(async (req, res, next) => {
  // Parse and validate pagination parameters
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(parseInt(req.query.limit) || 10, 100); // Max 100 items per page
  const skip = (page - 1) * limit;

  // Execute count and find operations in parallel
  const [totalPayments, payments] = await Promise.all([
    OtherPayment.countDocuments(),
    OtherPayment.find()
      .sort({ createdAt: -1 }) // Newest payments first
      .skip(skip)
      .limit(limit),
  ]);

  res.status(200).json({
    success: true,
    payments,
    pagination: {
      total: totalPayments,
      pages: Math.ceil(totalPayments / limit),
      current: page,
      limit,
    },
  });
});

const getOtherPaymentsByUserId = asyncError(async (req, res, next) => {
  // Parse and validate pagination parameters
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(parseInt(req.query.limit) || 10, 100); // Max 100 items per page
  const skip = (page - 1) * limit;

  // Get userId from request params
  const userId = parseInt(req.params.userId);
  if (!userId) {
    return next(new ErrorHandler("User ID is required", 400));
  }

  // Create query filter
  const filter = { userId };

  // Execute count and find operations in parallel for optimal performance
  const [totalPayments, payments] = await Promise.all([
    OtherPayment.countDocuments(filter),
    OtherPayment.find(filter)
      .sort({ createdAt: -1 }) // Newest payments first
      .skip(skip)
      .limit(limit),
  ]);

  res.status(200).json({
    success: true,
    payments,
    pagination: {
      total: totalPayments,
      pages: Math.ceil(totalPayments / limit),
      current: page,
      limit,
    },
  });
});

const deleteOtherPayment = asyncError(async (req, res, next) => {
  const { id } = req.params;

  const payment = await OtherPayment.findByIdAndDelete(id);

  if (!payment) {
    return next(new ErrorHandler("Other Payment not found", 404));
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
  const { upiholdername, upiid, paymentnote, userId } = req.body;

  if (!upiholdername)
    return next(new ErrorHandler("UPI holder name is missing", 404));
  if (!upiid) return next(new ErrorHandler("UPI ID is missing", 404));

  if (!req.file) return next(new ErrorHandler("UPI QR Code is missing", 404));

  const newUpi = await UpiPaymentType.create({
    upiholdername,
    upiid,
    qrcode: req.file ? req.file.filename : undefined,
    paymentnote,
    userId: userId ? userId : 1000,
    activationStatus: userId ? false : true,
    paymentStatus: userId ? "Pending" : "Approved",
  });

  if (userId) {
    // Fetch the PartnerModule by userId
    const partner = await PartnerModule.findOne({ userId }).populate(
      "rechargeModule"
    );

    if (!partner) {
      return next(new ErrorHandler("Partner not found", 404));
    }

    if (!partner.rechargeModule) {
      return next(new ErrorHandler("Recharge Module not found", 404));
    }

    // Push the new bank ID into the rechargeModule's upiList array
    partner.rechargeModule.upiList.push(newUpi._id);
    await partner.rechargeModule.save();
  }

  res.status(201).json({
    success: true,
    message: "UPI Added Successfully",
  });
});

// const getAllUPIPayments = asyncError(async (req, res, next) => {
//   const payments = await UpiPaymentType.find();

//   res.status(200).json({
//     success: true,
//     payments,
//   });
// });

const getAllPendingPaymentsCount = asyncError(async (req, res, next) => {
  // Fetch count of pending payments from all payment models in parallel
  const [
    upiPending,
    cryptoPending,
    paypalPending,
    skrillPending,
    bankPending,
    otherPending,
  ] = await Promise.all([
    UpiPaymentType.countDocuments({ paymentStatus: "Pending" }),
    CryptoPaymentType.countDocuments({ paymentStatus: "Pending" }),
    PaypalPaymentType.countDocuments({ paymentStatus: "Pending" }),
    SkrillPaymentType.countDocuments({ paymentStatus: "Pending" }),
    BankPaymentType.countDocuments({ paymentStatus: "Pending" }),
    OtherPayment.countDocuments({ paymentStatus: "Pending" }),
  ]);

  res.status(200).json({
    success: true,
    breakdown: {
      upiPending,
      cryptoPending,
      paypalPending,
      skrillPending,
      bankPending,
      otherPending,
    },
  });
});

const getAllUPIPayments = asyncError(async (req, res, next) => {
  // Parse and validate pagination parameters
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(parseInt(req.query.limit) || 10, 100); // Max 100 items per page
  const skip = (page - 1) * limit;

  // Get total count and payments in parallel for better performance
  const [totalPayments, payments] = await Promise.all([
    UpiPaymentType.countDocuments(),
    UpiPaymentType.find()
      .sort({ createdAt: -1 }) // Newest first
      .skip(skip)
      .limit(limit),
  ]);

  res.status(200).json({
    success: true,
    payments,
    pagination: {
      total: totalPayments,
      pages: Math.ceil(totalPayments / limit),
      current: page,
      limit,
    },
  });
});

const getUPIPaymentsByUserId = asyncError(async (req, res, next) => {
  // Parse and validate pagination parameters
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(parseInt(req.query.limit) || 10, 100); // Max 100 items per page
  const skip = (page - 1) * limit;

  // Get userId from request params
  const userId = parseInt(req.params.userId);
  if (!userId) {
    return next(new ErrorHandler("User ID is required", 400));
  }

  // Create query filter
  const filter = { userId };

  // Get total count and payments in parallel for better performance
  const [totalPayments, payments] = await Promise.all([
    UpiPaymentType.countDocuments(filter),
    UpiPaymentType.find(filter)
      .sort({ createdAt: -1 }) // Newest first
      .skip(skip)
      .limit(limit),
  ]);

  res.status(200).json({
    success: true,
    payments,
    pagination: {
      total: totalPayments,
      pages: Math.ceil(totalPayments / limit),
      current: page,
      limit,
    },
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

// const addBankPayment = asyncError(async (req, res, next) => {
//   const {
//     bankname,
//     accountholdername,
//     ifsccode,
//     accountnumber,
//     swiftcode,
//     paymentnote,
//   } = req.body;

//   if (!bankname) return next(new ErrorHandler("Bank name is missing", 404));
//   if (!accountholdername)
//     return next(new ErrorHandler("Account holder name is missing", 404));
//   if (!ifsccode) return next(new ErrorHandler("IFSC code is missing", 404));
//   if (!accountnumber)
//     return next(new ErrorHandler("Account number is missing", 404));
//   //   if (!swiftcode) return next(new ErrorHandler("Swift code is missing", 404));

//   await BankPaymentType.create(req.body);

//   res.status(201).json({
//     success: true,
//     message: "Bank Added Successfully",
//   });
// });

const addBankPayment = asyncError(async (req, res, next) => {
  const {
    userId,
    bankname,
    accountholdername,
    ifsccode,
    accountnumber,
    swiftcode,
    paymentnote,
    activationStatus, // Added this to handle if it comes in req.body
  } = req.body;

  // Validations
  if (!bankname) return next(new ErrorHandler("Bank name is missing", 400));
  if (!accountholdername)
    return next(new ErrorHandler("Account holder name is missing", 400));
  if (!ifsccode) return next(new ErrorHandler("IFSC code is missing", 400));
  if (!accountnumber)
    return next(new ErrorHandler("Account number is missing", 400));

  // Determine activationStatus based on userId presence
  const finalActivationStatus = userId ? false : true;

  // Create a new BankPaymentType with modified activationStatus
  const newBank = await BankPaymentType.create({
    ...req.body,
    activationStatus: finalActivationStatus, // Override with our logic
    paymentStatus: userId ? "Pending" : "Approved",
  });

  if (userId) {
    // Fetch the PartnerModule by userId
    const partner = await PartnerModule.findOne({ userId }).populate(
      "rechargeModule"
    );

    if (!partner) {
      return next(new ErrorHandler("Partner not found", 404));
    }

    if (!partner.rechargeModule) {
      return next(new ErrorHandler("Recharge Module not found", 404));
    }

    // Push the new bank ID into the rechargeModule's bankList array
    partner.rechargeModule.bankList.push(newBank._id);
    await partner.rechargeModule.save();
  }

  res.status(201).json({
    success: true,
    message: "Bank Added Successfully",
    bank: newBank,
  });
});

// const getAllBankPayments = asyncError(async (req, res, next) => {
//   const payments = await BankPaymentType.find();

//   res.status(200).json({
//     success: true,
//     payments,
//   });
// });
const getAllBankPayments = asyncError(async (req, res, next) => {
  // Parse and validate pagination parameters
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(parseInt(req.query.limit) || 10, 100); // Max 100 items per page
  const skip = (page - 1) * limit;

  // Get total count and payments in parallel
  const [totalPayments, payments] = await Promise.all([
    BankPaymentType.countDocuments(),
    BankPaymentType.find()
      .sort({ createdAt: -1 }) // Newest first
      .skip(skip)
      .limit(limit),
  ]);

  res.status(200).json({
    success: true,
    payments,
    pagination: {
      total: totalPayments,
      pages: Math.ceil(totalPayments / limit),
      current: page,
      limit,
    },
  });
});

const getBankPaymentsByUserId = asyncError(async (req, res, next) => {
  // Parse and validate pagination parameters
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(parseInt(req.query.limit) || 10, 100); // Max 100 items per page
  const skip = (page - 1) * limit;

  // Get userId from request params
  const userId = parseInt(req.params.userId);
  if (!userId) {
    return next(new ErrorHandler("User ID is required", 400));
  }

  // Create query filter
  const filter = { userId };

  // Get total count and payments in parallel for better performance
  const [totalPayments, payments] = await Promise.all([
    BankPaymentType.countDocuments(filter),
    BankPaymentType.find(filter)
      .sort({ createdAt: -1 }) // Newest first
      .skip(skip)
      .limit(limit),
  ]);

  res.status(200).json({
    success: true,
    payments,
    pagination: {
      total: totalPayments,
      pages: Math.ceil(totalPayments / limit),
      current: page,
      limit,
    },
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
  const { emailaddress, paymentnote, userId } = req.body;

  if (!emailaddress) {
    return next(new ErrorHandler("Email address is missing", 400));
  }

  // Determine activationStatus based on userId presence
  const activationStatus = userId ? false : true;

  // Create a new PaypalPayment with proper activationStatus
  const newpaypal = await PaypalPaymentType.create({
    ...req.body,
    activationStatus, // Override with our logic
    paymentStatus: userId ? "Pending" : "Approved",
  });

  if (userId) {
    // Fetch the PartnerModule by userId
    const partner = await PartnerModule.findOne({ userId }).populate(
      "rechargeModule"
    );

    if (!partner) {
      return next(new ErrorHandler("Partner not found", 404));
    }

    if (!partner.rechargeModule) {
      return next(new ErrorHandler("Recharge Module not found", 404));
    }

    // Push the new paypal ID into the rechargeModule's paypalList array
    partner.rechargeModule.paypalList.push(newpaypal._id);
    await partner.rechargeModule.save();
  }

  res.status(201).json({
    success: true,
    message: "Paypal Added Successfully",
    data: newpaypal, // Include the created document in response
  });
});

// const getAllPaypalPayments = asyncError(async (req, res, next) => {
//   const payments = await PaypalPaymentType.find().sort({ createdAt: -1 });

//   res.status(200).json({
//     success: true,
//     payments,
//   });
// });

const getAllPaypalPayments = asyncError(async (req, res, next) => {
  // Parse and validate pagination parameters
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(parseInt(req.query.limit) || 10, 100); // Max 100 items per page
  const skip = (page - 1) * limit;

  // Get total count and payments in parallel
  const [totalPayments, payments] = await Promise.all([
    PaypalPaymentType.countDocuments(),
    PaypalPaymentType.find()
      .sort({ createdAt: -1 }) // Newest first (keeping your existing sort)
      .skip(skip)
      .limit(limit),
  ]);

  res.status(200).json({
    success: true,
    payments,
    pagination: {
      total: totalPayments,
      pages: Math.ceil(totalPayments / limit),
      current: page,
      limit,
    },
  });
});
const getPaypalPaymentsByUserId = asyncError(async (req, res, next) => {
  // Parse and validate pagination parameters
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(parseInt(req.query.limit) || 10, 100); // Max 100 items per page
  const skip = (page - 1) * limit;

  // Get userId from request params
  const userId = parseInt(req.params.userId);
  if (!userId) {
    return next(new ErrorHandler("User ID is required", 400));
  }

  // Create query filter
  const filter = { userId };

  // Get total count and payments in parallel for better performance
  const [totalPayments, payments] = await Promise.all([
    PaypalPaymentType.countDocuments(filter),
    PaypalPaymentType.find(filter)
      .sort({ createdAt: -1 }) // Newest first
      .skip(skip)
      .limit(limit),
  ]);

  res.status(200).json({
    success: true,
    payments,
    pagination: {
      total: totalPayments,
      pages: Math.ceil(totalPayments / limit),
      current: page,
      limit,
    },
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
  const { walletaddress, networktype, paymentnote, userId } = req.body;

  // Validations
  if (!walletaddress) {
    return next(new ErrorHandler("Wallet address is missing", 400)); // Changed to 400 (Bad Request)
  }
  if (!networktype) {
    return next(new ErrorHandler("Network type is missing", 400)); // Changed to 400 (Bad Request)
  }
  if (!req.file) {
    return next(new ErrorHandler("Crypto QR Code is missing", 400)); // Changed message and status code
  }

  // Determine activationStatus based on userId presence
  const activationStatus = userId ? false : true;

  // Create new crypto payment
  const newCrypto = await CryptoPaymentType.create({
    walletaddress,
    networktype,
    qrcode: req.file.filename, // Simplified since we already validated req.file exists
    paymentnote,
    userId: userId ? userId : 1000, // Keep your default userId logic
    activationStatus, // Add our activation logic
    paymentStatus: userId ? "Pending" : "Approved",
  });

  if (userId) {
    // Fetch the PartnerModule by userId
    const partner = await PartnerModule.findOne({ userId }).populate(
      "rechargeModule"
    );

    if (!partner) {
      return next(new ErrorHandler("Partner not found", 404));
    }

    if (!partner.rechargeModule) {
      return next(new ErrorHandler("Recharge Module not found", 404));
    }

    // Push the new crypto ID into the rechargeModule's cryptoList array
    partner.rechargeModule.cryptoList.push(newCrypto._id);
    await partner.rechargeModule.save();
  }

  res.status(201).json({
    success: true,
    message: "Crypto Payment Added Successfully",
    data: newCrypto, // Include the created document in response
  });
});

// const getAllCryptoPayments = asyncError(async (req, res, next) => {
//   const payments = await CryptoPaymentType.find();

//   res.status(200).json({
//     success: true,
//     payments,
//   });
// });

const getAllCryptoPayments = asyncError(async (req, res, next) => {
  // Parse and validate pagination parameters
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(parseInt(req.query.limit) || 10, 100); // Max 100 items per page
  const skip = (page - 1) * limit;

  // Get total count and payments in parallel for optimal performance
  const [totalPayments, payments] = await Promise.all([
    CryptoPaymentType.countDocuments(),
    CryptoPaymentType.find()
      .sort({ createdAt: -1 }) // Newest records first
      .skip(skip)
      .limit(limit),
  ]);

  res.status(200).json({
    success: true,
    payments,
    pagination: {
      total: totalPayments,
      pages: Math.ceil(totalPayments / limit),
      current: page,
      limit,
    },
  });
});

const getCryptoPaymentsByUserId = asyncError(async (req, res, next) => {
  // Parse and validate pagination parameters
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(parseInt(req.query.limit) || 10, 100); // Max 100 items per page
  const skip = (page - 1) * limit;

  // Get userId from request params
  const userId = parseInt(req.params.userId);
  if (!userId) {
    return next(new ErrorHandler("User ID is required", 400));
  }

  // Create query filter
  const filter = { userId };

  // Get total count and payments in parallel for optimal performance
  const [totalPayments, payments] = await Promise.all([
    CryptoPaymentType.countDocuments(filter),
    CryptoPaymentType.find(filter)
      .sort({ createdAt: -1 }) // Newest records first
      .skip(skip)
      .limit(limit),
  ]);

  res.status(200).json({
    success: true,
    payments,
    pagination: {
      total: totalPayments,
      pages: Math.ceil(totalPayments / limit),
      current: page,
      limit,
    },
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
  const { address, paymentnote, userId } = req.body;

  if (!address) {
    return next(
      new ErrorHandler("Email address or phone number is missing", 400) // Changed to 400 (Bad Request)
    );
  }

  // Determine activationStatus based on userId presence
  const activationStatus = userId ? false : true;

  // Create new Skrill payment with activationStatus
  const newSkrill = await SkrillPaymentType.create({
    ...req.body,
    activationStatus, // Add our activation logic
    paymentStatus: userId ? "Pending" : "Approved",
  });

  if (userId) {
    // Fetch the PartnerModule by userId
    const partner = await PartnerModule.findOne({ userId }).populate(
      "rechargeModule"
    );

    if (!partner) {
      return next(new ErrorHandler("Partner not found", 404));
    }

    if (!partner.rechargeModule) {
      return next(new ErrorHandler("Recharge Module not found", 404));
    }

    // Push the new Skrill ID into the rechargeModule's skrillList array
    partner.rechargeModule.skrillList.push(newSkrill._id);
    await partner.rechargeModule.save();
  }

  res.status(201).json({
    success: true,
    message: "Skrill Payment Added Successfully",
    data: newSkrill, // Include the created document in response
  });
});
// const getAllSkrillPayments = asyncError(async (req, res, next) => {
//   const payments = await SkrillPaymentType.find();

//   res.status(200).json({
//     success: true,
//     payments,
//   });
// });

const getAllSkrillPayments = asyncError(async (req, res, next) => {
  // Parse and validate pagination parameters
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(parseInt(req.query.limit) || 10, 100); // Max 100 items per page
  const skip = (page - 1) * limit;

  // Execute count and find operations in parallel
  const [totalPayments, payments] = await Promise.all([
    SkrillPaymentType.countDocuments(),
    SkrillPaymentType.find()
      .sort({ createdAt: -1 }) // Newest payments first
      .skip(skip)
      .limit(limit),
  ]);

  res.status(200).json({
    success: true,
    payments,
    pagination: {
      total: totalPayments,
      pages: Math.ceil(totalPayments / limit),
      current: page,
      limit,
    },
  });
});
const getSkrillPaymentsByUserId = asyncError(async (req, res, next) => {
  // Parse and validate pagination parameters
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(parseInt(req.query.limit) || 10, 100); // Max 100 items per page
  const skip = (page - 1) * limit;

  // Get userId from request params
  const userId = parseInt(req.params.userId);
  if (!userId) {
    return next(new ErrorHandler("User ID is required", 400));
  }

  // Create query filter
  const filter = { userId };

  // Execute count and find operations in parallel for optimal performance
  const [totalPayments, payments] = await Promise.all([
    SkrillPaymentType.countDocuments(filter),
    SkrillPaymentType.find(filter)
      .sort({ createdAt: -1 }) // Newest payments first
      .skip(skip)
      .limit(limit),
  ]);

  res.status(200).json({
    success: true,
    payments,
    pagination: {
      total: totalPayments,
      pages: Math.ceil(totalPayments / limit),
      current: page,
      limit,
    },
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
    }).populate("playnumbers.users.currency"); // Populate currency in users array within playnumbers

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

// const getSinglePlayzone = asyncError(async (req, res, next) => {
//   const { lotlocation, lottime, lotdate } = req.query;

//   try {
//     // Find the Playzone entry by lotlocation, lottime, and lotdate
//     const playzone = await Playzone.findOne({
//       lotlocation,
//       lottime,
//       lotdate,
//     });

//     if (!playzone) {
//       return res.status(404).json({
//         success: false,
//         message: "Playzone entry not found",
//       });
//     }

//     res.status(200).json({
//       success: true,
//       playzone,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Failed to retrieve Playzone entry",
//       error: error.message,
//     });
//   }
// });

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
// const addPlayzone = asyncError(async (req, res) => {
//   const { lotlocation, lottime, lotdate, playnumbers } = req.body;

//   if (
//     !lotlocation ||
//     !lottime ||
//     !lotdate ||
//     !playnumbers ||
//     !Array.isArray(playnumbers) ||
//     playnumbers.length === 0
//   ) {
//     return res.status(400).json({
//       success: false,
//       message:
//         "All fields are required and playnumbers must be a non-empty array",
//     });
//   }

//   // Validate playnumbers
//   // for (const playnumber of playnumbers) {
//   //   if (!playnumber.playnumber || !playnumber.numbercount || !playnumber.amount || !playnumber.distributiveamount  ) {
//   //     return res.status(400).json({
//   //       success: false,
//   //       message: "Each playnumber must have playnumber, numbercount, amount, distributiveamount and a non-empty users array"
//   //     });
//   //   }

//   //   // for (const user of playnumber.users) {
//   //   //   if (!user.userid || !user.username || !user.amount || !user.numberid) {
//   //   //     return res.status(400).json({
//   //   //       success: false,
//   //   //       message: "Each user must have userid, username, amount and numberid"
//   //   //     });
//   //   //   }
//   //   // }
//   // }

//   // Create a new Playzone document
//   const newPlayzone = new Playzone({
//     lotlocation,
//     lottime,
//     lotdate,
//     playnumbers,
//   });

//   // Save the Playzone document
//   await newPlayzone.save();

//   // Update users' playzoneHistory
//   // for (const playnumber of playnumbers) {
//   //   for (const user of playnumber.users) {
//   //     await User.findByIdAndUpdate(user.userid, {
//   //       $push: {
//   //         playzoneHistory: newPlayzone._id
//   //       }
//   //     });
//   //   }
//   // }

//   res.status(201).json({
//     success: true,
//     message: "Playzone entry added successfully",
//     playzone: newPlayzone,
//   });
// });

// Controller to create Playzone and PartnerPerformance
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

  // Create a new Playzone document
  const newPlayzone = new Playzone({
    lotlocation,
    lottime,
    lotdate,
    playnumbers,
  });
  await newPlayzone.save();

  // Check if a PartnerPerformance already exists for the given lotlocation, lottime, and lotdate
  let partnerPerformance = await PartnerPerformance.findOne({
    lotlocation,
    lottime,
    lotdate,
  });

  if (!partnerPerformance) {
    partnerPerformance = new PartnerPerformance({
      lotlocation,
      lottime,
      lotdate,
      performances: [], // Initially empty
    });
    await partnerPerformance.save();
  }

  res.status(201).json({
    success: true,
    message: "Playzone entry added successfully",
  });
});
// DELETE PLAYZONE
const deletePlayzone = asyncError(async (req, res, next) => {
  const playzone = await Playzone.findById(req.params.id);

  if (!playzone) return next(new ErrorHandler("Playzone not found", 404));

  await playzone.deleteOne();

  res.status(200).json({
    success: true,
    message: "Playzone Deleted Successfully",
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

// const addPlaybet = asyncError(async (req, res, next) => {
//   const { playnumbers, lotdate, lottime, lotlocation } = req.body;
//   const userId = req.user._id; // Assuming user is authenticated and user ID is available in req.user

//   console.log("Username :: " + req.user.name);
//   console.log("UserId :: " + userId);

//   // Calculate the total amount from the playnumbers array
//   const totalAmount = playnumbers.reduce(
//     (sum, playbet) => sum + playbet.amount,
//     0
//   );
//   console.log("Total Amount :: " + totalAmount);

//   // Find the user and update their walletTwo balance
//   const user = await User.findById(userId)
//     .populate("walletOne")
//     .populate("walletTwo")
//     .populate("country"); // Ensure country is populated

//   if (!user) {
//     return res.status(404).json({
//       success: false,
//       message: "User not found",
//     });
//   }

//   if (user.walletTwo.balance < totalAmount) {
//     return res.status(400).json({
//       success: false,
//       message: "Insufficient balance in walletTwo",
//     });
//   }

//   console.log("User details :: " + JSON.stringify(user));

//   const walletId = user.walletTwo._id;

//   console.log("Before User Wallet Two balance :: " + user.walletTwo.balance);
//   console.log("Amount deducted :: " + totalAmount);

//   const totalBalanceAmount = parseFloat(user.walletTwo.balance);

//   console.log("Float User Wallet Two balance :: " + totalBalanceAmount);

//   const remainingWalletBalance = totalBalanceAmount - parseFloat(totalAmount);
//   console.log("Remaining amount after deduction :: " + remainingWalletBalance);

//   // Create a new Playbet document
//   const newPlaybet = new Playbet({
//     playnumbers,
//     username: req.user.name,
//     userid: req.user.userId,
//     lotdate,
//     lottime,
//     lotlocation,
//     currency: user.country._id.toString(),
//   });

//   console.log("New Bet :: " + JSON.stringify(newPlaybet));

//   // Save the Playbet document
//   await newPlaybet.save();
//   console.log("New Bet Created Successfully");

//   // Update user's playbetHistory
//   await User.findByIdAndUpdate(userId, {
//     $push: {
//       playbetHistory: newPlaybet._id,
//     },
//   });

//   console.log("New Bet Added to the User Betting History Successfully");

//   console.log("Now Searching for the Playzone of the Admin to Add user");

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

//   console.log("Going to update the playzone");
//   console.log("Playzone found :: " + JSON.stringify(playzone));
//   console.log("Playnumber Array Users :: " + JSON.stringify(playnumbers));

//   // Update the playnumbers in Playzone
//   for (const playbet of playnumbers) {
//     console.log("Element Playbet :: ", JSON.stringify(playbet));
//     console.log("Searching for the index");
//     const playnumberIndex = playzone.playnumbers.findIndex(
//       (pn) => pn.playnumber === playbet.playnumber
//     );
//     console.log("Playnumber index :: " + playnumberIndex);

//     if (playnumberIndex !== -1) {
//       let userIndex = playzone.playnumbers[playnumberIndex].users.findIndex(
//         (user) => user.userId == req.user.userId
//       );
//       console.log("User index :: " + userIndex);

//       // NOW GETTING THE CALCULATED AMOUNT
//       const currency = await Currency.findById(user.country._id);
//       if (!currency) {
//         return next(new ErrorHandler("Currency not found", 404));
//       }
//       const currencyconverter = parseFloat(
//         currency.countrycurrencyvaluecomparedtoinr
//       );

//       const convertedAmount =
//         parseFloat(playbet.amount) * parseFloat(currencyconverter);
//       console.log("convertedAmount :: " + convertedAmount);

//       if (userIndex !== -1) {
//         // User exists, update amount and winningamount
//         playzone.playnumbers[playnumberIndex].users[userIndex].amount +=
//           playbet.amount;
//         playzone.playnumbers[playnumberIndex].users[userIndex].winningamount +=
//           playbet.winningamount;
//         playzone.playnumbers[playnumberIndex].users[
//           userIndex
//         ].convertedAmount += convertedAmount;
//       } else {
//         // User does not exist, add new user
//         playzone.playnumbers[playnumberIndex].users.push({
//           userId: req.user.userId,
//           username: req.user.name,
//           amount: playbet.amount,
//           convertedAmount: convertedAmount,
//           usernumber: playbet.playnumber,
//           winningamount: playbet.winningamount,
//           currency: user.country._id.toString(),
//         });
//         userIndex = playzone.playnumbers[playnumberIndex].users.length - 1;
//       }

//       // Populate currency for the newly added user
//       await playzone.populate(
//         `playnumbers.${playnumberIndex}.users.${userIndex}.currency`
//       );

//       // Update numbercount and amount
//       playzone.playnumbers[playnumberIndex].numbercount =
//         playzone.playnumbers[playnumberIndex].users.length;

//       // Calculate amount with currency value
//       let totalAmount = 0;
//       for (const user of playzone.playnumbers[playnumberIndex].users) {
//         console.log("Cal User :: " + JSON.stringify(user));
//         const amount = parseFloat(user.amount);
//         const curren = await Currency.findById(user.currency);
//         const currencyValue = parseFloat(
//           curren.countrycurrencyvaluecomparedtoinr
//         );
//         if (isNaN(amount) || isNaN(currencyValue)) {
//           console.error(
//             `Invalid amount or currency value for user: ${JSON.stringify(user)}`
//           );
//           continue;
//         }
//         totalAmount += amount * currencyValue;
//       }

//       playzone.playnumbers[playnumberIndex].amount = totalAmount;

//       // Calculate distributiveamount with currency value
//       let totalDistributiveAmount = 0;
//       for (const user of playzone.playnumbers[playnumberIndex].users) {
//         console.log("Cal User :: " + JSON.stringify(user));
//         const winningAmount = parseFloat(user.winningamount);
//         const curren = await Currency.findById(user.currency);
//         const currencyValue = parseFloat(
//           curren.countrycurrencyvaluecomparedtoinr
//         );
//         if (isNaN(winningAmount) || isNaN(currencyValue)) {
//           console.error(
//             `Invalid winning amount or currency value for user: ${JSON.stringify(
//               user
//             )}`
//           );
//           continue;
//         }
//         totalDistributiveAmount += winningAmount * currencyValue;
//       }

//       playzone.playnumbers[playnumberIndex].distributiveamount =
//         totalDistributiveAmount;

//       console.log(
//         "Updated playnumber :: ",
//         JSON.stringify(playzone.playnumbers[playnumberIndex])
//       );
//     }
//   }

//   // Save the updated Playzone entry
//   await playzone.save();
//   console.log("Playzone Update Successful");

//   // Create AppBalanceSheet entry
//   // Calculate withdrawalbalance as the total sum of all walletOne balances
//   // const walletOneBalances = await WalletOne.find({});
//   // const withdrawalBalance = walletOneBalances.reduce(
//   //   (sum, wallet) => sum + wallet.balance,
//   //   0
//   // );

//   // // Calculate gamebalance as the total sum of all walletTwo balances minus totalAmount
//   // const walletTwoBalances = await WalletTwo.find({});
//   // const gameBalance =
//   //   walletTwoBalances.reduce((sum, wallet) => sum + wallet.balance, 0) -
//   //   totalAmount;

//   // // Calculate totalbalance as the total sum of walletOne and walletTwo balances minus totalAmount
//   // const totalBalance = withdrawalBalance + gameBalance;

//   const currencyap = await Currency.findById(user.country._id);
//   if (!currencyap) {
//     return next(new ErrorHandler("Currency not found", 404));
//   }

//   const currencyconverter = parseFloat(
//     currencyap.countrycurrencyvaluecomparedtoinr
//   );

//   // Fetch all WalletTwo balances and populate currencyId
//   const walletTwoBalances = await WalletTwo.find({}).populate("currencyId");
//   let gameBalance = 0;

//   walletTwoBalances.forEach((wallet) => {
//     const walletCurrencyConverter = parseFloat(
//       wallet.currencyId.countrycurrencyvaluecomparedtoinr
//     );
//     gameBalance += wallet.balance * walletCurrencyConverter;
//   });

//   // Fetch all WalletOne balances and populate currencyId
//   const walletOneBalances = await WalletOne.find({}).populate("currencyId");
//   let withdrawalBalance = 0;

//   walletOneBalances.forEach((wallet) => {
//     const walletCurrencyConverter = parseFloat(
//       wallet.currencyId.countrycurrencyvaluecomparedtoinr
//     );
//     withdrawalBalance += wallet.balance * walletCurrencyConverter;
//   });

//   // Add the additional amount with currency conversion
//   gameBalance -= parseFloat(totalAmount * currencyconverter);

//   // Calculate total balance as the sum of walletOne and walletTwo balances
//   const totalBalance = withdrawalBalance + gameBalance;

//   // Create a new AppBalanceSheet document
//   const appBalanceSheet = new AppBalanceSheet({
//     amount: parseFloat(totalAmount * currencyconverter),
//     withdrawalbalance: withdrawalBalance,
//     gamebalance: gameBalance,
//     totalbalance: totalBalance,
//     usercurrency: user.country._id.toString(),
//     activityType: "Bet",
//     userId: user.userId,
//     paybetId: newPlaybet._id,
//     paymentProcessType: "Debit",
//   });

//   // Save the AppBalanceSheet document
//   await appBalanceSheet.save();
//   console.log("AppBalanceSheet Created Successfully");

//   const updatedWallet = await WalletTwo.findByIdAndUpdate(
//     walletId,
//     { balance: remainingWalletBalance },
//     { new: true }
//   );

//   console.log("User's walletTwo updated successfully :: " + updatedWallet);

//   //  FOR PARTNER PERFORMANCE

//   // Step 2: Get user details using req.user.userId
//   const { parentPartnerId } = user;
//   if (!parentPartnerId) {
//     return res.status(400).json({ message: "User has no parent partner" });
//   }

//   if (parentPartnerId !== 1000) {
//     // Step 1: Get partner performance based on lotlocation, lottime, and lotdate
//     let partnerPerformance = await PartnerPerformance.findOne({
//       lotlocation,
//       lottime,
//       lotdate,
//     });

//     if (!partnerPerformance) {
//       return res.status(404).json({ message: "Partner performance not found" });
//     }

//     // Step 3: Get parent details from ParentModule
//     const parent = await PartnerModule.findOne({ userId: parentPartnerId });
//     if (!parent) {
//       return res.status(404).json({ message: "Parent partner not found" });
//     }

//     // Step 4: Ensure performance array exists
//     // if (!partnerPerformance.performances) {
//     //   partnerPerformance.performances = [];
//     // }

//     // Check if parentPartnerId is in performance array
//     let partnerData = partnerPerformance.performances.find(
//       (p) => p.partnerId.toString() === parentPartnerId.toString()
//     );

//     if (!partnerData) {
//       // If not found, create an object
//       partnerData = {
//         partnerId: parentPartnerId,
//         name: parent.name,
//         profitPercentage: parent.profitPercentage || 0,
//         rechargePercentage: parent.rechargePercentage || 0,
//         users: [],
//       };

//       const currentuserId = req.user.userId;
//       const currentnewAmount = parseFloat(totalAmount);
//       const currentnewConvertedAmount = parseFloat(
//         totalAmount * currencyconverter
//       );

//       partnerData.users.push({
//         userId: currentuserId,
//         username: req.user.name,
//         amount: currentnewAmount,
//         convertedAmount: currentnewConvertedAmount,
//         currency: user.country._id.toString(),
//       });

//       // Push the new partner data into the performance array
//       partnerPerformance.performances.push(partnerData);
//     } else {
//       const currentuserId = req.user.userId;
//       const currentnewAmount = parseFloat(totalAmount);
//       const currentnewConvertedAmount = parseFloat(
//         totalAmount * currencyconverter
//       );

//       // Check if the user already exists in partnerData.users
//       const existingUser = partnerData.users.find(
//         (user) => user.userId.toString() === currentuserId.toString()
//       );

//       if (existingUser) {
//         // Update the existing user's amount and convertedAmount
//         existingUser.amount += currentnewAmount;
//         existingUser.convertedAmount += currentnewConvertedAmount;
//       } else {
//         // Push new user data if not found
//         partnerData.users.push({
//           userId: currentuserId,
//           username: req.user.name,
//           amount: currentnewAmount,
//           convertedAmount: currentnewConvertedAmount,
//           currency: user.country._id.toString(),
//         });
//       }
//     }

//     // Step 5: Push user data into the users array

//     // const currentuserId = req.user.userId;
//     // const currentnewAmount = parseFloat(totalAmount);
//     // const currentnewConvertedAmount = parseFloat(totalAmount * currencyconverter);

//     // // Check if the user already exists in partnerData.users
//     // const existingUser = partnerData.users.find(
//     //   (user) => user.userId.toString() === currentuserId.toString()
//     // );

//     // if (existingUser) {
//     //   // Update the existing user's amount and convertedAmount
//     //   existingUser.amount += currentnewAmount;
//     //   existingUser.convertedAmount += currentnewConvertedAmount;
//     // } else {
//     //   // Push new user data if not found
//     //   partnerData.users.push({
//     //     userId: currentuserId,
//     //     username: req.user.name,
//     //     amount: currentnewAmount,
//     //     convertedAmount: currentnewConvertedAmount,
//     //     currency: user.country._id.toString(),
//     //   });
//     // }

//     // partnerData.users.push({
//     //   userId: req.user.userId,
//     //   username: req.user.name,
//     //   amount: parseFloat(totalAmount * currencyconverter),
//     //   convertedAmount: parseFloat(totalAmount * currencyconverter),
//     //   currency: user.country._id.toString(),
//     // });

//     // partnerPerformance.performances.push(partnerData);

//     // Save the updated partner performance data
//     await partnerPerformance.save();
//   }

//   res.status(201).json({
//     success: true,
//     message: "Playbet entry added successfully",
//   });
// });

const addPlaybet = asyncError(async (req, res, next) => {
  const { playnumbers, lotdate, lottime, lotlocation } = req.body;
  const userId = req.user._id; // Assuming user is authenticated and user ID is available in req.user

  console.log("Username :: " + req.user.name);
  console.log("UserId :: " + userId);

  // Calculate the total amount from the playnumbers array
  const totalAmount = playnumbers.reduce(
    (sum, playbet) => sum + playbet.amount,
    0
  );
  console.log("Total Amount :: " + totalAmount);

  // Find the user and update their walletTwo balance
  const user = await User.findById(userId)
    .populate("walletOne")
    .populate("walletTwo")
    .populate("country"); // Ensure country is populated

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

  console.log("User details :: " + JSON.stringify(user));

  const walletId = user.walletTwo._id;

  console.log("Before User Wallet Two balance :: " + user.walletTwo.balance);
  console.log("Amount deducted :: " + totalAmount);

  const totalBalanceAmount = parseFloat(user.walletTwo.balance);

  console.log("Float User Wallet Two balance :: " + totalBalanceAmount);

  const remainingWalletBalance = totalBalanceAmount - parseFloat(totalAmount);
  console.log("Remaining amount after deduction :: " + remainingWalletBalance);

  // Create a new Playbet document
  const newPlaybet = new Playbet({
    playnumbers,
    username: req.user.name,
    userid: req.user.userId,
    lotdate,
    lottime,
    lotlocation,
    currency: user.country._id.toString(),
    gameType: "playarena",
  });

  console.log("New Bet :: " + JSON.stringify(newPlaybet));

  // Save the Playbet document
  await newPlaybet.save();
  console.log("New Bet Created Successfully");

  // Update user's playbetHistory
  await User.findByIdAndUpdate(userId, {
    $push: {
      playbetHistory: newPlaybet._id,
    },
  });

  console.log("New Bet Added to the User Betting History Successfully");

  console.log("Now Searching for the Playzone of the Admin to Add user");

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

  console.log("Going to update the playzone");
  console.log("Playzone found :: " + JSON.stringify(playzone));
  console.log("Playnumber Array Users :: " + JSON.stringify(playnumbers));

  // Update the playnumbers in Playzone
  for (const playbet of playnumbers) {
    console.log("Element Playbet :: ", JSON.stringify(playbet));
    console.log("Searching for the index");
    const playnumberIndex = playzone.playnumbers.findIndex(
      (pn) => pn.playnumber === playbet.playnumber
    );
    console.log("Playnumber index :: " + playnumberIndex);

    if (playnumberIndex !== -1) {
      let userIndex = playzone.playnumbers[playnumberIndex].users.findIndex(
        (user) => user.userId == req.user.userId
      );
      console.log("User index :: " + userIndex);

      // NOW GETTING THE CALCULATED AMOUNT
      const currency = await Currency.findById(user.country._id);
      if (!currency) {
        return next(new ErrorHandler("Currency not found", 404));
      }
      const currencyconverter = parseFloat(
        currency.countrycurrencyvaluecomparedtoinr
      );

      const convertedAmount =
        parseFloat(playbet.amount) * parseFloat(currencyconverter);
      console.log("convertedAmount :: " + convertedAmount);

      if (userIndex !== -1) {
        // User exists, update amount and winningamount
        playzone.playnumbers[playnumberIndex].users[userIndex].amount +=
          playbet.amount;
        playzone.playnumbers[playnumberIndex].users[userIndex].winningamount +=
          playbet.winningamount;
        playzone.playnumbers[playnumberIndex].users[
          userIndex
        ].convertedAmount += convertedAmount;
      } else {
        // User does not exist, add new user
        playzone.playnumbers[playnumberIndex].users.push({
          userId: req.user.userId,
          username: req.user.name,
          amount: playbet.amount,
          convertedAmount: convertedAmount,
          usernumber: playbet.playnumber,
          winningamount: playbet.winningamount,
          currency: user.country._id.toString(),
        });
        userIndex = playzone.playnumbers[playnumberIndex].users.length - 1;
      }

      // Populate currency for the newly added user
      await playzone.populate(
        `playnumbers.${playnumberIndex}.users.${userIndex}.currency`
      );

      // Update numbercount and amount
      playzone.playnumbers[playnumberIndex].numbercount =
        playzone.playnumbers[playnumberIndex].users.length;

      // Calculate amount with currency value
      let totalAmount = 0;
      for (const user of playzone.playnumbers[playnumberIndex].users) {
        console.log("Cal User :: " + JSON.stringify(user));
        const amount = parseFloat(user.amount);
        const curren = await Currency.findById(user.currency);
        const currencyValue = parseFloat(
          curren.countrycurrencyvaluecomparedtoinr
        );
        if (isNaN(amount) || isNaN(currencyValue)) {
          console.error(
            `Invalid amount or currency value for user: ${JSON.stringify(user)}`
          );
          continue;
        }
        totalAmount += amount * currencyValue;
      }

      playzone.playnumbers[playnumberIndex].amount = totalAmount;

      // Calculate distributiveamount with currency value
      let totalDistributiveAmount = 0;
      for (const user of playzone.playnumbers[playnumberIndex].users) {
        console.log("Cal User :: " + JSON.stringify(user));
        const winningAmount = parseFloat(user.winningamount);
        const curren = await Currency.findById(user.currency);
        const currencyValue = parseFloat(
          curren.countrycurrencyvaluecomparedtoinr
        );
        if (isNaN(winningAmount) || isNaN(currencyValue)) {
          console.error(
            `Invalid winning amount or currency value for user: ${JSON.stringify(
              user
            )}`
          );
          continue;
        }
        totalDistributiveAmount += winningAmount * currencyValue;
      }

      playzone.playnumbers[playnumberIndex].distributiveamount =
        totalDistributiveAmount;

      console.log(
        "Updated playnumber :: ",
        JSON.stringify(playzone.playnumbers[playnumberIndex])
      );
    }
  }

  // Save the updated Playzone entry
  await playzone.save();
  console.log("Playzone Update Successful");

  const currencyap = await Currency.findById(user.country._id);
  if (!currencyap) {
    return next(new ErrorHandler("Currency not found", 404));
  }

  const currencyconverter = parseFloat(
    currencyap.countrycurrencyvaluecomparedtoinr
  );

  // Fetch all WalletTwo balances and populate currencyId
  const walletTwoBalances = await WalletTwo.find({}).populate("currencyId");
  let gameBalance = 0;

  walletTwoBalances.forEach((wallet) => {
    const walletCurrencyConverter = parseFloat(
      wallet.currencyId.countrycurrencyvaluecomparedtoinr
    );
    gameBalance += wallet.balance * walletCurrencyConverter;
  });

  // Fetch all WalletOne balances and populate currencyId
  const walletOneBalances = await WalletOne.find({}).populate("currencyId");
  let withdrawalBalance = 0;

  walletOneBalances.forEach((wallet) => {
    const walletCurrencyConverter = parseFloat(
      wallet.currencyId.countrycurrencyvaluecomparedtoinr
    );
    withdrawalBalance += wallet.balance * walletCurrencyConverter;
  });

  // Add the additional amount with currency conversion
  gameBalance -= parseFloat(totalAmount * currencyconverter);

  // Calculate total balance as the sum of walletOne and walletTwo balances
  const totalBalance = withdrawalBalance + gameBalance;

  // Create a new AppBalanceSheet document
  const appBalanceSheet = new AppBalanceSheet({
    amount: parseFloat(totalAmount * currencyconverter),
    withdrawalbalance: withdrawalBalance,
    gamebalance: gameBalance,
    totalbalance: totalBalance,
    usercurrency: user.country._id.toString(),
    activityType: "Bet",
    userId: user.userId,
    paybetId: newPlaybet._id,
    paymentProcessType: "Debit",
  });

  // Save the AppBalanceSheet document
  await appBalanceSheet.save();
  console.log("AppBalanceSheet Created Successfully");

  const updatedWallet = await WalletTwo.findByIdAndUpdate(
    walletId,
    { balance: remainingWalletBalance },
    { new: true }
  );

  console.log("User's walletTwo updated successfully :: " + updatedWallet);

  //  FOR PARTNER PERFORMANCE

  // Step 2: Get user details using req.user.userId
  const { parentPartnerId } = user;
  if (!parentPartnerId) {
    return res.status(400).json({ message: "User has no parent partner" });
  }

  if (parentPartnerId !== 1000) {
    // Step 1: Get partner performance based on lotlocation, lottime, and lotdate
    let partnerPerformance = await PartnerPerformance.findOne({
      lotlocation,
      lottime,
      lotdate,
    });

    if (!partnerPerformance) {
      return res.status(404).json({ message: "Partner performance not found" });
    }

    // Step 3: Get parent details from ParentModule
    const parent = await PartnerModule.findOne({ userId: parentPartnerId });
    if (!parent) {
      return res.status(404).json({ message: "Parent partner not found" });
    }

    // [GETTING PARTNER PARENT]
    let parentParent = null;
    if (parent.parentPartnerId !== 1000) {
      parentParent = await PartnerModule.findOne({
        userId: parent.parentPartnerId,
      });
    }

    // [GETTING PARTNER PARENT PARENT]
    let parentParentParent = null;
    if (parent.parentParentPartnerId !== 1000) {
      parentParentParent = await PartnerModule.findOne({
        userId: parent.parentParentPartnerId,
      });
    }

    // Step 4: Ensure performance array exists
    // if (!partnerPerformance.performances) {
    //   partnerPerformance.performances = [];
    // }

    // Check if parentPartnerId is in performance array
    let partnerData = partnerPerformance.performances.find(
      (p) => p.partnerId.toString() === parentPartnerId.toString()
    );

    if (!partnerData) {
      // If not found, create an object
      partnerData = {
        partnerId: parentPartnerId,
        name: parent.name,
        profitPercentage: parent.profitPercentage || 0,
        rechargePercentage: parent.rechargePercentage || 0,
        partnerStatus: parent.partnerStatus,
        rechargeStatus: parent.rechargeStatus,
        partnerWalletTwo: parent.walletTwo,
        parentPartnerId: parent.parentPartnerId,
        parentParentPartnerId: parent.parentParentPartnerId,
        topParentId: parent.topParentId,
        parentPartnerPartnerStatus: parentParent?.partnerStatus || false,
        parentPartnerRechargeStatus: parentParent?.rechargeStatus || false,
        parentPartnerProfitPercentage: parentParent?.profitPercentage || 0,
        parentPartnerRechargePercentage: parentParent?.rechargePercentage || 0,
        parentPartnerWalletTwo: parentParent?.walletTwo || parent.walletTwo,
        parentParentPartnerPartnerStatus:
          parentParentParent?.partnerStatus || false,
        parentParentPartnerRechargeStatus:
          parentParentParent?.rechargeStatus || false,
        parentParentPartnerProfitPercentage:
          parentParentParent?.profitPercentage || 0,
        parentParentPartnerRechargePercentage:
          parentParentParent?.rechargePercentage || 0,
        parentParentPartnerWalletTwo:
          parentParentParent?.walletTwo || parent.walletTwo,
        users: [],
      };

      const currentuserId = req.user.userId;
      const currentnewAmount = parseFloat(totalAmount);
      const currentnewConvertedAmount = parseFloat(
        totalAmount * currencyconverter
      );

      partnerData.users.push({
        userId: currentuserId,
        username: req.user.name,
        amount: currentnewAmount,
        convertedAmount: currentnewConvertedAmount,
        currency: user.country._id.toString(),
      });

      // Push the new partner data into the performance array
      partnerPerformance.performances.push(partnerData);
    } else {
      const currentuserId = req.user.userId;
      const currentnewAmount = parseFloat(totalAmount);
      const currentnewConvertedAmount = parseFloat(
        totalAmount * currencyconverter
      );

      // Check if the user already exists in partnerData.users
      const existingUser = partnerData.users.find(
        (user) => user.userId.toString() === currentuserId.toString()
      );

      if (existingUser) {
        // Update the existing user's amount and convertedAmount
        existingUser.amount += currentnewAmount;
        existingUser.convertedAmount += currentnewConvertedAmount;
      } else {
        // Push new user data if not found
        partnerData.users.push({
          userId: currentuserId,
          username: req.user.name,
          amount: currentnewAmount,
          convertedAmount: currentnewConvertedAmount,
          currency: user.country._id.toString(),
        });
      }
    }

    // Save the updated partner performance data
    await partnerPerformance.save();
  }

  res.status(201).json({
    success: true,
    message: "Playbet entry added successfully",
  });
});

// const addPowerBet = async (req, res) => {
//   try {
//     const userId = req.user._id;
//     const { powertime, powerdate, gameType, tickets } = req.body;

//     // Calculate total amount
//     const totalAmount = tickets.reduce((sum, ticket) => sum + ticket.amount, 0);

//     // Find the user

//     // Find the user and update their walletTwo balance
//     const user = await User.findById(userId)
//       .populate("walletOne")
//       .populate("walletTwo")
//       .populate("country"); // Ensure country is populated

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: "User not found",
//       });
//     }

//     if (user.walletTwo.balance < totalAmount) {
//       return res.status(400).json({
//         success: false,
//         message: "Insufficient balance in walletTwo",
//       });
//     }

//     const walletId = user.walletTwo._id;

//     const totalBalanceAmount = parseFloat(user.walletTwo.balance);
//     const remainingWalletBalance = totalBalanceAmount - parseFloat(totalAmount);

//     const newPlaybet = new Playbet({
//       tickets,
//       username: req.user.name,
//       userid: req.user.userId,
//       powerdate,
//       powertime,
//       gameType,
//       currency: user.country._id.toString(),
//     });

//     await newPlaybet.save();

//     // Add playbet ID to user's playbet history
//     await User.findByIdAndUpdate(userId, {
//       $push: {
//         playbetHistory: newPlaybet._id,
//       },
//     });

//     // Get powerball details from PowerballGameTickets model
//     const powerballDetails = await PowerballGameTickets.findOne({
//       powertime,
//       powerdate,
//     });

//     if (!powerballDetails) {
//       return res.status(404).json({ message: "Powerball game not found" });
//     }

//     // Add data to alltickets array as per Tickets model
//     const newTicket = new Tickets({
//       userId,
//       powertime,
//       powerdate,
//       gameType,
//       tickets,
//       powerballDetails,
//     });
//     await newTicket.save();

//     res.status(201).json({
//       message: "Power bet placed successfully",
//       powerBet: savedPowerBet,
//       powerballDetails,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// };

const addPowerBet = async (req, res) => {
  try {
    const userId = req.user._id;
    const { powertime, powerdate, gameType, tickets } = req.body;

    if (!tickets || !Array.isArray(tickets) || tickets.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Tickets array is required and cannot be empty",
      });
    }

    // Calculate total amount
    const totalAmount = tickets.reduce((sum, ticket) => sum + ticket.amount, 0);

    // Find the user and update their walletTwo balance
    const user = await User.findById(userId)
      .populate("walletOne")
      .populate("walletTwo")
      .populate("country");

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

    const walletId = user.walletTwo._id;
    const remainingWalletBalance = user.walletTwo.balance - totalAmount;

    const newPlaybet = new Playbet({
      tickets,
      username: user.name,
      userid: user.userId,
      powerdate,
      powertime,
      gameType,
      currency: user.country._id.toString(),
    });

    await newPlaybet.save();

    // Add playbet ID to user's playbet history
    await User.findByIdAndUpdate(userId, {
      $push: { playbetHistory: newPlaybet._id },
    });

    // Get powerball details from PowerballGameTickets model
    const powerballDetails = await PowerballGameTickets.findOne({
      powertime,
      powerdate,
    });

    if (!powerballDetails) {
      return res.status(404).json({ message: "Powerball game not found" });
    }

    // Create the new ticket entry
    const newTicketEntry = {
      userId: user.userId,
      username: user.name,
      currency: user.country._id,
      tickets: tickets.map((ticket) => ({
        amount: ticket.amount,
        convertedAmount: ticket.convertedAmount || 0,
        multiplier: ticket.multiplier || 1,
        usernumber: ticket.usernumber,
      })),
    };

    // Push new ticket data to alltickets array
    powerballDetails.alltickets.push(newTicketEntry);
    await powerballDetails.save();

    // FOR BALANCESHEET UPDATE
    const currencyap = await Currency.findById(user.country._id);
    if (!currencyap) {
      return next(new ErrorHandler("Currency not found", 404));
    }

    const currencyconverter = parseFloat(
      currencyap.countrycurrencyvaluecomparedtoinr
    );

    // Fetch all WalletTwo balances and populate currencyId
    const walletTwoBalances = await WalletTwo.find({}).populate("currencyId");
    let gameBalance = 0;

    walletTwoBalances.forEach((wallet) => {
      const walletCurrencyConverter = parseFloat(
        wallet.currencyId.countrycurrencyvaluecomparedtoinr
      );
      gameBalance += wallet.balance * walletCurrencyConverter;
    });

    // Fetch all WalletOne balances and populate currencyId
    const walletOneBalances = await WalletOne.find({}).populate("currencyId");
    let withdrawalBalance = 0;

    walletOneBalances.forEach((wallet) => {
      const walletCurrencyConverter = parseFloat(
        wallet.currencyId.countrycurrencyvaluecomparedtoinr
      );
      withdrawalBalance += wallet.balance * walletCurrencyConverter;
    });

    // Add the additional amount with currency conversion
    gameBalance -= parseFloat(totalAmount * currencyconverter);

    // Calculate total balance as the sum of walletOne and walletTwo balances
    const totalBalance = withdrawalBalance + gameBalance;

    // Create a new AppBalanceSheet document
    const appBalanceSheet = new AppBalanceSheet({
      amount: parseFloat(totalAmount * currencyconverter),
      withdrawalbalance: withdrawalBalance,
      gamebalance: gameBalance,
      totalbalance: totalBalance,
      usercurrency: user.country._id.toString(),
      activityType: "Bet",
      userId: user.userId,
      paybetId: newPlaybet._id,
      paymentProcessType: "Debit",
    });

    // Save the AppBalanceSheet document
    await appBalanceSheet.save();
    console.log("AppBalanceSheet Created Successfully");

    const updatedWallet = await WalletTwo.findByIdAndUpdate(
      walletId,
      { balance: remainingWalletBalance },
      { new: true }
    );

    // TODO: FOR PARTNER PERFORMANCE

    // Step 2: Get user details using req.user.userId
    const { parentPartnerId } = user;
    if (!parentPartnerId) {
      return res.status(400).json({ message: "User has no parent partner" });
    }

    if (parentPartnerId !== 1000) {
      // Step 1: Get partner performance based on lotlocation, lottime, and lotdate
      let partnerPerformance = await PartnerPerformancePowerball.findOne({
        powertime,
        powerdate,
      });

      if (!partnerPerformance) {
        return res
          .status(404)
          .json({ message: "Partner performance not found" });
      }

      // Step 3: Get parent details from ParentModule
      const parent = await PartnerModule.findOne({ userId: parentPartnerId });
      if (!parent) {
        return res.status(404).json({ message: "Parent partner not found" });
      }

      // [GETTING PARTNER PARENT]
      let parentParent = null;
      if (parent.parentPartnerId !== 1000) {
        parentParent = await PartnerModule.findOne({
          userId: parent.parentPartnerId,
        });
      }

      // [GETTING PARTNER PARENT PARENT]
      let parentParentParent = null;
      if (parent.parentParentPartnerId !== 1000) {
        parentParentParent = await PartnerModule.findOne({
          userId: parent.parentParentPartnerId,
        });
      }

      // Step 4: Ensure performance array exists
      // if (!partnerPerformance.performances) {
      //   partnerPerformance.performances = [];
      // }

      // Check if parentPartnerId is in performance array
      let partnerData = partnerPerformance.performances.find(
        (p) => p.partnerId.toString() === parentPartnerId.toString()
      );

      if (!partnerData) {
        // If not found, create an object
        partnerData = {
          partnerId: parentPartnerId,
          name: parent.name,
          profitPercentage: parent.profitPercentage || 0,
          rechargePercentage: parent.rechargePercentage || 0,
          partnerStatus: parent.partnerStatus,
          rechargeStatus: parent.rechargeStatus,
          parentPartnerId: parent.parentPartnerId,
          parentParentPartnerId: parent.parentParentPartnerId,
          topParentId: parent.topParentId,
          parentPartnerPartnerStatus: parentParent?.partnerStatus || false,
          parentPartnerRechargeStatus: parentParent?.rechargeStatus || false,
          parentPartnerProfitPercentage: parentParent?.profitPercentage || 0,
          parentPartnerRechargePercentage:
            parentParent?.rechargePercentage || 0,
          parentParentPartnerPartnerStatus:
            parentParentParent?.partnerStatus || false,
          parentParentPartnerRechargeStatus:
            parentParentParent?.rechargeStatus || false,
          parentParentPartnerProfitPercentage:
            parentParentParent?.profitPercentage || 0,
          parentParentPartnerRechargePercentage:
            parentParentParent?.rechargePercentage || 0,

          users: [],
        };

        const currentuserId = req.user.userId;
        const currentnewAmount = parseFloat(totalAmount);
        const currentnewConvertedAmount = parseFloat(
          totalAmount * currencyconverter
        );

        partnerData.users.push({
          userId: currentuserId,
          username: req.user.name,
          amount: currentnewAmount,
          convertedAmount: currentnewConvertedAmount,
          currency: user.country._id.toString(),
        });

        // Push the new partner data into the performance array
        partnerPerformance.performances.push(partnerData);
      } else {
        const currentuserId = req.user.userId;
        const currentnewAmount = parseFloat(totalAmount);
        const currentnewConvertedAmount = parseFloat(
          totalAmount * currencyconverter
        );

        // Check if the user already exists in partnerData.users
        const existingUser = partnerData.users.find(
          (user) => user.userId.toString() === currentuserId.toString()
        );

        if (existingUser) {
          // Update the existing user's amount and convertedAmount
          existingUser.amount += currentnewAmount;
          existingUser.convertedAmount += currentnewConvertedAmount;
        } else {
          // Push new user data if not found
          partnerData.users.push({
            userId: currentuserId,
            username: req.user.name,
            amount: currentnewAmount,
            convertedAmount: currentnewConvertedAmount,
            currency: user.country._id.toString(),
          });
        }
      }

      // Save the updated partner performance data
      await partnerPerformance.save();
    }

    res.status(201).json({
      success: true,
      message: "Power bet placed successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({ message: "Internal Server Error" });
  }
};

// const searchPowerBet = async (req, res) => {
//   try {
//     const { id, jackpot, page = 1, limit = 10 } = req.query;

//     // Validate required parameters
//     if (!id || !jackpot) {
//       return res.status(400).json({
//         success: false,
//         message: "ID and jackpot are required",
//       });
//     }

//     // Validate MongoDB ID format
//     if (!mongoose.Types.ObjectId.isValid(id)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid game ID format",
//       });
//     }

//     // Convert and validate jackpot numbers
//     const jackpotNumbers = jackpot.split(" ").map(Number);
//     if (jackpotNumbers.some(isNaN) || jackpotNumbers.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: "Jackpot must contain valid numbers separated by spaces",
//       });
//     }

//     // Configure pagination with safe defaults
//     const pageNumber = Math.max(1, parseInt(page, 10));
//     const limitNumber = Math.min(100, Math.max(1, parseInt(limit, 10)));
//     const skip = (pageNumber - 1) * limitNumber;

//     // Find the power game with optimized population
//     const powerGame = await PowerballGameTickets.findById(id)
//       .populate({
//         path: "alltickets.userId",
//         select: "username currency", // Only get necessary fields
//       })
//       .populate("powerdate")
//       .populate("powertime")
//       .lean(); // Convert to plain JS object for better performance

//     if (!powerGame) {
//       return res.status(404).json({
//         success: false,
//         message: "Powerball game not found",
//       });
//     }

//     // Process tickets efficiently
//     const allMatchedTickets = [];
//     let totalMatchedTickets = 0;

//     for (const ticketEntry of powerGame.alltickets) {
//       const userTickets = ticketEntry.tickets.filter((ticket) =>
//         jackpotNumbers.every((num) => ticket.usernumber.includes(num))
//       );

//       if (userTickets.length > 0) {
//         totalMatchedTickets += userTickets.length;
//         allMatchedTickets.push({
//           userId: ticketEntry.userId._id,
//           username: ticketEntry.userId.username,
//           currency: ticketEntry.userId.currency,
//           tickets: userTickets,
//           _id: ticketEntry._id,
//           createdAt: ticketEntry.createdAt,
//           updatedAt: ticketEntry.updatedAt,
//         });
//       }
//     }

//     // Apply pagination
//     const paginatedResults = [];
//     let ticketsProcessed = 0;
//     let ticketsToSkip = skip;
//     let ticketsToTake = limitNumber;

//     for (const user of allMatchedTickets) {
//       if (ticketsToSkip >= user.tickets.length) {
//         ticketsToSkip -= user.tickets.length;
//         continue;
//       }

//       const startIdx = ticketsToSkip;
//       const endIdx = Math.min(startIdx + ticketsToTake, user.tickets.length);
//       const paginatedTickets = user.tickets.slice(startIdx, endIdx);

//       if (paginatedTickets.length > 0) {
//         paginatedResults.push({
//           ...user,
//           tickets: paginatedTickets,
//         });
//       }

//       ticketsToTake -= endIdx - startIdx;
//       ticketsToSkip = 0; // Reset after first adjustment

//       if (ticketsToTake <= 0) break;
//     }

//     const totalPages = Math.ceil(totalMatchedTickets / limitNumber);

//     // Prepare final response
//     const response = {
//       _id: powerGame._id,
//       powerdate: powerGame.powerdate,
//       powertime: powerGame.powertime,
//       alltickets: paginatedResults,
//       createdAt: powerGame.createdAt,
//       updatedAt: powerGame.updatedAt,
//       __v: powerGame.__v,
//     };

//     res.status(200).json({
//       success: true,
//       page: pageNumber,
//       totalPages,
//       totalRecords: totalMatchedTickets,
//       tickets: [response], // Maintain array structure for consistency
//     });
//   } catch (error) {
//     console.error("Error in searchPowerBet:", error);
//     res.status(500).json({
//       success: false,
//       message: "Internal Server Error",
//       error: process.env.NODE_ENV === "development" ? error.message : undefined,
//     });
//   }
// };
const searchPowerBet = async (req, res) => {
  try {
    const { id, jackpot, page = 1, limit = 10 } = req.query;

    // Validate input
    if (!id || !jackpot) {
      return res.status(400).json({
        success: false,
        message: "ID and jackpot are required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid game ID format",
      });
    }

    const jackpotNumbers = jackpot.split(" ").map(Number);
    if (jackpotNumbers.some(isNaN) || jackpotNumbers.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Jackpot must contain valid numbers separated by spaces",
      });
    }

    const pageNumber = Math.max(1, parseInt(page, 10));
    const limitNumber = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNumber - 1) * limitNumber;

    const powerGame = await PowerballGameTickets.findById(id)
      .populate({
        path: "alltickets.userId",
        select: "username currency",
      })
      .populate("powerdate")
      .populate("powertime")
      .lean();

    if (!powerGame) {
      return res.status(404).json({
        success: false,
        message: "Powerball game not found",
      });
    }

    const allMatchedTickets = [];
    let totalMatchedTickets = 0;

    for (const ticketEntry of powerGame.alltickets) {
      const userTickets = ticketEntry.tickets.filter((ticket) => {
        const userNumbers = ticket.usernumber;
        if (!Array.isArray(userNumbers)) return false;
        if (userNumbers.length < jackpotNumbers.length) return false;

        // Check if starting sequence matches jackpotNumbers
        for (let i = 0; i < jackpotNumbers.length; i++) {
          if (userNumbers[i] !== jackpotNumbers[i]) return false;
        }
        return true;
      });

      if (userTickets.length > 0) {
        totalMatchedTickets += userTickets.length;
        allMatchedTickets.push({
          userId: ticketEntry.userId._id,
          username: ticketEntry.userId.username,
          currency: ticketEntry.userId.currency,
          tickets: userTickets,
          _id: ticketEntry._id,
          createdAt: ticketEntry.createdAt,
          updatedAt: ticketEntry.updatedAt,
        });
      }
    }

    // Apply pagination
    const paginatedResults = [];
    let ticketsToSkip = skip;
    let ticketsToTake = limitNumber;

    for (const user of allMatchedTickets) {
      if (ticketsToSkip >= user.tickets.length) {
        ticketsToSkip -= user.tickets.length;
        continue;
      }

      const startIdx = ticketsToSkip;
      const endIdx = Math.min(startIdx + ticketsToTake, user.tickets.length);
      const paginatedTickets = user.tickets.slice(startIdx, endIdx);

      if (paginatedTickets.length > 0) {
        paginatedResults.push({
          ...user,
          tickets: paginatedTickets,
        });
      }

      ticketsToTake -= endIdx - startIdx;
      ticketsToSkip = 0;

      if (ticketsToTake <= 0) break;
    }

    const totalPages = Math.ceil(totalMatchedTickets / limitNumber);

    const response = {
      _id: powerGame._id,
      powerdate: powerGame.powerdate,
      powertime: powerGame.powertime,
      alltickets: paginatedResults,
      createdAt: powerGame.createdAt,
      updatedAt: powerGame.updatedAt,
      __v: powerGame.__v,
    };

    res.status(200).json({
      success: true,
      page: pageNumber,
      totalPages,
      totalRecords: totalMatchedTickets,
      tickets: [response],
    });
  } catch (error) {
    console.error("Error in searchPowerBet:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const getUserPlaybets = asyncError(async (req, res, next) => {
  const userId = req.user._id;

  try {
    const user = await User.findById(userId).populate({
      path: "playbetHistory",
      populate: [
        { path: "lotdate", model: "LotDate" },
        { path: "lottime", model: "LotTime" },
        { path: "lotlocation", model: "LotLocation" },
        { path: "powerdate", model: "PowerDate" },
        { path: "powertime", model: "PowerTime" },
        { path: "currency", model: "Currency" },
      ],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    let playbets = user.playbetHistory;

    // Log raw data
    playbets.forEach((bet) => {
      console.log(`ID: ${bet._id}, Created At: ${bet.createdAt}`);
    });

    // Ensure createdAt is treated as a date
    playbets = playbets.map((bet) => ({
      ...bet.toObject(), // Ensure it's a plain object
      createdAt: new Date(bet.createdAt),
    }));

    // Reverse the order of playbets to get the most recent first
    playbets.reverse();

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

// const getSingleUserPlaybetHistory = asyncError(async (req, res, next) => {
//   const userId = req.params.userid;

//   try {
//     // Find the user by ID to get the playbetHistory
//     const user = await User.findOne({ userId }).populate({
//       path: "playbetHistory",
//       populate: [
//         { path: "lotdate", model: "LotDate" },
//         { path: "lottime", model: "LotTime" },
//         { path: "lotlocation", model: "LotLocation" },
//         { path: "currency", model: "Currency" },
//       ],
//     });

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: "User not found",
//       });
//     }

//     // Get the playbetHistory array from the user document
//     let playbets = user.playbetHistory;

//     // Ensure createdAt is treated as a date
//     playbets = playbets.map((bet) => ({
//       ...bet.toObject(), // Ensure it's a plain object
//       createdAt: new Date(bet.createdAt),
//     }));

//     // Reverse the order to get the oldest first
//     playbets.reverse();

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

const getSingleUserPlaybetHistory = asyncError(async (req, res, next) => {
  const userId = req.params.userid;
  let { page, limit } = req.query;

  // Convert page and limit to integers and set default values
  page = parseInt(page) || 1;
  limit = parseInt(limit) || 10;
  const skip = (page - 1) * limit;

  try {
    // Find the user by ID to get the playbetHistory
    const user = await User.findOne({ userId }).populate({
      path: "playbetHistory",
      populate: [
        { path: "lotdate", model: "LotDate" },
        { path: "lottime", model: "LotTime" },
        { path: "powerdate", model: "PowerDate" },
        { path: "powertime", model: "PowerTime" },
        { path: "lotlocation", model: "LotLocation" },
        { path: "currency", model: "Currency" },
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

    // Ensure createdAt is treated as a date
    playbets = playbets.map((bet) => ({
      ...bet.toObject(), // Ensure it's a plain object
      createdAt: new Date(bet.createdAt),
    }));

    // Reverse the array to get the latest data first
    playbets.reverse();

    // Apply pagination after reversing the array
    const paginatedPlaybets = playbets.slice(skip, skip + limit);

    // Get the total number of playbets for the user
    const totalPlaybets = playbets.length;

    // Return paginated response
    res.status(200).json({
      success: true,
      playbets: paginatedPlaybets,
      totalPlaybets,
      totalPages: Math.ceil(totalPlaybets / limit),
      currentPage: page,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve playbets",
      error: error.message,
    });
  }
});

// const getSingleUserPlaybetHistory = asyncError(async (req, res, next) => {
//   const userId = req.params.userid;
//   let { page, limit } = req.query;

//   // Convert page and limit to integers and set default values
//   page = parseInt(page) || 1;
//   limit = parseInt(limit) || 10;
//   const skip = (page - 1) * limit;

//   try {
//     // Find the user by ID to get the playbetHistory
//     const user = await User.findOne({ userId }).populate({
//       path: "playbetHistory",
//       populate: [
//         { path: "lotdate", model: "LotDate" },
//         { path: "lottime", model: "LotTime" },
//         { path: "powerdate", model: "PowerDate" },
//         { path: "powertime", model: "PowerTime" },
//         { path: "lotlocation", model: "LotLocation" },
//         { path: "currency", model: "Currency" },
//       ],
//       options: {
//         skip: skip, // Skip based on page number
//         limit: limit, // Limit the number of playbets per page
//       },
//     });

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: "User not found",
//       });
//     }

//     // Get the total number of playbets for the user
//     const totalPlaybets = await User.countDocuments({ userId });

//     // Get the playbetHistory array from the user document
//     let playbets = user.playbetHistory;

//     // Ensure createdAt is treated as a date
//     playbets = playbets.map((bet) => ({
//       ...bet.toObject(), // Ensure it's a plain object
//       createdAt: new Date(bet.createdAt),
//     }));

//     // Reverse the order to get the oldest first
//     playbets.reverse();

//     // Return paginated response
//     res.status(200).json({
//       success: true,
//       playbets,
//       totalPlaybets,
//       totalPages: Math.ceil(totalPlaybets / limit),
//       currentPage: page,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Failed to retrieve playbets",
//       error: error.message,
//     });
//   }
// });

const createCurrency = asyncError(async (req, res, next) => {
  const {
    countryname,
    countryicon,
    countrycurrencysymbol,
    countrycurrencyvaluecomparedtoinr,
    timezone,
    ticketprice,
    multiplierprice,
  } = req.body;

  if (!countryname)
    return next(new ErrorHandler("country name is missing", 404));

  if (!timezone)
    return next(new ErrorHandler("country timezone is missing", 404));

  if (!countrycurrencysymbol)
    return next(new ErrorHandler("country currency symbol is missing", 404));
  if (!multiplierprice)
    return next(
      new ErrorHandler("country ticket multiplier price is missing", 404)
    );

  if (!ticketprice)
    return next(
      new ErrorHandler("country powerball ticket price is missing", 404)
    );

  if (!countrycurrencyvaluecomparedtoinr)
    return next(
      new ErrorHandler("country currency value compared to inr is missing", 404)
    );

  if (!req.file) return next(new ErrorHandler("country icon is missing", 404));

  const newCurrency = await Currency.create({
    countryname,
    timezone,
    countryicon: req.file ? req.file.filename : undefined,
    countrycurrencysymbol,
    countrycurrencyvaluecomparedtoinr,
    ticketprice,
    multiplierprice,
  });

  res.status(201).json({
    success: true,
    currency: newCurrency,
  });
});

// Get all currencies
// const getAllCurrencies = asyncError(async (req, res, next) => {
//   const currencies = await Currency.find();

//   res.status(200).json({
//     success: true,
//     currencies,
//   });
// });

const getAllCurrencies = asyncError(async (req, res, next) => {
  const { page, limit, sortBy } = req.query;

  // Set default values for pagination if not provided
  const currentPage = parseInt(page) || 1;
  const itemsPerPage = parseInt(limit) || 10;
  const skip = (currentPage - 1) * itemsPerPage;

  // Set sorting criteria (default by name)
  const sortCriteria = sortBy || "name";

  try {
    // Fetch currencies with pagination and sorting
    const currencies = await Currency.find()
      .skip(skip)
      .limit(itemsPerPage)
      .sort({ [sortCriteria]: 1 }); // Sorting by the field provided in sortBy (ascending)

    // Get total count of currencies for pagination info
    const totalCurrencies = await Currency.countDocuments();

    res.status(200).json({
      success: true,
      currencies,
      totalCurrencies,
      totalPages: Math.ceil(totalCurrencies / itemsPerPage),
      currentPage,
    });
  } catch (error) {
    next(new ErrorHandler(error.message, 500));
  }
});

// Update a currency
const updateCurrency = asyncError(async (req, res, next) => {
  const { id } = req.params;
  const {
    countryname,
    countrycurrencysymbol,
    countrycurrencyvaluecomparedtoinr,
    ticketprice,
    multiplierprice,
  } = req.body;

  // Find the existing currency
  const currency = await Currency.findById(id);
  if (!currency) {
    return next(new ErrorHandler("Currency not found", 404));
  }

  // Update the fields if provided
  if (countryname) currency.countryname = countryname;
  if (ticketprice) currency.ticketprice = ticketprice;
  if (multiplierprice) currency.multiplierprice = multiplierprice;

  if (countrycurrencysymbol)
    currency.countrycurrencysymbol = countrycurrencysymbol;
  if (countrycurrencyvaluecomparedtoinr)
    currency.countrycurrencyvaluecomparedtoinr =
      countrycurrencyvaluecomparedtoinr;

  // Check if a new file is provided for country icon
  if (req.file) {
    const previousIconPath = path.join(
      __dirname,
      "../public/uploads/currency",
      currency.countryicon
    );

    // Remove the old icon if it exists
    if (currency.countryicon && fs.existsSync(previousIconPath)) {
      fs.unlinkSync(previousIconPath);
    }

    // Update the icon with the new filename
    currency.countryicon = req.file.filename;
  }

  // Save the updated currency document
  await currency.save();

  res.status(200).json({
    success: true,
    message: "Currency updated successfully",
    currency,
  });
});

// const updateCurrency = asyncError(async (req, res, next) => {
//   const { id } = req.params;
//   const {
//     countryname,
//     countryicon,
//     countrycurrencysymbol,
//     countrycurrencyvaluecomparedtoinr,
//   } = req.body;

//   const updatedCurrency = await Currency.findByIdAndUpdate(
//     id,
//     {
//       countryname,
//       countryicon,
//       countrycurrencysymbol,
//       countrycurrencyvaluecomparedtoinr,
//     },
//     { new: true }
//   );

//   if (!updatedCurrency) {
//     return res.status(404).json({
//       success: false,
//       message: "Currency not found",
//     });
//   }

//   res.status(200).json({
//     success: true,
//     currency: updatedCurrency,
//   });
// });

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
// const deleteCurrency = asyncError(async (req, res, next) => {
//   const { id } = req.params;

//   const currency = await Currency.findById(id);

//   if (!currency) {
//     return next(new ErrorHandler("Currency not found", 404));
//   }

//   // Delete the associated image file
//   const imagePath = path.join(
//     __dirname,
//     "../public/uploads/currency",
//     currency.countryicon
//   );

//   fs.unlink(imagePath, async (err) => {
//     if (err) {
//       return next(
//         new ErrorHandler("Failed to delete associated image file", 500)
//       );
//     }

//     await currency.deleteOne();

//     res.status(200).json({
//       success: true,
//       message: "Currency deleted successfully",
//     });
//   });
// });

const deleteCurrency = asyncError(async (req, res, next) => {
  const { id } = req.params;

  const currency = await Currency.findById(id);

  if (!currency) {
    return next(new ErrorHandler("Currency not found", 404));
  }

  // Define the path of the associated image file
  const imagePath = path.join(
    __dirname,
    "../public/uploads/currency",
    currency.countryicon
  );

  // Try deleting the image file, but ensure currency deletion even if it fails
  fs.unlink(imagePath, async (err) => {
    if (err) {
      console.error("Error deleting image:", err.message);
      // Log the error, but do not return as we still need to delete the currency
    }

    // Delete the currency from the database
    try {
      await currency.deleteOne();

      res.status(200).json({
        success: true,
        message: "Currency deleted successfully",
      });
    } catch (deleteError) {
      return next(new ErrorHandler("Failed to delete currency", 500));
    }
  });
});

// GET ALL THE BALANCE SHEET

// const getAppBalanceSheet = asyncError(async (req, res, next) => {
//   const balancesheet = await AppBalanceSheet.find()
//     .populate({
//       path: "paybetId",
//       populate: {
//         path: "lotlocation",
//         model: "LotLocation", // Ensure this model name matches your Mongoose schema
//       },
//     })
//     .populate("payzoneId")
//     .populate("transactionId")
//     .sort({ createdAt: -1 })
//     .lean(); // Using lean for efficient queries and manual population

//   // Manually populate usercurrency if it's an ObjectId
//   for (const sheet of balancesheet) {
//     if (mongoose.Types.ObjectId.isValid(sheet.usercurrency)) {
//       const currency = await Currency.findById(sheet.usercurrency);
//       sheet.usercurrency = currency; // Replace the ID with the populated object
//     }
//   }

//   res.status(200).json({
//     success: true,
//     balancesheet,
//   });
// });

const getAppBalanceSheet = asyncError(async (req, res, next) => {
  // Extract pagination parameters from query (with defaults)
  const page = parseInt(req.query.page, 10) || 1; // Default page is 1
  const limit = parseInt(req.query.limit, 10) || 20; // Default limit is 20 records per page
  const skip = (page - 1) * limit; // Calculate how many records to skip

  // Fetch the balance sheet data with pagination, sorting, and population
  const balancesheet = await AppBalanceSheet.find()
    .populate({
      path: "paybetId",
      populate: {
        path: "lotlocation",
        model: "LotLocation",
      },
    })
    .populate("payzoneId")
    .populate("transactionId")
    .sort({ createdAt: -1 })
    .skip(skip) // Skip records for pagination
    .limit(limit) // Limit the number of records
    .lean(); // Use lean for more efficient queries

  // Manually populate usercurrency if it's an ObjectId
  for (const sheet of balancesheet) {
    if (mongoose.Types.ObjectId.isValid(sheet.usercurrency)) {
      const currency = await Currency.findById(sheet.usercurrency);
      sheet.usercurrency = currency; // Replace the ID with the populated object
    }
  }

  // Get the total count of documents (without pagination)
  const totalRecords = await AppBalanceSheet.countDocuments();

  // Send response with paginated data and metadata
  res.status(200).json({
    success: true,
    balancesheet,
    pagination: {
      totalRecords,
      currentPage: page,
      totalPages: Math.ceil(totalRecords / limit),
      limit,
    },
  });
});

const getAppBalanceSheetByUserId = asyncError(async (req, res, next) => {
  const { userId } = req.params; // Extract userId from route parameters

  // Extract pagination parameters from query (with defaults)
  const page = parseInt(req.query.page, 10) || 1; // Default page is 1
  const limit = parseInt(req.query.limit, 10) || 20; // Default limit is 20 records per page
  const skip = (page - 1) * limit; // Calculate how many records to skip

  // Fetch the balance sheet data for the specific userId with pagination, sorting, and population
  const balancesheet = await AppBalanceSheet.find({ userId })
    .populate({
      path: "paybetId",
      populate: {
        path: "lotlocation",
        model: "LotLocation",
      },
    })
    .populate("payzoneId")
    .populate("transactionId")
    .sort({ createdAt: -1 })
    .skip(skip) // Skip records for pagination
    .limit(limit) // Limit the number of records
    .lean(); // Use lean for more efficient queries

  // Manually populate usercurrency if it's an ObjectId
  for (const sheet of balancesheet) {
    if (mongoose.Types.ObjectId.isValid(sheet.usercurrency)) {
      const currency = await Currency.findById(sheet.usercurrency);
      sheet.usercurrency = currency; // Replace the ID with the populated object
    }
  }

  // Get the total count of documents for this userId (without pagination)
  const totalRecords = await AppBalanceSheet.countDocuments({ userId });

  // Send response with paginated data and metadata
  res.status(200).json({
    success: true,
    balancesheet,
    pagination: {
      totalRecords,
      currentPage: page,
      totalPages: Math.ceil(totalRecords / limit),
      limit,
    },
  });
});

const updateAppLinks = asyncError(async (req, res, next) => {
  const { androidLink, iosLink } = req.body;

  // Find the first document or create a new one if it doesn't exist
  let appLink = await AppLink.findOne({});

  if (appLink) {
    // Update only the provided fields
    if (androidLink) appLink.androidLink = androidLink;
    if (iosLink) appLink.iosLink = iosLink;
    await appLink.save();
  } else {
    // Create a new document with the provided fields
    appLink = await AppLink.create({ androidLink, iosLink });
  }

  res.status(200).json({
    success: true,
    message: "App links updated successfully.",
    appLink,
  });
});

// Get App Links
const getAppLinks = asyncError(async (req, res, next) => {
  const appLink = await AppLink.findOne({});

  if (!appLink) {
    return res.status(404).json({
      success: false,
      message: "No app links found.",
    });
  }

  res.status(200).json({
    success: true,
    appLink,
  });
});

// Delete App Links
const deleteAppLinks = asyncError(async (req, res, next) => {
  const { androidLink, iosLink } = req.body;

  // Find the first document
  const appLink = await AppLink.findOne({});

  if (!appLink) {
    return res.status(404).json({
      success: false,
      message: "No app links found to delete.",
    });
  }

  // Delete only the specified fields
  if (androidLink && appLink.androidLink) appLink.androidLink = undefined;
  if (iosLink && appLink.iosLink) appLink.iosLink = undefined;

  // Check if both fields are now empty
  if (!appLink.androidLink && !appLink.iosLink) {
    await appLink.remove();
    return res.status(200).json({
      success: true,
      message: "All app links deleted successfully.",
    });
  }

  // Save the document after deleting specific fields
  await appLink.save();

  res.status(200).json({
    success: true,
    message: "Specified app links deleted successfully.",
  });
});

// PARTNER PERFORMANCE

// Controller to add PartnerPerformance data
const addPartnerPerformance = asyncError(async (req, res) => {
  const { lotlocation, lottime, lotdate, partnerPerformanceData } = req.body;

  if (!lotlocation || !lottime || !lotdate || !partnerPerformanceData) {
    return res.status(400).json({
      success: false,
      message: "All fields are required",
    });
  }

  // Find the existing PartnerPerformance entry
  let partnerPerformance = await PartnerPerformance.findOne({
    lotlocation,
    lottime,
    lotdate,
  });

  if (!partnerPerformance) {
    return res.status(404).json({
      success: false,
      message: "PartnerPerformance entry not found",
    });
  }

  // Add new performance data
  partnerPerformance.performances.push(partnerPerformanceData);
  await partnerPerformance.save();

  res.status(201).json({
    success: true,
    message: "PartnerPerformance data added successfully",
    partnerPerformance,
  });
});

// const getSinglePartnerPerformance = asyncError(async (req, res) => {
//   const { lotlocation, lottime, lotdate } = req.params;
//   let { page, limit } = req.query;

//   if (!lotlocation || !lottime || !lotdate) {
//     return res.status(400).json({
//       success: false,
//       message: "All fields (lotlocation, lottime, lotdate) are required",
//     });
//   }

//   // Convert page and limit to numbers, set defaults if not provided
//   page = parseInt(page) || 1;
//   limit = parseInt(limit) || 10;
//   const skip = (page - 1) * limit;

//   // Find the PartnerPerformance entries based on given parameters with pagination
//   const partnerPerformance = await PartnerPerformance.find({
//     lotlocation,
//     lottime,
//     lotdate,
//   })
//     .populate("lotlocation lottime lotdate")
//     .skip(skip)
//     .limit(limit);

//   if (!partnerPerformance.length) {
//     return res.status(404).json({
//       success: false,
//       message: "No PartnerPerformance records found",
//     });
//   }

//   // Get total count for pagination metadata
//   const totalRecords = await PartnerPerformance.countDocuments({
//     lotlocation,
//     lottime,
//     lotdate,
//   });

//   res.status(200).json({
//     success: true,
//     message: "PartnerPerformance fetched successfully",
//     totalRecords,
//     currentPage: page,
//     totalPages: Math.ceil(totalRecords / limit),
//     partnerPerformance,
//   });
// });

const getSinglePartnerPerformance = asyncError(async (req, res) => {
  const { lotlocation, lottime, lotdate } = req.params;
  let { page, limit } = req.query;

  if (!lotlocation || !lottime || !lotdate) {
    return res.status(400).json({
      success: false,
      message: "All fields (lotlocation, lottime, lotdate) are required",
    });
  }

  // Convert page and limit to numbers, set defaults if not provided
  page = parseInt(page) || 1;
  limit = parseInt(limit) || 10;
  const skip = (page - 1) * limit;

  // Find the PartnerPerformance entry based on the given parameters
  const partnerPerformance = await PartnerPerformance.findOne({
    lotlocation,
    lottime,
    lotdate,
  }).populate("lotlocation lottime lotdate");

  if (!partnerPerformance) {
    return res.status(404).json({
      success: false,
      message: "PartnerPerformance not found",
    });
  }

  // Extract performances array and apply pagination
  const totalRecords = partnerPerformance.performances.length;
  const paginatedPerformances = partnerPerformance.performances.slice(
    skip,
    skip + limit
  );

  res.status(200).json({
    success: true,
    message: "PartnerPerformance fetched successfully",
    totalRecords,
    currentPage: page,
    totalPages: Math.ceil(totalRecords / limit),
    performances: paginatedPerformances, // Return only paginated performances
    partnerPerformance: {
      _id: partnerPerformance._id,
      lotlocation: partnerPerformance.lotlocation,
      lottime: partnerPerformance.lottime,
      lotdate: partnerPerformance.lotdate,
      totalAmount: partnerPerformance.totalAmount,
      winningAmount: partnerPerformance.winningAmount,
      totalProfit: partnerPerformance.totalProfit,
    }, // Sending only metadata to reduce response size
  });
});

const getSinglePartnerPerformancePowerball = asyncError(async (req, res) => {
  const { powertime, powerdate } = req.params;
  let { page, limit } = req.query;

  if (!powertime || !powerdate) {
    return res.status(400).json({
      success: false,
      message: "All fields ( powertime, powerdate) are required",
    });
  }

  // Convert page and limit to numbers, set defaults if not provided
  page = parseInt(page) || 1;
  limit = parseInt(limit) || 10;
  const skip = (page - 1) * limit;

  // Find the PartnerPerformance entry based on the given parameters
  const partnerPerformance = await PartnerPerformancePowerball.findOne({
    powertime,
    powerdate,
  }).populate("powertime powerdate");

  if (!partnerPerformance) {
    return res.status(404).json({
      success: false,
      message: "PartnerPerformance not found",
    });
  }

  // Extract performances array and apply pagination
  const totalRecords = partnerPerformance.performances.length;
  const paginatedPerformances = partnerPerformance.performances.slice(
    skip,
    skip + limit
  );

  res.status(200).json({
    success: true,
    message: "PartnerPerformance fetched successfully",
    totalRecords,
    currentPage: page,
    totalPages: Math.ceil(totalRecords / limit),
    performances: paginatedPerformances, // Return only paginated performances
    partnerPerformance: {
      _id: partnerPerformance._id,
      powertime: partnerPerformance.powertime,
      powerdate: partnerPerformance.powerdate,
      totalAmount: partnerPerformance.totalAmount,
      winningAmount: partnerPerformance.winningAmount,
      totalProfit: partnerPerformance.totalProfit,
    }, // Sending only metadata to reduce response size
  });
});

// ACTIVATE RECHARGE PAYMENT MODULE SO THAT USER CAN SEE DATA
// const updateShowPartnerRechargeToUserAndPartner = asyncError(
//   async (req, res, next) => {
//     const { userId, id } = req.body;

//     if (!userId) {
//       return next(new ErrorHandler("userId is required", 400));
//     }

//     try {
//       // 2️⃣ Find the partner using userId
//       const partner = await PartnerModule.findOne({ userId }).populate(
//         "userList partnerList"
//       );
//       if (!partner) {
//         return next(new ErrorHandler("Partner not found", 404));
//       }

//       // 3️⃣ Update rechargePaymentId for each user in userList
//       if (partner.userList && Array.isArray(partner.userList)) {
//         await Promise.all(
//           partner.userList.map(async (user) => {
//             if (user && user._id) {
//               await User.findByIdAndUpdate(user._id, {
//                 rechargePaymentId: partner.userId,
//               });
//             }
//           })
//         );
//       }

//       // 4️⃣ Recursively update rechargePaymentId for all partners and their users
//       const updateRechargePaymentId = async (partners) => {
//         if (!partners || !Array.isArray(partners)) return;

//         for (const p of partners) {
//           if (!p) continue;

//           await PartnerModule.findByIdAndUpdate(p._id, {
//             rechargePaymentId: partner.userId,
//           });

//           // Update rechargePaymentId for each user in the partner's userList
//           if (p.userList && Array.isArray(p.userList)) {
//             await Promise.all(
//               p.userList.map(async (user) => {
//                 if (user && user._id) {
//                   await User.findByIdAndUpdate(user._id, {
//                     rechargePaymentId: partner.userId,
//                   });
//                 }
//               })
//             );
//           }

//           // If the partner has a partnerList, update them recursively
//           if (p.partnerList && p.partnerList.length > 0) {
//             await updateRechargePaymentId(p.partnerList);
//           }
//         }
//       };

//       // Start recursive update for partnerList
//       if (partner.partnerList && Array.isArray(partner.partnerList)) {
//         await updateRechargePaymentId(partner.partnerList);
//       }

//       // 5️⃣ Finally, update the activationStatus of the bank payment
//       const updatedDocument = await RechargeModule.findByIdAndUpdate(
//         id,
//         { activationStatus: true },
//         { new: true, runValidators: true }
//       );

//       if (!updatedDocument) {
//         return next(
//           new ErrorHandler("Failed to update activation status", 500)
//         );
//       }

//       res.status(200).json({
//         success: true,
//         message: "Activation status updated successfully",
//       });
//     } catch (error) {
//       console.error(error);
//       return next(
//         new ErrorHandler(
//           "An error occurred while updating activation status",
//           500
//         )
//       );
//     }
//   }
// );

const updateShowPartnerRechargeToUserAndPartner = asyncError(
  async (req, res, next) => {
    const { userId, id } = req.body;

    if (!userId) {
      return next(new ErrorHandler("userId is required", 400));
    }

    try {
      // ✅ 1. Find the partner with DEEP population (userList & partnerList.userList)
      const partner = await PartnerModule.findOne({ userId })
        .populate({
          path: "userList",
        })
        .populate({
          path: "partnerList",
          populate: [
            { path: "userList" }, // Populate userList inside partnerList
            { path: "partnerList" }, // Populate nested partnerList
          ],
        });

      if (!partner) {
        return next(new ErrorHandler("Partner not found", 404));
      }

      // ✅ 2. Update ALL users (including nested ones)
      const updateAllUsers = async (users) => {
        if (!users || !Array.isArray(users)) return;
        await Promise.all(
          users.map(async (u) => {
            if (u?._id) {
              await User.findByIdAndUpdate(u._id, {
                rechargePaymentId: partner.userId, // Set to parent partner's userId
              });
            }
          })
        );
      };

      // ✅ 3. Recursively update partners & their users
      const updatePartnersAndUsers = async (partners) => {
        if (!partners || !Array.isArray(partners)) return;

        for (const p of partners) {
          if (!p) continue;

          // Update the partner's rechargePaymentId
          await PartnerModule.findByIdAndUpdate(p._id, {
            rechargePaymentId: partner.userId, // Set to parent partner's userId
          });

          // Update ALL users in this partner's userList
          if (p.userList && Array.isArray(p.userList)) {
            await updateAllUsers(p.userList);
          }

          // Recursively update nested partners
          if (p.partnerList && p.partnerList.length > 0) {
            await updatePartnersAndUsers(p.partnerList);
          }
        }
      };

      // Update main partner's userList
      if (partner.userList && Array.isArray(partner.userList)) {
        await updateAllUsers(partner.userList);
      }

      // Update nested partners (Shah → Pradhan → Ghola, Kong, etc.)
      if (partner.partnerList && Array.isArray(partner.partnerList)) {
        await updatePartnersAndUsers(partner.partnerList);
      }

      // ✅ 4. Activate the recharge entry
      const updatedDocument = await RechargeModule.findByIdAndUpdate(
        id,
        { activationStatus: true },
        { new: true, runValidators: true }
      );

      if (!updatedDocument) {
        return next(
          new ErrorHandler("Failed to update activation status", 500)
        );
      }

      res.status(200).json({
        success: true,
        message: "Activation completed for all nested users & partners",
      });
    } catch (error) {
      console.error(error);
      return next(
        new ErrorHandler(
          "An error occurred while updating activation status",
          500
        )
      );
    }
  }
);

const deactivateShowPartnerRechargeToUserAndPartner = asyncError(
  async (req, res, next) => {
    const { userId, id } = req.body;
    const adminId = 1000;

    if (!userId) {
      return next(new ErrorHandler("userId is required", 400));
    }

    try {
      // ✅ 1. Find the partner with DEEP population (userList & partnerList.userList)
      const partner = await PartnerModule.findOne({ userId })
        .populate({
          path: "userList",
        })
        .populate({
          path: "partnerList",
          populate: [
            { path: "userList" }, // Populate userList inside partnerList
            { path: "partnerList" }, // Populate nested partnerList (if needed)
          ],
        });

      if (!partner) {
        return next(new ErrorHandler("Partner not found", 404));
      }

      // ✅ 2. Deactivate rechargeStatus for the main partner & user
      await PartnerModule.findByIdAndUpdate(partner._id, {
        rechargeStatus: false,
      });

      const user = await User.findOne({ userId });
      if (!user) {
        return next(new ErrorHandler("User not found", 404));
      }
      await User.findByIdAndUpdate(user._id, {
        rechargeStatus: false,
      });

      // ✅ 3. Update rechargePaymentId for ALL users (including nested ones)
      const updateAllUsers = async (users) => {
        if (!users || !Array.isArray(users)) return;
        await Promise.all(
          users.map(async (u) => {
            if (u?._id) {
              await User.findByIdAndUpdate(u._id, {
                rechargePaymentId: adminId,
              });
            }
          })
        );
      };

      // ✅ 4. Recursively update partners & their users
      const updatePartnersAndUsers = async (partners) => {
        if (!partners || !Array.isArray(partners)) return;

        for (const p of partners) {
          if (!p) continue;

          // Update the partner's rechargePaymentId
          await PartnerModule.findByIdAndUpdate(p._id, {
            rechargePaymentId: adminId,
          });

          // Update ALL users in this partner's userList (if populated)
          if (p.userList && Array.isArray(p.userList)) {
            await updateAllUsers(p.userList);
          }

          // Recursively update nested partners (if populated)
          if (p.partnerList && p.partnerList.length > 0) {
            await updatePartnersAndUsers(p.partnerList);
          }
        }
      };

      // Update main partner's userList
      if (partner.userList && Array.isArray(partner.userList)) {
        await updateAllUsers(partner.userList);
      }

      // Update nested partners (Shah → Pradhan → Ghola, Kong, etc.)
      if (partner.partnerList && Array.isArray(partner.partnerList)) {
        await updatePartnersAndUsers(partner.partnerList);
      }

      // ✅ 5. Finally, update RechargeModule
      const updatedDocument = await RechargeModule.findByIdAndUpdate(
        id,
        { activationStatus: false },
        { new: true, runValidators: true }
      );

      if (!updatedDocument) {
        return next(
          new ErrorHandler("Failed to update activation status", 500)
        );
      }

      res.status(200).json({
        success: true,
        message: "Deactivation completed for all nested users & partners",
      });
    } catch (error) {
      console.error(error);
      return next(
        new ErrorHandler(
          "An error occurred while updating activation status",
          500
        )
      );
    }
  }
);

const getUserBankPayments = asyncError(async (req, res, next) => {
  const { userId } = req.params;
  const numericUserId = Number(userId); // Convert userId to a number

  let bankPayments = [];

  try {
    if (numericUserId === 1000) {
      // Fetch all payments for userId 1000
      bankPayments = await BankPaymentType.find({ userId: 1000 }).sort({
        createdAt: -1,
      });
    } else {
      // Fetch payments for the specified userId with activationStatus: true
      bankPayments = await BankPaymentType.find({
        userId: numericUserId,
        activationStatus: true,
      }).sort({ createdAt: -1 });

      if (bankPayments.length === 0) {
        // If no active payments found, fetch all payments for userId 1000
        bankPayments = await BankPaymentType.find({ userId: 1000 }).sort({
          createdAt: -1,
        });
      }
    }

    res.status(200).json({
      success: true,
      count: bankPayments.length,
      payments: bankPayments,
    });
  } catch (error) {
    return next(
      new ErrorHandler("An error occurred while fetching bank payments", 500)
    );
  }
});

const updateBankActivationStatus = asyncError(async (req, res, next) => {
  const { id } = req.params;
  const { activationStatus } = req.body;

  if (typeof activationStatus !== "boolean") {
    return next(new ErrorHandler("activationStatus must be a boolean", 400));
  }

  try {
    // 1️⃣ Find the bank payment and get userId
    const bankPayment = await BankPaymentType.findById(id);
    if (!bankPayment) {
      return next(new ErrorHandler("Bank Payment not found", 404));
    }

    //  Finally, update the activationStatus of the bank payment
    const updatedDocument = await BankPaymentType.findByIdAndUpdate(
      id,
      { activationStatus, paymentStatus: "Approved" },
      { new: true, runValidators: true }
    );

    if (!updatedDocument) {
      return next(new ErrorHandler("Failed to update activation status", 500));
    }

    res.status(200).json({
      success: true,
      message: "Activation status updated successfully",
      data: updatedDocument,
    });
  } catch (error) {
    console.error(error);
    return next(
      new ErrorHandler(
        "An error occurred while updating activation status",
        500
      )
    );
  }
});

const getPartnerBankList = asyncError(async (req, res, next) => {
  const { id } = req.params;

  // Find the recharge module by ID and populate the bankList
  const rechargeModule = await RechargeModule.findById(id).populate({
    path: "bankList",
    options: { sort: { createdAt: -1 } }, // Sort by descending order
  });

  if (!rechargeModule) {
    return next(new ErrorHandler("Recharge Module not found", 404));
  }

  res.status(200).json({
    success: true,
    bankList: rechargeModule.bankList,
  });
});

// PARTNER DELETING BANK DATA
const deleteSingleBank = asyncError(async (req, res, next) => {
  const { id } = req.params;

  // Step 1: Get the bank data using the id from the params
  const bankData = await BankPaymentType.findById(id);
  if (!bankData) {
    return next(new ErrorHandler("Bank Data not found", 404));
  }

  // Step 2: Get the userId from the bank data
  const { userId } = bankData;

  // Step 3: Get the partner data using userId and populate the rechargeModule
  const partner = await PartnerModule.findOne({ userId }).populate({
    path: "rechargeModule",
    populate: {
      path: "bankList", // Populate the bankList
    },
  });

  if (!partner || !partner.rechargeModule) {
    return next(new ErrorHandler("Partner or Recharge Module not found", 404));
  }

  const rechargeModule = partner.rechargeModule;

  // Step 4: Remove the bank data from the bankList inside rechargeModule
  const updatedBankList = rechargeModule.bankList.filter(
    (bank) => bank._id.toString() !== id
  );

  // Update the rechargeModule with the new bankList
  rechargeModule.bankList = updatedBankList;
  await rechargeModule.save();

  // Step 5: Delete the bank data from BankPaymentType
  await BankPaymentType.findByIdAndDelete(id);

  // Return success response
  res.status(200).json({
    success: true,
    message: "Bank Data successfully deleted and updated in Recharge Module",
  });
});

//  UPDATE PAYMENT STATUS OF BANK
const updateBankPaymentStatus = asyncError(async (req, res, next) => {
  const { id } = req.params;
  const { paymentStatus } = req.body;

  // Step 1: Find the BankPaymentType entry by ID
  const bankData = await BankPaymentType.findById(id);
  if (!bankData) {
    return next(new ErrorHandler("Bank Payment Type not found", 404));
  }

  // Step 2: Update the paymentStatus
  bankData.paymentStatus = paymentStatus;

  // Step 3: Save the updated document
  await bankData.save();

  // Return success response
  res.status(200).json({
    success: true,
    message: "Payment status updated successfully",
    updatedData: bankData,
  });
});

// FOR PAYPAL RECHARGE

const getUserPaypalPayments = asyncError(async (req, res, next) => {
  const { userId } = req.params;
  const numericUserId = Number(userId); // Convert userId to a number

  let paypalPayments = [];

  try {
    if (numericUserId === 1000) {
      // Fetch all payments for userId 1000
      paypalPayments = await PaypalPaymentType.find({ userId: 1000 }).sort({
        createdAt: -1,
      });
    } else {
      // Fetch payments for the specified userId with activationStatus: true
      paypalPayments = await PaypalPaymentType.find({
        userId: numericUserId,
        activationStatus: true,
      }).sort({ createdAt: -1 });

      if (paypalPayments.length === 0) {
        // If no active payments found, fetch all payments for userId 1000
        paypalPayments = await PaypalPaymentType.find({ userId: 1000 }).sort({
          createdAt: -1,
        });
      }
    }

    res.status(200).json({
      success: true,
      count: paypalPayments.length,
      payments: paypalPayments,
    });
  } catch (error) {
    return next(
      new ErrorHandler("An error occurred while fetching bank payments", 500)
    );
  }
});

const updatePaypalActivationStatus = asyncError(async (req, res, next) => {
  const { id } = req.params;
  const { activationStatus } = req.body;

  if (typeof activationStatus !== "boolean") {
    return next(new ErrorHandler("activationStatus must be a boolean", 400));
  }

  try {
    // 1️⃣ Find the bank payment and get userId
    const paypalPayment = await PaypalPaymentType.findById(id);
    if (!paypalPayment) {
      return next(new ErrorHandler("Paypal Payment not found", 404));
    }

    //  Finally, update the activationStatus of the bank payment
    const updatedDocument = await PaypalPaymentType.findByIdAndUpdate(
      id,
      { activationStatus, paymentStatus: "Approved" },
      { new: true, runValidators: true }
    );

    if (!updatedDocument) {
      return next(new ErrorHandler("Failed to update activation status", 500));
    }

    res.status(200).json({
      success: true,
      message: "Activation status updated successfully",
      data: updatedDocument,
    });
  } catch (error) {
    console.error(error);
    return next(
      new ErrorHandler(
        "An error occurred while updating activation status",
        500
      )
    );
  }
});

const getPartnerPaypalList = asyncError(async (req, res, next) => {
  const { id } = req.params;

  // Find the recharge module by ID and populate the bankList
  const rechargeModule = await RechargeModule.findById(id).populate({
    path: "paypalList",
    options: { sort: { createdAt: -1 } }, // Sort by descending order
  });

  if (!rechargeModule) {
    return next(new ErrorHandler("Recharge Module not found", 404));
  }

  res.status(200).json({
    success: true,
    paypalList: rechargeModule.paypalList,
  });
});

const deleteSinglePaypal = asyncError(async (req, res, next) => {
  const { id } = req.params;

  // Step 1: Get the bank data using the id from the params
  const paypalData = await PaypalPaymentType.findById(id);
  if (!paypalData) {
    return next(new ErrorHandler("Paypal Data not found", 404));
  }

  // Step 2: Get the userId from the bank data
  const { userId } = paypalData;

  // Step 3: Get the partner data using userId and populate the rechargeModule
  const partner = await PartnerModule.findOne({ userId }).populate({
    path: "rechargeModule",
    populate: {
      path: "paypalList", // Populate the bankList
    },
  });

  if (!partner || !partner.rechargeModule) {
    return next(new ErrorHandler("Partner or Recharge Module not found", 404));
  }

  const rechargeModule = partner.rechargeModule;

  // Step 4: Remove the bank data from the bankList inside rechargeModule
  const updatedPaypalList = rechargeModule.paypalList.filter(
    (bank) => bank._id.toString() !== id
  );

  // Update the rechargeModule with the new bankList
  rechargeModule.paypalList = updatedPaypalList;
  await rechargeModule.save();

  // Step 5: Delete the bank data from PaypalPaymentType
  await PaypalPaymentType.findByIdAndDelete(id);

  // Return success response
  res.status(200).json({
    success: true,
    message: "Paypal Data successfully deleted and updated in Recharge Module",
  });
});

const updatePaypalPaymentStatus = asyncError(async (req, res, next) => {
  const { id } = req.params;
  const { paymentStatus } = req.body;

  // Step 1: Find the BankPaymentType entry by ID
  const bankData = await PaypalPaymentType.findById(id);
  if (!bankData) {
    return next(new ErrorHandler("Bank Payment Type not found", 404));
  }

  // Step 2: Update the paymentStatus
  bankData.paymentStatus = paymentStatus;

  // Step 3: Save the updated document
  await bankData.save();

  // Return success response
  res.status(200).json({
    success: true,
    message: "Payment status updated successfully",
    updatedData: bankData,
  });
});

// FOR SKRILL RECHARGE

const getUserSkrillPayments = asyncError(async (req, res, next) => {
  const { userId } = req.params;
  const numericUserId = Number(userId); // Convert userId to a number

  let skrillPayments = [];

  try {
    if (numericUserId === 1000) {
      // Fetch all payments for userId 1000
      skrillPayments = await SkrillPaymentType.find({ userId: 1000 }).sort({
        createdAt: -1,
      });
    } else {
      // Fetch payments for the specified userId with activationStatus: true
      skrillPayments = await SkrillPaymentType.find({
        userId: numericUserId,
        activationStatus: true,
      }).sort({ createdAt: -1 });

      if (skrillPayments.length === 0) {
        // If no active payments found, fetch all payments for userId 1000
        skrillPayments = await SkrillPaymentType.find({ userId: 1000 }).sort({
          createdAt: -1,
        });
      }
    }

    res.status(200).json({
      success: true,
      count: skrillPayments.length,
      payments: skrillPayments,
    });
  } catch (error) {
    return next(
      new ErrorHandler("An error occurred while fetching bank payments", 500)
    );
  }
});

const updateSkrillActivationStatus = asyncError(async (req, res, next) => {
  const { id } = req.params;
  const { activationStatus } = req.body;

  if (typeof activationStatus !== "boolean") {
    return next(new ErrorHandler("activationStatus must be a boolean", 400));
  }

  try {
    // 1️⃣ Find the bank payment and get userId
    const skrillPayment = await SkrillPaymentType.findById(id);
    if (!skrillPayment) {
      return next(new ErrorHandler("Skrill Payment not found", 404));
    }

    //  Finally, update the activationStatus of the bank payment
    const updatedDocument = await SkrillPaymentType.findByIdAndUpdate(
      id,
      { activationStatus, paymentStatus: "Approved" },
      { new: true, runValidators: true }
    );

    if (!updatedDocument) {
      return next(new ErrorHandler("Failed to update activation status", 500));
    }

    res.status(200).json({
      success: true,
      message: "Activation status updated successfully",
      data: updatedDocument,
    });
  } catch (error) {
    console.error(error);
    return next(
      new ErrorHandler(
        "An error occurred while updating activation status",
        500
      )
    );
  }
});

const getPartnerSkrillList = asyncError(async (req, res, next) => {
  const { id } = req.params;

  // Find the recharge module by ID and populate the bankList
  const rechargeModule = await RechargeModule.findById(id).populate({
    path: "skrillList",
    options: { sort: { createdAt: -1 } }, // Sort by descending order
  });

  if (!rechargeModule) {
    return next(new ErrorHandler("Recharge Module not found", 404));
  }

  res.status(200).json({
    success: true,
    skrillList: rechargeModule.skrillList,
  });
});

const deleteSingleSkrill = asyncError(async (req, res, next) => {
  const { id } = req.params;

  // Step 1: Get the bank data using the id from the params
  const skrillData = await SkrillPaymentType.findById(id);
  if (!skrillData) {
    return next(new ErrorHandler("Skrill Data not found", 404));
  }

  // Step 2: Get the userId from the bank data
  const { userId } = skrillData;

  // Step 3: Get the partner data using userId and populate the rechargeModule
  const partner = await PartnerModule.findOne({ userId }).populate({
    path: "rechargeModule",
    populate: {
      path: "skrillList", // Populate the bankList
    },
  });

  if (!partner || !partner.rechargeModule) {
    return next(new ErrorHandler("Partner or Recharge Module not found", 404));
  }

  const rechargeModule = partner.rechargeModule;

  // Step 4: Remove the bank data from the bankList inside rechargeModule
  const updatedSkrillList = rechargeModule.skrillList.filter(
    (bank) => bank._id.toString() !== id
  );

  // Update the rechargeModule with the new bankList
  rechargeModule.skrillList = updatedSkrillList;
  await rechargeModule.save();

  // Step 5: Delete the bank data from PaypalPaymentType
  await SkrillPaymentType.findByIdAndDelete(id);

  // Return success response
  res.status(200).json({
    success: true,
    message: "Skrill Data successfully deleted and updated in Recharge Module",
  });
});

const updateSkrillPaymentStatus = asyncError(async (req, res, next) => {
  const { id } = req.params;
  const { paymentStatus } = req.body;

  // Step 1: Find the BankPaymentType entry by ID
  const bankData = await SkrillPaymentType.findById(id);
  if (!bankData) {
    return next(new ErrorHandler("Skrill Payment Type not found", 404));
  }

  // Step 2: Update the paymentStatus
  bankData.paymentStatus = paymentStatus;

  // Step 3: Save the updated document
  await bankData.save();

  // Return success response
  res.status(200).json({
    success: true,
    message: "Payment status updated successfully",
    updatedData: bankData,
  });
});

// FOR UPI RECHARGE

const getUserUpiPayments = asyncError(async (req, res, next) => {
  const { userId } = req.params;
  const numericUserId = Number(userId); // Convert userId to a number

  let upiPayments = [];

  try {
    if (numericUserId === 1000) {
      // Fetch all payments for userId 1000
      upiPayments = await UpiPaymentType.find({ userId: 1000 }).sort({
        createdAt: -1,
      });
    } else {
      // Fetch payments for the specified userId with activationStatus: true
      upiPayments = await UpiPaymentType.find({
        userId: numericUserId,
        activationStatus: true,
      }).sort({ createdAt: -1 });

      if (upiPayments.length === 0) {
        // If no active payments found, fetch all payments for userId 1000
        upiPayments = await UpiPaymentType.find({ userId: 1000 }).sort({
          createdAt: -1,
        });
      }
    }

    res.status(200).json({
      success: true,
      count: upiPayments.length,
      payments: upiPayments,
    });
  } catch (error) {
    return next(
      new ErrorHandler("An error occurred while fetching bank payments", 500)
    );
  }
});

const updateUpiActivationStatus = asyncError(async (req, res, next) => {
  const { id } = req.params;
  const { activationStatus } = req.body;

  if (typeof activationStatus !== "boolean") {
    return next(new ErrorHandler("activationStatus must be a boolean", 400));
  }

  try {
    // 1️⃣ Find the bank payment and get userId
    const upiPayment = await UpiPaymentType.findById(id);
    if (!upiPayment) {
      return next(new ErrorHandler("Upi Payment not found", 404));
    }

    //  Finally, update the activationStatus of the bank payment
    const updatedDocument = await UpiPaymentType.findByIdAndUpdate(
      id,
      { activationStatus, paymentStatus: "Approved" },
      { new: true, runValidators: true }
    );

    if (!updatedDocument) {
      return next(new ErrorHandler("Failed to update activation status", 500));
    }

    res.status(200).json({
      success: true,
      message: "Activation status updated successfully",
      data: updatedDocument,
    });
  } catch (error) {
    console.error(error);
    return next(
      new ErrorHandler(
        "An error occurred while updating activation status",
        500
      )
    );
  }
});

const getPartnerUpiList = asyncError(async (req, res, next) => {
  const { id } = req.params;

  // Find the recharge module by ID and populate the bankList
  const rechargeModule = await RechargeModule.findById(id).populate({
    path: "upiList",
    options: { sort: { createdAt: -1 } }, // Sort by descending order
  });

  if (!rechargeModule) {
    return next(new ErrorHandler("Recharge Module not found", 404));
  }

  res.status(200).json({
    success: true,
    upiList: rechargeModule.upiList,
  });
});

const deleteSingleUpi = asyncError(async (req, res, next) => {
  const { id } = req.params;

  // Step 1: Get the bank data using the id from the params
  const upiData = await UpiPaymentType.findById(id);
  if (!upiData) {
    return next(new ErrorHandler("Upi Data not found", 404));
  }

  // Step 2: Get the userId from the bank data
  const { userId } = upiData;

  // Step 3: Get the partner data using userId and populate the rechargeModule
  const partner = await PartnerModule.findOne({ userId }).populate({
    path: "rechargeModule",
    populate: {
      path: "upiList", // Populate the bankList
    },
  });

  if (!partner || !partner.rechargeModule) {
    return next(new ErrorHandler("Partner or Recharge Module not found", 404));
  }

  const rechargeModule = partner.rechargeModule;

  // Step 4: Remove the bank data from the bankList inside rechargeModule
  const updatedOtherList = rechargeModule.upiList.filter(
    (bank) => bank._id.toString() !== id
  );

  // Update the rechargeModule with the new bankList
  rechargeModule.upiList = updatedUpiList;
  await rechargeModule.save();

  // Step 5: Delete the bank data from PaypalPaymentType
  await UpiPaymentType.findByIdAndDelete(id);

  // Return success response
  res.status(200).json({
    success: true,
    message: "Upi Data successfully deleted and updated in Recharge Module",
  });
});

const updateUpiPaymentStatus = asyncError(async (req, res, next) => {
  const { id } = req.params;
  const { paymentStatus } = req.body;

  // Step 1: Find the BankPaymentType entry by ID
  const upiData = await UpiPaymentType.findById(id);
  if (!upiData) {
    return next(new ErrorHandler("Upi Payment Type not found", 404));
  }

  // Step 2: Update the paymentStatus
  upiData.paymentStatus = paymentStatus;

  // Step 3: Save the updated document
  await upiData.save();

  // Return success response
  res.status(200).json({
    success: true,
    message: "Payment status updated successfully",
    updatedData: upiData,
  });
});

// FOR CRYPTO RECHARGE

const getUserCryptoPayments = asyncError(async (req, res, next) => {
  const { userId } = req.params;
  const numericUserId = Number(userId); // Convert userId to a number

  let cryptoPayments = [];

  try {
    if (numericUserId === 1000) {
      // Fetch all payments for userId 1000
      cryptoPayments = await CryptoPaymentType.find({ userId: 1000 }).sort({
        createdAt: -1,
      });
    } else {
      // Fetch payments for the specified userId with activationStatus: true
      cryptoPayments = await CryptoPaymentType.find({
        userId: numericUserId,
        activationStatus: true,
      }).sort({ createdAt: -1 });

      if (cryptoPayments.length === 0) {
        // If no active payments found, fetch all payments for userId 1000
        cryptoPayments = await CryptoPaymentType.find({ userId: 1000 }).sort({
          createdAt: -1,
        });
      }
    }

    res.status(200).json({
      success: true,
      count: cryptoPayments.length,
      payments: cryptoPayments,
    });
  } catch (error) {
    return next(
      new ErrorHandler("An error occurred while fetching bank payments", 500)
    );
  }
});

const updateCryptoActivationStatus = asyncError(async (req, res, next) => {
  const { id } = req.params;
  const { activationStatus } = req.body;

  if (typeof activationStatus !== "boolean") {
    return next(new ErrorHandler("activationStatus must be a boolean", 400));
  }

  try {
    // 1️⃣ Find the bank payment and get userId
    const cryptoPayment = await CryptoPaymentType.findById(id);
    if (!cryptoPayment) {
      return next(new ErrorHandler("Crypto Payment not found", 404));
    }

    //  Finally, update the activationStatus of the bank payment
    const updatedDocument = await CryptoPaymentType.findByIdAndUpdate(
      id,
      { activationStatus, paymentStatus: "Approved" },
      { new: true, runValidators: true }
    );

    if (!updatedDocument) {
      return next(new ErrorHandler("Failed to update activation status", 500));
    }

    res.status(200).json({
      success: true,
      message: "Activation status updated successfully",
      data: updatedDocument,
    });
  } catch (error) {
    console.error(error);
    return next(
      new ErrorHandler(
        "An error occurred while updating activation status",
        500
      )
    );
  }
});

const getPartnerCryptoList = asyncError(async (req, res, next) => {
  const { id } = req.params;

  // Find the recharge module by ID and populate the bankList
  const rechargeModule = await RechargeModule.findById(id).populate({
    path: "cryptoList",
    options: { sort: { createdAt: -1 } }, // Sort by descending order
  });

  if (!rechargeModule) {
    return next(new ErrorHandler("Recharge Module not found", 404));
  }

  res.status(200).json({
    success: true,
    cryptoList: rechargeModule.cryptoList,
  });
});

const deleteSingleCrypto = asyncError(async (req, res, next) => {
  const { id } = req.params;

  // Step 1: Get the bank data using the id from the params
  const cryptoData = await CryptoPaymentType.findById(id);
  if (!cryptoData) {
    return next(new ErrorHandler("Crypto Data not found", 404));
  }

  // Step 2: Get the userId from the bank data
  const { userId } = cryptoData;

  // Step 3: Get the partner data using userId and populate the rechargeModule
  const partner = await PartnerModule.findOne({ userId }).populate({
    path: "rechargeModule",
    populate: {
      path: "cryptoList", // Populate the bankList
    },
  });

  if (!partner || !partner.rechargeModule) {
    return next(new ErrorHandler("Partner or Recharge Module not found", 404));
  }

  const rechargeModule = partner.rechargeModule;

  // Step 4: Remove the bank data from the bankList inside rechargeModule
  const updatedCryptoList = rechargeModule.cryptoList.filter(
    (bank) => bank._id.toString() !== id
  );

  // Update the rechargeModule with the new bankList
  rechargeModule.cryptoList = updatedCryptoList;
  await rechargeModule.save();

  // Step 5: Delete the bank data from PaypalPaymentType
  await CryptoPaymentType.findByIdAndDelete(id);

  // Return success response
  res.status(200).json({
    success: true,
    message: "Crypto Data successfully deleted and updated in Recharge Module",
  });
});

const updateCryptoPaymentStatus = asyncError(async (req, res, next) => {
  const { id } = req.params;
  const { paymentStatus } = req.body;

  // Step 1: Find the BankPaymentType entry by ID
  const cryptoData = await CryptoPaymentType.findById(id);
  if (!cryptoData) {
    return next(new ErrorHandler("Crypto Payment Type not found", 404));
  }

  // Step 2: Update the paymentStatus
  cryptoData.paymentStatus = paymentStatus;

  // Step 3: Save the updated document
  await cryptoData.save();

  // Return success response
  res.status(200).json({
    success: true,
    message: "Payment status updated successfully",
    updatedData: cryptoData,
  });
});

// [ FOR OTHER PAYMENT OPTIONS]

const getUserOtherPayments = asyncError(async (req, res, next) => {
  const { userId } = req.params;
  const numericUserId = Number(userId); // Convert userId to a number

  let otherPayments = [];

  try {
    if (numericUserId === 1000) {
      // Fetch all payments for userId 1000
      otherPayments = await OtherPayment.find({ userId: 1000 }).sort({
        createdAt: -1,
      });
    } else {
      // Fetch payments for the specified userId with activationStatus: true
      otherPayments = await OtherPayment.find({
        userId: numericUserId,
        activationStatus: true,
      }).sort({ createdAt: -1 });

      if (otherPayments.length === 0) {
        // If no active payments found, fetch all payments for userId 1000
        otherPayments = await OtherPayment.find({ userId: 1000 }).sort({
          createdAt: -1,
        });
      }
    }

    res.status(200).json({
      success: true,
      count: otherPayments.length,
      payments: otherPayments,
    });
  } catch (error) {
    return next(
      new ErrorHandler("An error occurred while fetching bank payments", 500)
    );
  }
});

const updateOtherActivationStatus = asyncError(async (req, res, next) => {
  const { id } = req.params;
  const { activationStatus } = req.body;

  if (typeof activationStatus !== "boolean") {
    return next(new ErrorHandler("activationStatus must be a boolean", 400));
  }

  try {
    // 1️⃣ Find the bank payment and get userId
    const otherPayment = await OtherPayment.findById(id);
    if (!otherPayment) {
      return next(new ErrorHandler("Other Payment not found", 404));
    }

    //  Finally, update the activationStatus of the bank payment
    const updatedDocument = await OtherPayment.findByIdAndUpdate(
      id,
      { activationStatus, paymentStatus: "Approved" },
      { new: true, runValidators: true }
    );

    if (!updatedDocument) {
      return next(new ErrorHandler("Failed to update activation status", 500));
    }

    res.status(200).json({
      success: true,
      message: "Activation status updated successfully",
      data: updatedDocument,
    });
  } catch (error) {
    console.error(error);
    return next(
      new ErrorHandler(
        "An error occurred while updating activation status",
        500
      )
    );
  }
});

const getPartnerOtherList = asyncError(async (req, res, next) => {
  const { id } = req.params;

  // Find the recharge module by ID and populate the bankList
  const rechargeModule = await RechargeModule.findById(id).populate({
    path: "otherList",
    options: { sort: { createdAt: -1 } }, // Sort by descending order
  });

  if (!rechargeModule) {
    return next(new ErrorHandler("Recharge Module not found", 404));
  }

  res.status(200).json({
    success: true,
    otherList: rechargeModule.otherList,
  });
});

const deleteSingleOther = asyncError(async (req, res, next) => {
  const { id } = req.params;

  // Step 1: Get the bank data using the id from the params
  const otherData = await OtherPayment.findById(id);
  if (!otherData) {
    return next(new ErrorHandler("Other Data not found", 404));
  }

  // Step 2: Get the userId from the bank data
  const { userId } = otherData;

  // Step 3: Get the partner data using userId and populate the rechargeModule
  const partner = await PartnerModule.findOne({ userId }).populate({
    path: "rechargeModule",
    populate: {
      path: "otherList", // Populate the bankList
    },
  });

  if (!partner || !partner.rechargeModule) {
    return next(new ErrorHandler("Partner or Recharge Module not found", 404));
  }

  const rechargeModule = partner.rechargeModule;

  // Step 4: Remove the bank data from the bankList inside rechargeModule
  const updatedOtherList = rechargeModule.otherList.filter(
    (bank) => bank._id.toString() !== id
  );

  // Update the rechargeModule with the new bankList
  rechargeModule.otherList = updatedOtherList;
  await rechargeModule.save();

  // Step 5: Delete the bank data from PaypalPaymentType
  await OtherPayment.findByIdAndDelete(id);

  // Return success response
  res.status(200).json({
    success: true,
    message: "Other Data successfully deleted and updated in Recharge Module",
  });
});

const updateOtherPaymentStatus = asyncError(async (req, res, next) => {
  const { id } = req.params;
  const { paymentStatus } = req.body;

  // Step 1: Find the BankPaymentType entry by ID
  const otherData = await OtherPayment.findById(id);
  if (!otherData) {
    return next(new ErrorHandler("Other Payment Type not found", 404));
  }

  // Step 2: Update the paymentStatus
  otherData.paymentStatus = paymentStatus;

  // Step 3: Save the updated document
  await otherData.save();

  // Return success response
  res.status(200).json({
    success: true,
    message: "Payment status updated successfully",
    updatedData: otherData,
  });
});

// TO GET THE SINGLE LATEST POWERBALL RESULT
const getLatestPowerResult = asyncError(async (req, res, next) => {
  try {
    // Fetch the latest PowerResult by sorting in descending order based on createdAt
    const latestPowerResult = await powerresult
      .findOne()
      .sort({ createdAt: -1 })
      .populate("powerdate powertime");

    // Check if a document exists
    if (!latestPowerResult) {
      return res.status(404).json({
        success: false,
        message: "No PowerResult found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Latest PowerResult retrieved successfully",
      data: latestPowerResult,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve latest PowerResult",
      error: error.message,
    });
  }
});

const getPowerResultByTimeAndDate = asyncError(async (req, res, next) => {
  try {
    const { powertimeid, powerdateid } = req.params;

    // Fetch the PowerResult based on powertimeid and powerdateid
    const powerResult = await powerresult
      .findOne({ powertime: powertimeid, powerdate: powerdateid })
      .populate("powerdate powertime");

    // Check if a document exists
    if (!powerResult) {
      return res.status(404).json({
        success: false,
        message: "No PowerResult found for the given powertime and powerdate",
      });
    }

    res.status(200).json({
      success: true,
      message: "PowerResult retrieved successfully",
      data: powerResult,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve PowerResult",
      error: error.message,
    });
  }
});

module.exports = {
  getPowerResultByTimeAndDate,
  getUserOtherPayments,
  updateOtherActivationStatus,
  getPartnerOtherList,
  deleteSingleOther,
  updateOtherPaymentStatus,
  getLatestPowerResult,
  searchPowerBet,
  addPowerBet,
  updateLiveResultAndTimerForTime,
  getUserCryptoPayments,
  updateCryptoActivationStatus,
  getPartnerCryptoList,
  deleteSingleCrypto,
  updateCryptoPaymentStatus,
  getUserUpiPayments,
  updateUpiActivationStatus,
  getPartnerUpiList,
  deleteSingleUpi,
  updateUpiPaymentStatus,
  updateSkrillPaymentStatus,
  deleteSingleSkrill,
  getPartnerSkrillList,
  getUserSkrillPayments,
  updateSkrillActivationStatus,
  getUserPaypalPayments,
  updatePaypalActivationStatus,
  getPartnerPaypalList,
  deleteSinglePaypal,
  updatePaypalPaymentStatus,
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
  deletePlayzone,
  getAppBalanceSheet,
  getAllResultsByLocationWithTimes,
  getAllResultsByLocationWithDates,
  updateAppLinks,
  getAppLinks,
  deleteAppLinks,
  getSingleUserPlaybetHistory,
  getAllResultsByLocationWithTimesMonthYear,
  getAllTopWinner,
  getResultAccordingToLocationTY,
  addPartnerPerformance,
  getSinglePartnerPerformance,
  getUserBankPayments,
  updateBankActivationStatus,
  getPartnerBankList,
  deleteSingleBank,
  updateBankPaymentStatus,
  updateShowPartnerRechargeToUserAndPartner,
  deactivateShowPartnerRechargeToUserAndPartner,
  createPowerResult,
  getAllPowerBallResultsByLocationWithTimesMonthYear,
  addOtherPayment,
  getAllOtherPayments,
  deleteOtherPayment,
  getSinglePartnerPerformancePowerball,
  updateLiveResultAndTimerForTimeForPowerball,
  getUPIPaymentsByUserId,
  getBankPaymentsByUserId,
  getPaypalPaymentsByUserId,
  getCryptoPaymentsByUserId,
  getSkrillPaymentsByUserId,
  getOtherPaymentsByUserId,
  getAllPendingPaymentsCount,
  getAppBalanceSheetByUserId,
};
