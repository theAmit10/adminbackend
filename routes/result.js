const express = require("express");
const {
  isAdmin,
  isAuthenticated
} = require("../middlewares/auth.js");
const {
  addLotDate,
  addLotLocatin,
  addLotTime,
  createResult,
  deleteLotDate,
  deleteLotLocation,
  deleteLotTime,
  deleteResult,
  getAllLotDate,
  getAllLotDateAccordindLocationAndTime,
  getAllLotLocation,
  getAllLotTime,
  getAllLotTimeAccordindLocation,
  getAllResult,
  getAllResultAccordingToDateTimeLocation,
  getAllResultAccordingToLocation,
  getNextResult,
  getResultDetails,
  updateDate,
  updateLocation,
  updateResult,
  updateTime,
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
  createCurrency,
  getAllCurrencies,
  updateCurrency,
  deleteCurrency,
  getAllLotLocationWithTimes,
  deletePlayzone,
  getAppBalanceSheet
} = require("../controllers/result.js");
const { singleUpload } = require("../middlewares/multer.js");
const { singleUploadForCurrency } = require("../middlewares/currencymiddleware.js");
const { singleUploadForUPIQrCode } = require("../middlewares/upiqrcodemiddleware.js");
const { singleUploadForCryptoQrCode } = require("../middlewares/cryptoqrcodemiddleware.js");


const router = express.Router();

// All Routes
router.get("/allresult", isAuthenticated, getAllResult);
router.route("/single/:id").get(isAuthenticated, getResultDetails).put(isAuthenticated, updateResult);
router.post("/createresult", isAuthenticated, createResult);
router.get("/searchresult", isAuthenticated, getAllResultAccordingToDateTimeLocation);
router.get("/allresultlocation", isAuthenticated, getAllResultAccordingToLocation);
router.get("/nextresult", isAuthenticated, getNextResult);
router.delete("/removeresult/:id", isAuthenticated, deleteResult);

// for LotDates
router.post("/addlotdate", isAuthenticated, addLotDate);
router.get("/alllotdate", isAuthenticated, getAllLotDate);
router.delete("/removelotdate/:id", isAuthenticated, deleteLotDate);
router.put("/updatelotdate/:id", isAuthenticated, updateDate);
router.get("/searchdate", isAuthenticated, getAllLotDateAccordindLocationAndTime);

// for LotTimes
router.post("/addlottime", isAuthenticated, addLotTime);
router.get("/alllottime", isAuthenticated, getAllLotTime);
router.delete("/removelottime/:id", isAuthenticated, deleteLotTime);
router.put("/updatelottime/:id", isAuthenticated, updateTime);
router.get("/searchtime", isAuthenticated, getAllLotTimeAccordindLocation);

// for LotLocation
router.post("/addlotlocation", isAuthenticated, addLotLocatin);
router.get("/alllotlocation", isAuthenticated, getAllLotLocation);
router.get("/alllotlocationwithtime", isAuthenticated, getAllLotLocationWithTimes);
router.delete("/removelotlocation/:id", isAuthenticated, deleteLotLocation);
router.put("/updatelotlocation/:id", isAuthenticated, updateLocation);


// FOR PAYMENT
router.post("/addpayment", isAuthenticated, addPayment);
router.get("/allpaymets", isAuthenticated, getAllPayments);
router.delete("/removepayment/:id", isAuthenticated, deletePayment);

// FOR  UPI PAYMENT
router.post("/addupipayment", isAuthenticated, singleUploadForUPIQrCode, addUpiPayment);
router.get("/allupipaymets", isAuthenticated, getAllUPIPayments);
router.delete("/removeupipayment/:id", isAuthenticated, deleteUPIPayment);

// FOR  BANK PAYMENT
router.post("/addbankpayment", isAuthenticated, addBankPayment);
router.get("/allbankpaymets", isAuthenticated, getAllBankPayments);
router.delete("/removebankpayment/:id", isAuthenticated, deleteBankPayment);

// FOR  PAYPAL PAYMENT
router.post("/addpaypalpayment", isAuthenticated, addPaypalPayment);
router.get("/allpaypalpaymets", isAuthenticated, getAllPaypalPayments);
router.delete("/removepaypalpayment/:id", isAuthenticated, deletePaypalPayment);

// FOR  CRYPTO PAYMENT
router.post("/addcryptopayment", isAuthenticated,singleUploadForCryptoQrCode, addCryptoPayment);
router.get("/allcryptopaymets", isAuthenticated, getAllCryptoPayments);
router.delete("/removecryptopayment/:id", isAuthenticated, deleteCryptoPayment);


