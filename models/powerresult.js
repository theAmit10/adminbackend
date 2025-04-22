const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    jackpotnumber: [
      {
        type: Number,
        required: [true, "Please provide jackpot number"],
      },
    ],
    powerdate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PowerDate",
      required: [true, "Please enter date id"],
    },
    powertime: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PowerTime",
      required: [true, "Please enter Time id"],
    },
    prize: {
      firstprize: {
        amount: { type: String, required: true },
        totaluser: { type: Number, required: true },
      },
      secondprize: {
        amount: { type: String, required: true },
        totaluser: { type: Number, required: true },
      },
      thirdprize: {
        amount: { type: Number, required: true },
        totaluser: { type: Number, required: true },
      },
      fourthprize: {
        amount: { type: Number, required: true },
        totaluser: { type: Number, required: true },
      },
      fifthprize: {
        amount: { type: Number, required: true },
        totaluser: { type: Number, required: true },
      },
      sixthprize: {
        amount: { type: Number, required: true },
        totaluser: { type: Number, required: true },
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PowerResult", schema);
