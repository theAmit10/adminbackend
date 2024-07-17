const mongoose = require("mongoose");

const schema = new mongoose.Schema({
    bankname: {
        type: String,
        required: [true, "Please enter Bank name"]
    },
    accountholdername: {
        type: String,
        required: [true, "Please enter account holder name"]
    },ifsccode: {
        type: String,
        required: [true, "Please enter IFSC code"]
    },accountnumber: {
        type: String,
        required: [true, "Please enter account number"]
    },
    paymentId: Number,
    createdAt: {
        type: Date,
        default: Date.now,
    }
});

// Pre-save hook to auto-increment paymentId
schema.pre('save', async function (next) {
    if (this.isNew) {
        const lastPayment = await mongoose.model("BankPaymentType").findOne().sort({ paymentId: -1 });
        this.paymentId = lastPayment ? lastPayment.paymentId + 1 : 1;
    }
    next();
});

module.exports = mongoose.model("BankPaymentType", schema);