// FOR  SKRILL PAYMENT
router.post("/addskrillpayment", isAuthenticated, addSkrillPayment);
router.get("/allskrillpaymets", isAuthenticated, getAllSkrillPayments);
router.delete("/removeskrillpayment/:id", isAuthenticated, deleteSkrillPayment);

// FOR PLAYZONE
router.post("/addplay", isAuthenticated, addPlayzone);
router.get("/allplay", isAuthenticated, getAllPlay);
router.delete("/removeplayzone/:id", isAuthenticated, deletePlayzone);

// TO GET A SINGLE PLAY 
router.get('/playzone/singleplay',isAuthenticated, getSinglePlayzone);
router.get("/allplaysingleuser", isAuthenticated, getUserPlayHistory);

router.put("/playzone/:id/playnumber/:playnumber",isAuthenticated, updatePlaynumber);
router.post("/playzone/:id/playnumber/:playnumber/users",isAuthenticated, addUserToPlaynumber);


// ADDING GAME BETTING
router.post('/playbet/addplybet',isAuthenticated, addPlaybet);
router.get('/singleuser/playbets', isAuthenticated, getUserPlaybets);

// FOR CURRECY
// Create a new currency
router.post('/addcurrency', isAuthenticated,singleUploadForCurrency, createCurrency);
// Get all currencies
router.get('/allcurrencies',  getAllCurrencies);
// Update a currency
router.put('/updatecurrency/:id', isAuthenticated, updateCurrency);
// Delete a currency
router.delete('/removecurrency/:id', isAuthenticated, deleteCurrency);

// GET APP BALANCE SHEET
router.get("/balancesheet", isAuthenticated, getAppBalanceSheet);




module.exports = router;




// const express = require("express");
// const {
//   isAdmin,
//   isAuthenticated
// } = require("../middlewares/auth.js");
// const {
//   addLotDate,
//   addLotLocatin,
//   addLotTime,
//   createResult,
//   deleteLotDate,
//   deleteLotLocation,
//   deleteLotTime,
//   deleteResult,
//   getAllLotDate,
//   getAllLotDateAccordindLocationAndTime,
//   getAllLotLocation,
//   getAllLotTime,
//   getAllLotTimeAccordindLocation,
//   getAllResult,
//   getAllResultAccordingToDateTimeLocation,
//   getAllResultAccordingToLocation,
//   getNextResult,
//   getResultDetails,
//   updateDate,
//   updateLocation,
//   updateResult,
//   updateTime
// } = require("../controllers/result.js");

// const router = express.Router();

// // All Routes
// router.get("/allresult", isAuthenticated, getAllResult);
// router.route("/single/:id").get(isAuthenticated, getResultDetails).put(isAuthenticated, updateResult);
// router.post("/createresult", isAuthenticated, createResult);
// router.get("/searchresult", isAuthenticated, getAllResultAccordingToDateTimeLocation);
// router.get("/allresultlocation", isAuthenticated, getAllResultAccordingToLocation);
// router.get("/nextresult", isAuthenticated, getNextResult);
// router.delete("/removeresult/:id", isAuthenticated, deleteResult);

// // for LotDates
// router.post("/addlotdate", isAuthenticated, addLotDate);
// router.get("/alllotdate", isAuthenticated, getAllLotDate);
// router.delete("/removelotdate/:id", isAuthenticated, deleteLotDate);
// router.put("/updatelotdate/:id", isAuthenticated, updateDate);
// router.get("/searchdate", isAuthenticated, getAllLotDateAccordindLocationAndTime);

// // for LotTimes
// router.post("/addlottime", isAuthenticated, addLotTime);
// router.get("/alllottime", isAuthenticated, getAllLotTime);
// router.delete("/removelottime/:id", isAuthenticated, deleteLotTime);
// router.put("/updatelottime/:id", isAuthenticated, updateTime);
// router.get("/searchtime", isAuthenticated, getAllLotTimeAccordindLocation);

// // for LotLocation
// router.post("/addlotlocation", isAuthenticated, addLotLocatin);
// router.get("/alllotlocation", isAuthenticated, getAllLotLocation);
// router.delete("/removelotlocation/:id", isAuthenticated, deleteLotLocation);
// router.put("/updatelotlocation/:id", isAuthenticated, updateLocation);

// module.exports = router;
