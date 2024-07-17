const mongoose = require("mongoose");

const schema = new mongoose.Schema({
    address: {
        type: String,
        required: [true, "Please enter email address or phone number"]
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
        const lastPayment = await mongoose.model("SkrillPaymentType").findOne().sort({ paymentId: -1 });
        this.paymentId = lastPayment ? lastPayment.paymentId + 1 : 1;
    }
    next();
});

module.exports = mongoose.model("SkrillPaymentType", schema);