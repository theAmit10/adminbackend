const mongoose = require("mongoose");

const playPerformanceSchema = new mongoose.Schema({
  partnerId: {
    type: Number,
    required: [true, "Provide partner id"]
  },
  name: {
    type: String,
    required: [true, "Please provide partner name"]
  },
  profitPercentage: {
    type: Number,
    required: [true, "Please enter profit percentage"]
  },
  rechargePercentage: {
    type: Number,
    required: [true, "Please enter recharge percentage"]
  },

  users: [
    {
      userId: {
        type: String,
        required: [true, "Please enter user ID"]
      },
      username: {
        type: String,
        required: [true, "Please enter username"]
      },
      amount: {
        type: Number,
        required: [true, "Please enter amount"]
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
        default: Date.now
      }
    }
  ]
});

const performanceSchema = new mongoose.Schema({
  lotlocation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "LotLocation",
    required: [true, "Please enter Location ID"]
  },
  lottime: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "LotTime",
    required: [true, "Please enter Time ID"]
  },
  lotdate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "LotDate",
    required: [true, "Please enter Date ID"]
  },
  performances: [playPerformanceSchema],
 
}, { timestamps: true });

module.exports = mongoose.model("PartnerPerformance", performanceSchema);

