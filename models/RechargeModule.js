const mongoose = require("mongoose");

const rechargeModuleSchema = new mongoose.Schema({
  upiPermission: { type: Boolean, default: false },
  bankPermission: { type: Boolean, default: false },
  paypalPermission: { type: Boolean, default: false },
  cryptoPermission: { type: Boolean, default: false }
});

module.exports = mongoose.model("RechargeModule", rechargeModuleSchema);
