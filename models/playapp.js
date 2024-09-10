const mongoose = require("mongoose");

const playNumberSchema = new mongoose.Schema({
  playnumber: {
    type: Number,
    required: [true, "Please select any number"]
  },
  numbercount: {
    type: Number,
    required: [true, "Please enter number count"]
  },
  amount: {
    type: Number,
    required: [true, "Please enter amount"]
  },
  distributiveamount: {
    type: Number,
    required: [true, "Please enter distributive amount"]
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
      usernumber: {
        type: Number,
        required: [true, "Please enter number"]
      },
      winningamount: {
        type: Number,
        default: 0,
      },
      currency: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Currency",
        required: [true, "Please provide currency id"],
      },
      createdAt: {
        type: Date,
        default: Date.now()
      }
    }
  ]
});

const playzoneSchema = new mongoose.Schema({
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
  playnumbers: [playNumberSchema],
  createdAt: {
    type: Date,
    default: Date.now()
  }
});

module.exports = mongoose.model("Playzone", playzoneSchema);

