const mongoose = require("mongoose");
const RechargeModule = require("./RechargeModule");

const partnerModuleSchema = new mongoose.Schema(
  {
    userId: { type: Number, required: [true, "Please enter userId"] },
    name: { type: String, required: [true, "Please enter name"] },
    walletTwo: { type: mongoose.Schema.Types.ObjectId, ref: "WalletTwo" },
    country: { type: mongoose.Schema.Types.ObjectId, ref: "Currency" },
    profitPercentage: { type: Number, required: true },
    rechargePercentage: { type: Number, required: true },
    parentPartnerId: { type: Number, default: 1000 },
    parentParentPartnerId: { type: Number, default: 1000 },
    topParentId: { type: Number, default: 1000 },
    playHistoryPermission: { type: Boolean, default: false },
    transactionHistoryPermission: { type: Boolean, default: false },
    partnerStatus: { type: Boolean, default: false },
    rechargePaymentId: { type: Number, default: 1000 },
    country: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Currency",
    },
    partnerType: {
      type: String,
      enum: ["partner", "subpartner", "user"],
      default: "partner",
    },
    rechargeStatus: { type: Boolean, default: false },
    rechargeModule: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RechargeModule",
    },
    walletTwo: { type: mongoose.Schema.Types.ObjectId, ref: "WalletTwo" },
    userList: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    partnerList: [
      { type: mongoose.Schema.Types.ObjectId, ref: "PartnerModule" },
    ],
    profitDeduction: [
      { type: mongoose.Schema.Types.ObjectId, ref: "ProfitDeduction" },
    ],
  },
  { timestamps: true }
);

partnerModuleSchema.pre("findOneAndUpdate", async function (next) {
  try {
    const update = this.getUpdate();
    if (update.rechargeStatus !== undefined) {
      const partner = await this.model.findOne(this.getQuery());

      if (update.rechargeStatus === true) {
        // If rechargeStatus is true, check if rechargeModule exists
        if (!partner.rechargeModule) {
          const rechargeModule = await RechargeModule.create({
            upiPermission: false,
            bankPermission: false,
            paypalPermission: false,
            cryptoPermission: false,
            skrillPermission: false, // ✅ FIX: Use actual Boolean values
            otherPaymentPermission: false,
            upiList: [],
            bankList: [],
            skrillList: [],
            cryptoList: [],
            paypalList: [],
            otherList: [],
          });

          // Assign the new rechargeModule ID
          update.rechargeModule = rechargeModule._id;
        }
      } else {
        // If rechargeStatus is false, do not create a new rechargeModule
        update.rechargeModule = partner.rechargeModule || null;
      }
    }
  } catch (error) {
    return next(error);
  }

  next();
});

module.exports = mongoose.model("PartnerModule", partnerModuleSchema);
