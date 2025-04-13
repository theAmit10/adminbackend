const mongoose = require("mongoose");

const profitDeductModuleSchema = new mongoose.Schema(
  {
    userId: { type: Number, required: [true, "Please enter userId"] },
    partnerId: { type: Number, required: [true, "Please enter partnerId"] },
    name: { type: String, required: [true, "Please enter name"] },
    profitPercentage: { type: Number, required: true },
    reason: { type: String, required: true },
    status: {
      type: String,
      enum: ["Pending", "Completed", "Cancelled"],
      default: "Pending",
    },
    oldProfitPercentage: { type: Number },
    newProfitPercentage: { type: Number },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ProfitDeduction", profitDeductModuleSchema);
