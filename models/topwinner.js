const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: [true, "Please enter email address or phone number"],
    },
    name: {
      type: String,
      required: [true, "Please enter email address or phone number"],
    },
    avatar: {
      public_id: String,
      url: String,
    },
    playnumber: {
        type: Number,
        required: [true, "Please select any number"],
      },
    amount: {
      type: Number,
      required: [true, "Please enter amount"],
    },
    winningamount: {
      type: Number,
      required: [true, "Please enter winning amount"],
    },
    currency: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Currency",
      required: [true, "Please provide currency id"],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("TopWinner", schema);
