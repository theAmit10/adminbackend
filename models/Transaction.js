const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    amount: {
      type: String,
      required: [true, "Please enter amount"],
    },
    convertedAmount: {
      type: String,
    },
    currency: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Currency",
      required: [true, "Please provide currency id"],
    },
    transactionId: {
      type: String,
      required: function () {
        return (
          this.transactionType === "Deposit" ||
          this.transactionType === "Recharge"
        );
      },
    },
    paymentTypeId: {
      type: String,
      required: function () {
        return (
          this.transactionType === "Deposit" ||
          this.transactionType === "Recharge"
        );
      },
    },
    receipt: {
      type: String,
      required: function () {
        return (
          this.transactionType === "Deposit" ||
          this.transactionType === "Recharge"
        );
      },
    },
    remark: {
      type: String,
    },
    paymentType: {
      type: String,
      required: [true, "Please enter payment type"],
    },
    username: {
      type: String,
      required: [true, "Please enter username"],
    },
    userId: {
      type: String,
      required: [true, "Please enter user ID"],
    },
    partnerId: {
      type: String,
    },
    transactionType: {
      type: String,
      enum: ["Deposit", "Withdraw", "AdminUpdate", "Transfer", "Recharge"],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Completed", "Cancelled"],
      default: "Pending",
    },
    walletName: {
      type: String,
    },
    paymentUpdateNote: {
      type: String,
    },
    paymentupdatereceipt: {
      type: String,
    },
    swiftcode: {
      type: String,
    },
    // Fields for Bank payment type
    bankName: {
      type: String,
      required: function () {
        return (
          this.transactionType === "Withdraw" && this.paymentType === "Bank"
        );
      },
    },
    accountHolderName: {
      type: String,
      required: function () {
        return (
          this.transactionType === "Withdraw" && this.paymentType === "Bank"
        );
      },
    },
    bankIFSC: {
      type: String,
      required: function () {
        return (
          this.transactionType === "Withdraw" && this.paymentType === "Bank"
        );
      },
    },
    bankAccountNumber: {
      type: String,
      required: function () {
        return (
          this.transactionType === "Withdraw" && this.paymentType === "Bank"
        );
      },
    },
    // Fields for PayPal payment type
    paypalEmail: {
      type: String,
      required: function () {
        return (
          this.transactionType === "Withdraw" && this.paymentType === "Paypal"
        );
      },
    },
    // Fields for Crypto payment type
    cryptoWalletAddress: {
      type: String,
      required: function () {
        return (
          this.transactionType === "Withdraw" && this.paymentType === "Crypto"
        );
      },
    },
    networkType: {
      type: String,
      required: function () {
        return (
          this.transactionType === "Withdraw" && this.paymentType === "Crypto"
        );
      },
    },
    // Fields for Skrill payment type
    skrillContact: {
      type: String,
      required: function () {
        return (
          this.transactionType === "Withdraw" && this.paymentType === "Skrill"
        );
      },
    },
    // Fields for UPI payment type
    upiHolderName: {
      type: String,
      required: function () {
        return (
          this.transactionType === "Withdraw" && this.paymentType === "Upi"
        );
      },
    },
    upiId: {
      type: String,
      required: function () {
        return (
          this.transactionType === "Withdraw" && this.paymentType === "Upi"
        );
      },
    },
  },
  { timestamps: true }
);

transactionSchema.pre("save", function (next) {
  if (
    this.transactionType === "Withdraw" &&
    this.paymentType === "Upi" &&
    (!this.upiHolderName || !this.upiId)
  ) {
    return next(
      new Error("UPI Holder Name and UPI ID are required for UPI payment type")
    );
  }
  if (
    this.transactionType === "Withdraw" &&
    this.paymentType === "Bank" &&
    (!this.bankName ||
      !this.accountHolderName ||
      !this.bankIFSC ||
      !this.bankAccountNumber)
  ) {
    return next(
      new Error(
        "Bank Name, Account Holder Name, Bank IFSC, and Bank Account Number are required for Bank payment type"
      )
    );
  }
  if (
    this.transactionType === "Withdraw" &&
    this.paymentType === "Paypal" &&
    !this.paypalEmail
  ) {
    return next(
      new Error("PayPal Email Address is required for PayPal payment type")
    );
  }
  if (
    this.transactionType === "Withdraw" &&
    this.paymentType === "Crypto" &&
    (!this.cryptoWalletAddress || !this.networkType)
  ) {
    return next(
      new Error(
        "Crypto Wallet Address and Network Type are required for Crypto payment type"
      )
    );
  }
  if (
    this.transactionType === "Withdraw" &&
    this.paymentType === "Skrill" &&
    !this.skrillContact
  ) {
    return next(
      new Error(
        "Phone number or email address is required for Skrill payment type"
      )
    );
  }
  next();
});

module.exports = mongoose.model("Transaction", transactionSchema);
