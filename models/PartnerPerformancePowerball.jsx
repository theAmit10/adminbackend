const mongoose = require("mongoose");

const playPerformanceSchema = new mongoose.Schema({
  partnerId: {
    type: Number,
    required: [true, "Provide partner id"],
  },
  name: {
    type: String,
    required: [true, "Please provide partner name"],
  },
  profitPercentage: {
    type: Number,
    required: [true, "Please enter profit percentage"],
  },
  rechargePercentage: {
    type: Number,
    required: [true, "Please enter recharge percentage"],
  },
  partnerStatus: {
    type: Boolean,
    required: [true, "Please enter partner status"],
  },
  rechargeStatus: {
    type: Boolean,
    required: [true, "Please enter recharge status"],
  },
  parentPartnerId: {
    type: Number,
    required: [true, "Please enter parent partner id"],
  },
  parentParentPartnerId: {
    type: Number,
    required: [true, "Please enter parent parent partner id"],
  },
  topParentId: { type: Number, required: [true, "Please enter top parent id"] },
  parentPartnerPartnerStatus: {
    type: Boolean,
    required: [true, "Please enter parent partner status"],
  },
  parentPartnerRechargeStatus: {
    type: Boolean,
    required: [true, "Please enter parent recharge status"],
  },
  parentPartnerProfitPercentage: {
    type: Number,
    required: [true, "Please enter parent profit percentage"],
  },
  parentPartnerRechargePercentage: {
    type: Number,
    required: [true, "Please enter parent recharge percentage"],
  },

  parentParentPartnerPartnerStatus: {
    type: Boolean,
    required: [true, "Please enter parent Parent partner status"],
  },
  parentParentPartnerRechargeStatus: {
    type: Boolean,
    required: [true, "Please enter parent Parent recharge status"],
  },
  parentParentPartnerProfitPercentage: {
    type: Number,
    required: [true, "Please enter parent Parent profit percentage"],
  },
  parentParentPartnerRechargePercentage: {
    type: Number,
    required: [true, "Please enter parent Parent recharge percentage"],
  },
  currency: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Currency",
    required: [true, "Please provide currency id"],
  },
  contributionAmount: {
    type: Number,
    default: 0,
  },
  contributionPercentage: {
    type: Number,
    default: 0,
  },
  profitAmount: {
    type: Number,
    default: 0,
  },

  users: [
    {
      userId: {
        type: String,
        required: [true, "Please enter user ID"],
      },
      username: {
        type: String,
        required: [true, "Please enter username"],
      },
      amount: {
        type: Number,
        required: [true, "Please enter amount"],
      },
      convertedAmount: {
        type: Number,
      },
      currency: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Currency",
        required: [true, "Please provide currency id"],
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
});

const performanceSchema = new mongoose.Schema(
  {
    powertime: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PowerTime",
      required: [true, "Please enter Time ID"],
    },
    powerdate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PowerDate",
      required: [true, "Please enter Date ID"],
    },
    totalAmount: {
      type: Number,
      default: 0,
    },
    winningAmount: {
      type: Number,
      default: 0,
    },
    totalProfit: {
      type: Number,
      default: 0,
    },
    performances: [playPerformanceSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "PartnerPerformancePowerball",
  performanceSchema
);
