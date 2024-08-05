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
    type: String,
    required: [true, "Please enter user currency"]
  },
  activityType: {
    type: String,
    enum: ["Deposit", "Withdraw","Bet","Winning","Transfer"],
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
    enum: ["Credit", "Debit","Exchange"],
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});


module.exports = mongoose.model("AppBalanceSheet", schema);