const mongoose = require("mongoose");

const rechargeModuleSchema = new mongoose.Schema({
  upiPermission: { type: Boolean, default: false },
  bankPermission: { type: Boolean, default: false },
  paypalPermission: { type: Boolean, default: false },
  cryptoPermission: { type: Boolean, default: false },
  skrillPermission: { type: Boolean, default: false },
  otherPaymentPermission: { type: Boolean, default: false },
  upiList: [{ type: mongoose.Schema.Types.ObjectId, ref: "UpiPaymentType" }],
  bankList: [{ type: mongoose.Schema.Types.ObjectId, ref: "BankPaymentType" }],
  skrillList: [{ type: mongoose.Schema.Types.ObjectId, ref: "SkrillPaymentType" }],
  cryptoList: [{ type: mongoose.Schema.Types.ObjectId, ref: "CryptoPaymentType" }],
  paypalList: [{ type: mongoose.Schema.Types.ObjectId, ref: "PaypalPaymentType" }],
});

module.exports = mongoose.model("RechargeModule", rechargeModuleSchema);
