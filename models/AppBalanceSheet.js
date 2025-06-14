const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: [true, "Please enter amount"],
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
      enum: [
        "Deposit",
        "Withdraw",
        "Bet",
        "Winning",
        "Transfer",
        "AdminUpdate",
      ],
      required: true,
    },
    userId: {
      type: String,
      required: [true, "Please enter user ID"],
    },
    walletName: {
      type: String,
    },
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transaction",
      required: function () {
        return (
          this.activityType === "Deposit" || this.activityType === "Withdraw"
        );
      },
    },
    paybetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Playbet",
      required: function () {
        return this.activityType === "Bet";
      },
    },
    payzoneId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Playzone",
      required: function () {
        return this.activityType === "Winning";
      },
    },
    paymentProcessType: {
      type: String,
      enum: ["Credit", "Debit", "Exchange"],
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AppBalanceSheet", schema);
