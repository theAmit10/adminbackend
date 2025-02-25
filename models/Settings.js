const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema({
  minProfitPercentage: { type: Number, default: 5 },
  minRechargePercentage: { type: Number, default: 2 },
});

module.exports = mongoose.model("Settings", settingsSchema);
