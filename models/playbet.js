const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  playnumbers: [
    {
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
    },
  ],
  username: {
    type: String,
    required: [true, "Please enter username"],
  },
  userid: {
    type: String,
    required: [true, "Please enter userid"],
  },
  currency: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Currency",
    required: [true, "Please provide currency id"],
  },
  lotdate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "LotDate",
    required: [true, "Please enter date id"],
  },
  lottime: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "LotTime",
    required: [true, "Please enter Time id"],
  },
  lotlocation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "LotLocation",
    required: [true, "Please enter Location id"],
  },
  walletName: {
    type: String,
  }
}, { timestamps: true });

module.exports = mongoose.model("Playbet", schema);
