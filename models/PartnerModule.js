const mongoose = require("mongoose");
const RechargeModule = require("./RechargeModule");

const partnerModuleSchema = new mongoose.Schema({
  userId: { type: Number, required: [true, "Please enter userId"] },
  name: { type: String, required: [true, "Please enter name"] },
  walletTwo: { type: mongoose.Schema.Types.ObjectId, ref: "WalletTwo" },
  profitPercentage: { type: Number, required: true },
  rechargePercentage: { type: Number, required: true },
  parentPartnerId: { type: Number, default: 1000 },
  parentParentPartnerId: { type: Number, default: 1000 },
  topParentId: { type: Number, default: 1000 },
  playHistoryPermission: { type: Boolean, default: false },
  transactionHistoryPermission: { type: Boolean, default: false },
  partnerType: { type: String, enum: ["partner", "subpartner"], default: "partner" },
  rechargeStatus: { type: Boolean, default: false },
  rechargeModule: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "RechargeModule",
  },
  userList: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  partnerList: [{ type: mongoose.Schema.Types.ObjectId, ref: "PartnerModule" }],
  profitDeduction: [{ type: mongoose.Schema.Types.ObjectId, ref: "ProfitDeduction" }],
},{timestamps: true});

// Auto-create RechargeModule if `rechargeStatus` is enabled
partnerModuleSchema.pre("findOneAndUpdate", async function (next) {
  try {
    const update = this.getUpdate();

    if (update.rechargeStatus === true) {
      const partner = await this.model.findOne(this.getQuery());

      if (!partner.rechargeModule) {
        const rechargeModule = await RechargeModule.create({
          upiPermission: false,
          bankPermission: false,
          paypalPermission: false,
          cryptoPermission: false,
        });

        update.rechargeModule = rechargeModule._id;
      }
    }
  } catch (error) {
    return next(error);
  }

  next();
});

module.exports = mongoose.model("PartnerModule", partnerModuleSchema);
