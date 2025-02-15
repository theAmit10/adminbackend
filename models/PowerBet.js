const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    userId: {
      type: Number,
      required: [true, "Please enter user ID"],
    },
    username: {
      type: String,
      required: [true, "Please enter username"],
    },
    powertime: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PowerTime",
      required: [true, "Please provide power time"],
    },
    powerdate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PowerDate",
      required: [true, "Please provide power date"],
    },
    currency: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Currency",
      required: [true, "Please provide currency id"],
    },
    tickets: [
      {
        amount: {
          type: Number,
          required: [true, "Please enter amount"],
        },
        convertedAmount: {
          type: Number,
        },
        multiplier: {
          type: Number,
        },
        usernumber: [
          {
            type: Number,
            required: [true, "Please provide user numbers"],
          },
        ],
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("PowerBet", schema);
