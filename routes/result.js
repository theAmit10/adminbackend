const express = require("express");
const { isAdmin, isAuthenticated } = require("../middlewares/auth.js");
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
  getSinglePartnerPerformance,
  getUserBankPayments,
  updateBankActivationStatus,
  getPartnerBankList,
  deleteSingleBank,
  updateBankPaymentStatus,
  updateShowPartnerRechargeToUserAndPartner,
  deactivateShowPartnerRechargeToUserAndPartner,
  getUserPaypalPayments,
  getPartnerPaypalList,
  updatePaypalActivationStatus,
  updatePaypalPaymentStatus,
  deleteSinglePaypal,
  deleteSingleSkrill,
  updateSkrillPaymentStatus,
  updateSkrillActivationStatus,
  getPartnerSkrillList,
  getUserSkrillPayments,
  deleteSingleCrypto,
  updateCryptoPaymentStatus,
  updateCryptoActivationStatus,
  getPartnerCryptoList,
  getUserCryptoPayments,
  deleteSingleUpi,
  updateUpiPaymentStatus,
  updateUpiActivationStatus,
  getPartnerUpiList,
  getUserUpiPayments,
  updateLiveResultAndTimerForTime,
  addPowerBet,
  searchPowerBet,
  createPowerResult,
  getAllPowerBallResultsByLocationWithTimesMonthYear,
  getLatestPowerResult,
  addOtherPayment,
  getAllOtherPayments,
  deleteOtherPayment,
  getUserOtherPayments,
  getPartnerOtherList,
  updateOtherActivationStatus,
  updateOtherPaymentStatus,
  deleteSingleOther,
  getPowerResultByTimeAndDate,
  getSinglePartnerPerformancePowerball,
} = require("../controllers/result.js");
const { singleUpload } = require("../middlewares/multer.js");
const {
  singleUploadForCurrency,
} = require("../middlewares/currencymiddleware.js");
const {
  singleUploadForUPIQrCode,
} = require("../middlewares/upiqrcodemiddleware.js");
const {
  singleUploadForCryptoQrCode,
} = require("../middlewares/cryptoqrcodemiddleware.js");
const {
  singleUploadForOtherPaymentQrCode,
} = require("../middlewares/otherpaymentqrcodemiddleware.js");

const router = express.Router();

// All Routes
router.get("/allresult", isAuthenticated, getAllResult);
router
  .route("/single/:id")
  .get(isAuthenticated, getResultDetails)
  .put(isAuthenticated, updateResult);
router.post("/createresult", isAuthenticated, createResult);
router.get("/singlepowerresult", isAuthenticated, getLatestPowerResult);
router.get(
  "/powerresultdatetime/:powertimeid/:powerdateid",
  isAuthenticated,
  getPowerResultByTimeAndDate
);
router.get(
  "/searchresult",
  isAuthenticated,
  getAllResultAccordingToDateTimeLocation
);
router.get(
  "/allresultlocation",
  isAuthenticated,
  getAllResultAccordingToLocation
);
router.get(
  "/allresultwithtime",
  isAuthenticated,
  getAllResultsByLocationWithTimes
);
router.get(
  "/allresultlocmonyear",
  isAuthenticated,
  getAllResultsByLocationWithTimesMonthYear
);
router.get(
  "/allpowerresultmonyear",
  isAuthenticated,
  getAllPowerBallResultsByLocationWithTimesMonthYear
);

router.get(
  "/allresultwithdate",
  isAuthenticated,
  getAllResultsByLocationWithDates
);
router.get("/nextresult", isAuthenticated, getNextResult);
router.delete("/removeresult/:id", isAuthenticated, deleteResult);
router.get("/resultlmy", isAuthenticated, getResultAccordingToLocationTY);

// for LotDates
router.post("/addlotdate", isAuthenticated, addLotDate);
router.get("/alllotdate", isAuthenticated, getAllLotDate);
router.delete("/removelotdate/:id", isAuthenticated, deleteLotDate);
router.put("/updatelotdate/:id", isAuthenticated, updateDate);
router.get(
  "/searchdate",
  isAuthenticated,
  getAllLotDateAccordindLocationAndTime
);

// for LotTimes
router.post("/addlottime", isAuthenticated, addLotTime);
router.get("/alllottime", isAuthenticated, getAllLotTime);
router.delete("/removelottime/:id", isAuthenticated, deleteLotTime);
router.put("/updatelottime/:id", isAuthenticated, updateTime);
router.put(
  "/updateresultelink/:id",
  isAuthenticated,
  updateLiveResultAndTimerForTime
);
router.get("/searchtime", isAuthenticated, getAllLotTimeAccordindLocation);

