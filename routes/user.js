const express = require("express");
const {
  changePassword,
  forgetPassword,
  getAllUser,
  getMyProfile,
  getUserDetails,
  login,
  logout,
  register,
  resetPassword,
  updatePic,
  updateProfile,
  updateProfilePic,
  getProfilePic,
  getAllPromotions,
  addPromotion,
  deletePromotion,
  updatePromotion,
  createAbout,
  getAllAbout,
  deleteAbout,
  updateAbout,
  getAllWalletOne,
  getAllWalletTwo,
  updateAllWalletNameOne,
  updateAllWalletNameTwo,
  updateWalletOne,
  updateWalletTwo,
  updateAnyUserUserId,
  getAllUserRegisterInLastOneDay,
  sendNotificationToAllUser,
  sendNotificationToSingleUser,
  singleUserNotification,
  getAllNotification,
  createProfilePic,
  deleteNotification,
  addDeposit,
  getAllTransaction,
  getUserTransactions,
  updateDepositStatus,
  addWithdraw,
  getAllDeposit,
  getAllWithdrawals,
  transferAmountFromWalletOneToWalletTwo,
  getAllSubadmin,
  updateRole,
  getUserNotifications,
  markUserNotificationsAsSeen,
  updateSubadminFeatures,
  updateUserPassword,
  deleteUser,
  makeUserPartner,
  getAllPartners,
  getAllSubpartners,
  getPartnerByUserId,
  getPartnerUserList,
  makeUserSubPartner,
  getPartnerPartnerList,
  updateSubPartnerStatus,
  createProfitDeduction,
  increasePartnerProfit,
  getAllProfitDeductions,
  getPartnerProfitDeductions,
  updateProfitDeductionStatus,
  updatePartnerPermissions,
  updateProfitDeductionStatusAndAmount,
  promoteSubPartnerToTopPartner,
  removeUserFromPartnerList,
  addUserToUserList,
  removeTopPartner,
  updateRechargeStatus,
  getAllRecharge,
  getRechargeById,
  updateRechargePermission,
  getSinglePartnerRecharges,
  getAllRechargeTransactions,
  createPowerBallGame,
  addMultiplier,
  removeMultiplier,
  updateGameDetails,
  getPowerBallGameById,
  getAllPowerBallGames,
  createPowerTime,
  updatePowerTime,
  getAllPowerTimes,
  getSinglePowerTime,
  deletePowerTime,
  createPowerDate,
  updatePowerDate,
  getAllPowerDates,
  getSinglePowerDate,
  deletePowerDate,
  addWinnerPrize,
  createPowerballGameTickets,
  getAllTicketsByPowerDateAndTime,
  searchUser,
  searchPartner,
  searchSubPartner,
} = require("../controllers/user.js");
const { isAuthenticated, verifyToken } = require("../middlewares/auth.js");
const { singleUpload } = require("../middlewares/multer.js");
const {
  singleUploadForPromotion,
} = require("../middlewares/promotionmiddlerware.js");
const {
  singleUploadForDeposit,
} = require("../middlewares/depositmiddleware.js");
const {
  singleUploadForDepositWithdrawUpdate,
} = require("../middlewares/depositWithdrawUpdateMiddleware.js");

const router = express.Router();

// All Routes
router.post("/login", login);
router.post("/register", register);

router.get("/profile", isAuthenticated, getMyProfile);
router.get("/logout", isAuthenticated, logout);

//

// For Admin Side wallet
router.get("/allwalletone", isAuthenticated, getAllWalletOne);
router.get("/allwallettwo", isAuthenticated, getAllWalletTwo);
router.put("/updatewalletone", isAuthenticated, updateAllWalletNameOne);
router.put("/updatewallettwo", isAuthenticated, updateAllWalletNameTwo);

router.get("/alluserlastday", isAuthenticated, getAllUserRegisterInLastOneDay);
router.get("/allsubadmin", isAuthenticated, getAllSubadmin);

