const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  amount: {
    type: Number,
    required: [true, "Please enter amount"]
  },
  withdrawalbalance: {
    type: Number,
  },
  gamebalance: {
    type: Number,
  },
  totalbalance: {
    type: Number,
  },
  usercurrency: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Currency",
  },
  activityType: {
    type: String,
    enum: ["Deposit", "Withdraw", "Bet", "Winning", "Transfer"],
    required: true
  },
  userId: {
    type: String,
    required: [true, "Please enter user ID"]
  },
  transactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Transaction",
    required: function() {
      return this.activityType === "Deposit" || this.activityType === "Withdraw";
    },
  },
  paybetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Playbet",
    required: function() {
      return this.activityType === "Bet";
    },
  },
  payzoneId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Playzone",
    required: function() {
      return this.activityType === "Winning";
    },
  },
  paymentProcessType: {
    type: String,
    enum: ["Credit", "Debit", "Exchange"],
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("AppBalanceSheet", schema);


// const mongoose = require("mongoose");

// const schema = new mongoose.Schema({
//   amount: {
//     type: Number,
//     required: [true, "Please enter amount"]
//   },
//   withdrawalbalance: {
//     type: Number,
//   },
//   gamebalance: {
//     type: Number,
//   },
//   totalbalance: {
//     type: Number,
//   },
//   usercurrency:  {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "Currency",
//     required: [true, "Please provide currency id"],
//   },
//   activityType: {
//     type: String,
//     enum: ["Deposit", "Withdraw","Bet","Winning","Transfer"],
//     required: true
//   },
//   userId: {
//     type: String,
//     required: [true, "Please enter user ID"]
//   },
//   transactionId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "Transaction",
//     required: function() {
//       return this.activityType === "Deposit" || this.activityType === "Withdraw";
//     },
//   },
//   paybetId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "Playbet",
//     required: function() {
//       return this.activityType === "Bet";
//     },
//   },
//   payzoneId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "Playzone",
//     required: function() {
//       return this.activityType === "Winning";
//     },
//   },
//   paymentProcessType: {
//     type: String,
//     enum: ["Credit", "Debit","Exchange"],
//     required: true
//   },
//   createdAt: {
//     type: Date,
//     default: Date.now,
//   },
// });


// module.exports = mongoose.model("AppBalanceSheet", schema);


// usercurrency: {
//   type: mongoose.Schema.Types.Mixed, // Use Mixed type to allow both ObjectId and String
//   required: [true, "Please provide currency"],
//   validate: {
//     validator: function(value) {
//       if (this.activityType === "Winning") {
//         return typeof value === "string";
//       } else {
//         return mongoose.Types.ObjectId.isValid(value);
//       }
//     },
//     message: function(props) {
//       if (this.activityType === "Winning") {
//         return "Please provide currency name";
//       } else {
//         return "Please provide currency ID";
//       }
//     }
//   }
// }