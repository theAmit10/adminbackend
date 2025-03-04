const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
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
      required: function () {
        return this.gameType === "playarena";
      },
    },
    lottime: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LotTime",
      required: function () {
        return this.gameType === "playarena";
      },
    },
    lotlocation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LotLocation",
      required: function () {
        return this.gameType === "playarena";
      },
    },
    powerdate: {
      type: String,
      required: function () {
        return this.gameType === "powerball";
      },
    },
    powertime: {
      type: String,
      required: function () {
        return this.gameType === "powerball";
      },
    },
    walletName: {
      type: String,
    },
    forProcess: {
      type: String,
    },
    gameType: {
      type: String,
      enum: ["playarena", "powerball"],
      required: true,
    },
  },
  { timestamps: true }
);

// Pre-save validation to ensure playnumbers is required only for playarena
schema.pre("save", function (next) {
  if (
    this.gameType === "playarena" &&
    (!this.playnumbers || this.playnumbers.length === 0)
  ) {
    return next(new Error("Playnumbers are required for Playarena game type"));
  }

  if (
    this.gameType === "powerball" &&
    (!this.tickets || this.tickets.length === 0)
  ) {
    return next(new Error("Tickets are required for Powerball game type"));
  }

  next();
});

module.exports = mongoose.model("Playbet", schema);

// const mongoose = require("mongoose");

// const schema = new mongoose.Schema({
//   playnumbers: [
//     {
//       playnumber: {
//         type: Number,
//         required: [true, "Please select any number"],
//       },
//       amount: {
//         type: Number,
//         required: [true, "Please enter amount"],
//       },
//       winningamount: {
//         type: Number,
//         required: [true, "Please enter winning amount"],
//       },
//     },
//   ],
//   username: {
//     type: String,
//     required: [true, "Please enter username"],
//   },
//   userid: {
//     type: String,
//     required: [true, "Please enter userid"],
//   },
//   currency: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "Currency",
//     required: [true, "Please provide currency id"],
//   },
//   lotdate: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "LotDate",
//     required: [true, "Please enter date id"],
//   },
//   lottime: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "LotTime",
//     required: [true, "Please enter Time id"],
//   },
//   lotlocation: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "LotLocation",
//     required: [true, "Please enter Location id"],
//   },
//   walletName: {
//     type: String,
//   }
// }, { timestamps: true });

// module.exports = mongoose.model("Playbet", schema);