// All Routes regarding update
router.put("/updateprofile", isAuthenticated, updateProfile);
router.put("/updaterole", isAuthenticated, updateRole);
router.put("/changepassword", isAuthenticated, changePassword);
router.put("/updatepic", isAuthenticated, singleUpload, updatePic);
router.route("/singleuser/:id").get(isAuthenticated, getUserDetails);
router.put("/walletone/:walletId", isAuthenticated, updateWalletOne);
router.put("/wallettwo/:walletId", isAuthenticated, updateWalletTwo);

// All routes regarding reset and forgot password
router.route("/forgetpassword").post(forgetPassword).put(resetPassword);

//

// FOR ADMIN WORK
router.get("/alluser", isAuthenticated, getAllUser);

router.put("/updateuserid/:userId", isAuthenticated, updateAnyUserUserId);
router.post("/sendnotification", isAuthenticated, sendNotificationToAllUser);
router.post(
  "/sendnotificationsingle",
  isAuthenticated,
  sendNotificationToSingleUser
);
router.get("/notification/:userId", isAuthenticated, singleUserNotification);
router.put("/updatesubadmin/:userId", isAuthenticated, updateSubadminFeatures);

router.delete("/deleteuser/:userId", isAuthenticated, deleteUser);
router.patch(
  "/updateuserpassword/:userId/password",
  isAuthenticated,
  updateUserPassword
);

router.get("/:userId/notifications", isAuthenticated, getUserNotifications);
router.put(
  "/:userId/notifications/seen",
  isAuthenticated,
  markUserNotificationsAsSeen
);

router.get("/allnotification", isAuthenticated, getAllNotification);

router.post(
  "/updateprofilepic",
  isAuthenticated,
  singleUpload,
  createProfilePic
);
router.put(
  "/updateprofilepic",
  isAuthenticated,
  singleUpload,
  updateProfilePic
);
router.get("/getprofilepic", isAuthenticated, getProfilePic);
router.delete("/removenotification/:id", isAuthenticated, deleteNotification);

// Route to get the promotion
router.get("/getallpromotion", isAuthenticated, getAllPromotions);
router.post(
  "/addpromotion",
  isAuthenticated,
  singleUploadForPromotion,
  addPromotion
);
router.delete("/removepromotion/:id", isAuthenticated, deletePromotion);
router.put("/updatepromotion/:id", isAuthenticated, updatePromotion);

// route for the About us section
router.post("/createabout", isAuthenticated, createAbout);
router.get("/getallabout", isAuthenticated, getAllAbout);
router.delete("/removeabout/:id", isAuthenticated, deleteAbout);
router.put("/updateabout/:id", isAuthenticated, updateAbout);

// FOR DEPOSIT
router.post(
  "/createdeposit",
  isAuthenticated,
  singleUploadForDeposit,
  addDeposit
);
router.get("/getalltransaction", isAuthenticated, getAllTransaction);
router.get("/getuserdeposit", isAuthenticated, getUserTransactions);
router.put(
  "/updateuserdeposit",
  isAuthenticated,
  singleUploadForDepositWithdrawUpdate,
  updateDepositStatus
);
router.get("/getalldeposit", isAuthenticated, getAllDeposit);

//FOR WITHDRAW
router.post("/createwithdraw", isAuthenticated, addWithdraw);
router.get("/getallwithdraw", isAuthenticated, getAllWithdrawals);

// TO TRANSFER BALANCE FROM WALLET ONE TO WALLET TWO
router.put(
  "/balancetransfer",
  isAuthenticated,
  transferAmountFromWalletOneToWalletTwo
);

