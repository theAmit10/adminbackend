const asyncError = require("../middlewares/error.js").asyncError;
const  Result  = require("../models/result.js");
const ErrorHandler = require("../utils/error.js");
const  LotDate  = require("../models/lotdate.js");
const  LotTime  = require("../models/lottime.js");
const  LotLocation  = require("../models/lotlocation.js");
const PaymentType = require("../models/paymenttype.js");
const mongoose = require('mongoose');
const moment = require("moment");
const paymenttype = require("../models/paymenttype.js");
const UpiPaymentType = require("../models/upipayment.js")
const BankPaymentType = require("../models/bankpayment.js")
const PaypalPaymentType = require("../models/paypalpayment.js")
const CryptoPaymentType = require("../models/cryptopayment.js")
const SkrillPaymentType = require("../models/skrillpayment.js")

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



const getNextResult = asyncError(
  async (req, res, next) => {
    const { locationid } = req.query;

    // Get current date and time
    const currentDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
    const currentTime = new Date().toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit' });

    console.log("Current Date:", currentDate);
    console.log("Current Time:", currentTime);

    let results = await Result.find({})
      .populate("lotdate")
      .populate("lottime")
      .populate("lotlocation");

    console.log("All Results:", results.length);

    // Filter results based on current date and time
    results = results.filter(item => {
      const lotDate = item.lotdate.lotdate;
      const lotTime = item.lottime.lottime;

      console.log("Lot Date:", lotDate," Lot Time:", lotTime);
    
      // Check if lotdate is same as current date and lottime is greater than or equal to current time
      return lotDate === currentDate && (lotTime >= currentTime || !item.lotdate.lotdate);
    });

    console.log("Filtered Results:", results);

   
    if (locationid) {
      results = results.filter(item => {
          // Log the values and types for debugging
          console.log("Query locationid length :: ", locationid.length," :: ",locationid);
        
          console.log("item.lotlocation._id.toString():", item.lotlocation._id.toString().length," :: ",item.lotlocation._id.toString());

          console.log("Status === :: ",item.lotlocation._id.toString() === locationid)
       
  
          // Compare locationid with item.lotlocation._id as strings
          return item.lotlocation._id.toString() === locationid;
      });

     
  }

console.log("Final result length:", results.length);

    res.status(200).json({
      success: true,
      results,
    });
  }
);



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
  const { resultNumber, lotdate, lottime, lotlocation,nextresulttime } = req.body;
  // if (!result) return next(new ErrorHandler("Result not found", 404))
  await Result.create({
    resultNumber,
    lotdate,
    lottime,
    lotlocation,
    nextresulttime
  });

  res.status(200).json({
    success: true,
    message: "Result Created Successfully",
  });
});

const updateResult = asyncError(async (req, res, next) => {
  const { resultNumber,nextresulttime } = req.body;

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
  const lotdates = await LotDate.find({}).populate("lottime").sort({ createdAt: -1 });
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

const getAllLotTimeAccordindLocation = asyncError(
  async (req, res, next) => {
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
  }
);

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

  const { lotlocation, maximumRange } = req.body;

  if (!lotlocation) return next(new ErrorHandler("enter lotlocation missing", 404));
  if (!maximumRange) return next(new ErrorHandler("enter maximum range", 404));

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
  const { lotlocation,locationTitle, locationDescription } = req.body;

  const llocation = await LotLocation.findById(req.params.id);

  if (!llocation) return next(new ErrorHandler("Location not found", 404));

  if (lotlocation) llocation.lotlocation = lotlocation;
  if (locationTitle) llocation.locationTitle = locationTitle;
  if (locationDescription) llocation.locationDescription = locationDescription;

  await llocation.save();

  res.status(200).json({
    success: true,
    message: "Location Updated Successfully",
  });
});



// ##############################
// PAYMENT 
// ##############################

const addPayment = asyncError(async (req, res, next) => {
  const { paymentName } = req.body;

  if (!paymentName) return next(new ErrorHandler("Payment name is missing", 404));

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
  const { upiholdername,upiid } = req.body;

  if (!upiholdername) return next(new ErrorHandler("UPI holder name is missing", 404));
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
  const { bankname,accountholdername,ifsccode,accountnumber } = req.body;

  if (!bankname) return next(new ErrorHandler("Bank name is missing", 404));
  if (!accountholdername) return next(new ErrorHandler("Account holder name is missing", 404));
  if (!ifsccode) return next(new ErrorHandler("IFSC code is missing", 404));
  if (!accountnumber) return next(new ErrorHandler("Account number is missing", 404));

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

  if (!emailaddress) return next(new ErrorHandler("Email address is missing", 404));
 

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
  const { walletaddress,networktype } = req.body;

  if (!walletaddress) return next(new ErrorHandler("Wallet address is missing", 404));
  if (!networktype) return next(new ErrorHandler("Network type is missing", 404));

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

  if (!address) return next(new ErrorHandler("Email address or phone number is missing", 404));


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





module.exports = {
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
  deleteSkrillPayment
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