// for LotLocation
router.post("/addlotlocation", isAuthenticated, addLotLocatin);
router.get("/alllotlocation", isAuthenticated, getAllLotLocation);
router.get(
  "/alllotlocationwithtime",
  isAuthenticated,
  getAllLotLocationWithTimes
);
router.delete("/removelotlocation/:id", isAuthenticated, deleteLotLocation);
router.put("/updatelotlocation/:id", isAuthenticated, updateLocation);

// FOR PAYMENT
router.post("/addpayment", isAuthenticated, addPayment);
router.get("/allpaymets", isAuthenticated, getAllPayments);
router.delete("/removepayment/:id", isAuthenticated, deletePayment);

// FOT OTHER PAYMENT
router.post(
  "/addotherpayment",
  isAuthenticated,
  singleUploadForOtherPaymentQrCode,
  addOtherPayment
);
router.get("/allotherpaymets", isAuthenticated, getAllOtherPayments);
router.delete("/removeotherpayment/:id", isAuthenticated, deleteOtherPayment);

// FOR  UPI PAYMENT
router.post(
  "/addupipayment",
  isAuthenticated,
  singleUploadForUPIQrCode,
  addUpiPayment
);
router.get("/allupipaymets", isAuthenticated, getAllUPIPayments);
router.delete("/removeupipayment/:id", isAuthenticated, deleteUPIPayment);

router.get("/getuserupipaymets/:userId", isAuthenticated, getUserUpiPayments);
router.get("/getpartnerupilist/:id", isAuthenticated, getPartnerUpiList);
router.put("/updateupistatus/:id", isAuthenticated, updateUpiActivationStatus);
router.put(
  "/updateupipaymentstatus/:id",
  isAuthenticated,
  updateUpiPaymentStatus
);
router.delete("/deletesingleupi/:id", isAuthenticated, deleteSingleUpi);

// FOR  BANK PAYMENT
router.post("/addbankpayment", isAuthenticated, addBankPayment);
router.get("/allbankpaymets", isAuthenticated, getAllBankPayments);
router.get("/getuserbankpaymets/:userId", isAuthenticated, getUserBankPayments);
router.get("/getpartnerbanklist/:id", isAuthenticated, getPartnerBankList);
router.put(
  "/updatebankstatus/:id",
  isAuthenticated,
  updateBankActivationStatus
);
router.put(
  "/updatebankpaymentstatus/:id",
  isAuthenticated,
  updateBankPaymentStatus
);

router.delete("/deletesinglebank/:id", isAuthenticated, deleteSingleBank);
router.delete("/removebankpayment/:id", isAuthenticated, deleteBankPayment);

// FOR  PAYPAL PAYMENT
router.post("/addpaypalpayment", isAuthenticated, addPaypalPayment);
router.get("/allpaypalpaymets", isAuthenticated, getAllPaypalPayments);
router.delete("/removepaypalpayment/:id", isAuthenticated, deletePaypalPayment);

router.get(
  "/getuserpaypalpaymets/:userId",
  isAuthenticated,
  getUserPaypalPayments
);
router.get("/getpartnerpaypallist/:id", isAuthenticated, getPartnerPaypalList);
router.put(
  "/updatepaypalstatus/:id",
  isAuthenticated,
  updatePaypalActivationStatus
);
router.put(
  "/updatepaypalpaymentstatus/:id",
  isAuthenticated,
  updatePaypalPaymentStatus
);
router.delete("/deletesinglepaypal/:id", isAuthenticated, deleteSinglePaypal);

// FOR  CRYPTO PAYMENT
router.post(
  "/addcryptopayment",
  isAuthenticated,
  singleUploadForCryptoQrCode,
  addCryptoPayment
);
router.get("/allcryptopaymets", isAuthenticated, getAllCryptoPayments);
router.delete("/removecryptopayment/:id", isAuthenticated, deleteCryptoPayment);

router.get(
  "/getusercryptopaymets/:userId",
  isAuthenticated,
  getUserCryptoPayments
);
router.get("/getpartnercryptolist/:id", isAuthenticated, getPartnerCryptoList);
router.put(
  "/updatecryptostatus/:id",
  isAuthenticated,
  updateCryptoActivationStatus
);
router.put(
  "/updatecryptopaymentstatus/:id",
  isAuthenticated,
  updateCryptoPaymentStatus
);
router.delete("/deletesinglecrypto/:id", isAuthenticated, deleteSingleCrypto);