// FOR PARTER MODULE
router.post("/createpartner", isAuthenticated, makeUserPartner);
router.post("/createsubpartner", isAuthenticated, makeUserSubPartner);
router.post("/createprofitdeduction", isAuthenticated, createProfitDeduction);
router.put("/increaseprofit", isAuthenticated, increasePartnerProfit);
router.put("/updatesubpartner", isAuthenticated, updateSubPartnerStatus);
router.get("/getallpartner", isAuthenticated, getAllPartners);
router.get("/getallsubpartner", isAuthenticated, getAllSubpartners);
router.get("/getpartnerbyuserid/:userId", isAuthenticated, getPartnerByUserId);
router.get("/getpartneruserlist/:userId", isAuthenticated, getPartnerUserList);
router.get(
  "/getpartnerpartnerlist/:userId",
  isAuthenticated,
  getPartnerPartnerList
);
router.get("/getallprofitdeduction", isAuthenticated, getAllProfitDeductions);
router.get(
  "/getprofitdeduction/:userId",
  isAuthenticated,
  getPartnerProfitDeductions
);
router.put(
  "/updateprofitdeduction",
  isAuthenticated,
  updateProfitDeductionStatus
);
router.put(
  "/updateprofitdeductionwithamount",
  isAuthenticated,
  updateProfitDeductionStatusAndAmount
);
router.put(
  "/updatepartnerpermission",
  isAuthenticated,
  updatePartnerPermissions
);
router.put(
  "/promotesubpartnertopartner",
  isAuthenticated,
  promoteSubPartnerToTopPartner
);
router.put(
  "/removeuserfromuserlist",
  isAuthenticated,
  removeUserFromPartnerList
);
router.put("/addusertouserlist", isAuthenticated, addUserToUserList);
router.put("/removetoppartner", isAuthenticated, removeTopPartner);

// RECHARGE MODULE
router.put("/updaterechargestatus", isAuthenticated, updateRechargeStatus);
router.get("/getallrecharge", isAuthenticated, getAllRecharge);

router.get(
  "/getsinglepartnerrecharge/:userId",
  isAuthenticated,
  getSinglePartnerRecharges
);
router.get("/getrechargebyid/:id", isAuthenticated, getRechargeById);
router.put(
  "/updaterechargepermission/:id",
  isAuthenticated,
  updateRechargePermission
);

router.get("/getalluserrecharge", isAuthenticated, getAllRechargeTransactions);

// PowerBall

router.post("/createpowerball", isAuthenticated, createPowerBallGame);
router.post("/addmultipler/:gameId", isAuthenticated, addMultiplier);
router.delete("/removemultipler/:gameId", isAuthenticated, removeMultiplier);
router.put("/updategamedetails/:gameId", isAuthenticated, updateGameDetails);
router.put("/updatewinnerprize/:gameId", isAuthenticated, addWinnerPrize);
router.get("/getallpowerball/", isAuthenticated, getAllPowerBallGames);
router.get("/getpowerball/:gameId", isAuthenticated, getPowerBallGameById);

// POWERBALL TIME
router.post("/createpowertime", isAuthenticated, createPowerTime);
router.put("/updatepowertime/:id", isAuthenticated, updatePowerTime);
router.get("/getallpowertime/", isAuthenticated, getAllPowerTimes);
router.get("/getpowertime/:id", isAuthenticated, getSinglePowerTime);
router.delete("/removepowertime/:id", isAuthenticated, deletePowerTime);

// POWERBALL DATE
router.post("/createpowerdate", isAuthenticated, createPowerDate);
router.put("/updatepowerdate/:id", isAuthenticated, updatePowerDate);
router.get("/getallpowerdate", isAuthenticated, getAllPowerDates);
router.get("/getpowerdate/:id", isAuthenticated, getSinglePowerDate);
router.delete("/removepowerdate/:id", isAuthenticated, deletePowerDate);

// POWERBALL PLAY
router.post(
  "/createpowerballgame",
  isAuthenticated,
  createPowerballGameTickets
);
router.get("/getalltickets", isAuthenticated, getAllTicketsByPowerDateAndTime);

// SEARCH

router.get("/searchuser", isAuthenticated, searchUser);
router.get("/searchpartner", isAuthenticated, searchPartner);
router.get("/searchusubpartner", isAuthenticated, searchSubPartner);

module.exports = router;
