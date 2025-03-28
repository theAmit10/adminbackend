const mongoose = require("mongoose");

const ticketschema = new mongoose.Schema(
  {
    userId: {
      type: Number,
      required: [true, "Please enter user ID"],
    },
    username: {
      type: String,
      required: [true, "Please enter username"],
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

const schema = new mongoose.Schema(
  {
    powerdate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PowerDate",
      required: [true, "Please enter date id"],
    },
    powertime: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PowerTime",
      required: [true, "Please enter time id"],
    },
    alltickets: [ticketschema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("PowerballGameTickets", schema);