// FOR  SKRILL PAYMENT
router.post("/addskrillpayment", isAuthenticated, addSkrillPayment);
router.get("/allskrillpaymets", isAuthenticated, getAllSkrillPayments);
router.delete("/removeskrillpayment/:id", isAuthenticated, deleteSkrillPayment);

router.get(
  "/getuserskrillpaymets/:userId",
  isAuthenticated,
  getUserSkrillPayments
);
router.get("/getpartnerskrilllist/:id", isAuthenticated, getPartnerSkrillList);
router.put(
  "/updateskrillstatus/:id",
  isAuthenticated,
  updateSkrillActivationStatus
);
router.put(
  "/updateskrillpaymentstatus/:id",
  isAuthenticated,
  updateSkrillPaymentStatus
);
router.delete("/deletesingleskrill/:id", isAuthenticated, deleteSingleSkrill);

// FOR OTHER PAYMENT
router.get(
  "/getuserotherpaymets/:userId",
  isAuthenticated,
  getUserOtherPayments
);
router.get("/getpartnerotherlist/:id", isAuthenticated, getPartnerOtherList);
router.put(
  "/updateotherstatus/:id",
  isAuthenticated,
  updateOtherActivationStatus
);
router.put(
  "/updateotherpaymentstatus/:id",
  isAuthenticated,
  updateOtherPaymentStatus
);
router.delete("/deletesingleother/:id", isAuthenticated, deleteSingleOther);

// FOR PLAYZONE
router.post("/addplay", isAuthenticated, addPlayzone);
router.get("/allplay", isAuthenticated, getAllPlay);
router.delete("/removeplayzone/:id", isAuthenticated, deletePlayzone);

// TO GET A SINGLE PLAY
router.get("/playzone/singleplay", isAuthenticated, getSinglePlayzone);
router.get("/allplaysingleuser", isAuthenticated, getUserPlayHistory);

router.put(
  "/playzone/:id/playnumber/:playnumber",
  isAuthenticated,
  updatePlaynumber
);
router.post(
  "/playzone/:id/playnumber/:playnumber/users",
  isAuthenticated,
  addUserToPlaynumber
);

// ADDING GAME BETTING
router.post("/playbet/addplybet", isAuthenticated, addPlaybet);
router.post("/playbet/addpowerbet", isAuthenticated, addPowerBet);
router.get("/singleuser/playbets", isAuthenticated, getUserPlaybets);
router.get("/powerball/search", isAuthenticated, searchPowerBet);
router.post("/createpowerresult", isAuthenticated, createPowerResult);
router.get(
  "/singleuserplayhistory/:userid",
  isAuthenticated,
  getSingleUserPlaybetHistory
);

// FOR CURRECY
// Create a new currency
router.post("/addcurrency", singleUploadForCurrency, createCurrency);
// Get all currencies
router.get("/allcurrencies", getAllCurrencies);
// Update a currency
router.put(
  "/updatecurrency/:id",
  isAuthenticated,
  singleUploadForCurrency,
  updateCurrency
);
// router.put('/updatecurrency/:id', isAuthenticated, updateCurrency);
// Delete a currency
router.delete("/removecurrency/:id", isAuthenticated, deleteCurrency);

// GET APP BALANCE SHEET
router.get("/balancesheet", isAuthenticated, getAppBalanceSheet);

router.get("/topwinner", isAuthenticated, getAllTopWinner);

// FOR APP LINK
router.post("/createapplink", isAuthenticated, updateAppLinks);
router.get("/getapplink", getAppLinks);
router.delete("/deleteapplink", isAuthenticated, deleteAppLinks);

// FOR GETTING PARTNER PERFORMANCE
router.get(
  "/singlepartnerperformance/:lotlocation/:lottime/:lotdate",
  getSinglePartnerPerformance
);

router.get(
  "/singlepartnerperformancepowerball/:powertime/:powerdate",
  getSinglePartnerPerformancePowerball
);

router.put(
  "/updaterechargetouserandpartner",
  isAuthenticated,
  updateShowPartnerRechargeToUserAndPartner
);
router.put(
  "/deactivatedrechargetouserandpartner",
  isAuthenticated,
  deactivateShowPartnerRechargeToUserAndPartner
);

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
