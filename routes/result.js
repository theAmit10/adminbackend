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
  updateTime
} = require("../controllers/result.js");

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
router.delete("/removelotlocation/:id", isAuthenticated, deleteLotLocation);
router.put("/updatelotlocation/:id", isAuthenticated, updateLocation);

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
