const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema({
  minProfitPercentage: { type: Number, default: 5 },
  minRechargePercentage: { type: Number, default: 2 },
  firstInputName: { type: String, default: null }, // Not required, default to null
  secondInputName: { type: String, default: null }, // Not required, default to null
  thirdInputName: { type: String, default: null }, // Not required, default to null
  fourthInputName: { type: String, default: null }, // Not required, default to null
});

module.exports = mongoose.model("Settings", settingsSchema);
