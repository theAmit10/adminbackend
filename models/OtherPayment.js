const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    paymentId: Number,
    paymentName: {
      type: String,
      required: [true, "Please enter payment name"],
    },
    firstInput: {
      type: String,
    },
    secondInput: {
      type: String,
    },
    thirdInput: {
      type: String,
    },
    qrcode: {
      type: String,
    },
    firstInputName: {
      type: String,
    },
    secondInputName: {
      type: String,
    },
    thirdInputName: {
      type: String,
    },
    qrcodeName: {
      type: String,
    },
    paymentnote: {
      type: String,
    },
    userId: { type: Number, default: 1000 },
    activationStatus: { type: Boolean, default: false },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Approved", "Cancelled"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

// Pre-save hook to auto-increment paymentId
schema.pre("save", async function (next) {
  if (this.isNew) {
    const lastPayment = await mongoose
      .model("OtherPayment")
      .findOne()
      .sort({ paymentId: -1 });
    this.paymentId = lastPayment ? lastPayment.paymentId + 1 : 1;
  }
  next();
});

module.exports = mongoose.model("OtherPayment", schema);
