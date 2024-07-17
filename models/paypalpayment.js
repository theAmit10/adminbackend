const mongoose = require("mongoose");

const schema = new mongoose.Schema({
    emailaddress: {
        type: String,
        required: [true, "Please enter email address"]
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
        const lastPayment = await mongoose.model("PaypalPaymentType").findOne().sort({ paymentId: -1 });
        this.paymentId = lastPayment ? lastPayment.paymentId + 1 : 1;
    }
    next();
});

module.exports = mongoose.model("PaypalPaymentType", schema);