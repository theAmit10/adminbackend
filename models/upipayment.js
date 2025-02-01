const mongoose = require("mongoose");

const schema = new mongoose.Schema({
    upiholdername: {
        type: String,
        required: [true, "Please enter UPI holder name"]
    },
    upiid: {
        type: String,
        required: [true, "Please enter UPI ID"]
    },
    paymentId: Number,
    qrcode: {
        type: String,
        required: [true, "Please add QR code"]
    },
    paymentnote: {
        type: String,
    },
    userId: { type: Number, default: 1000 },
    activationStatus: { type: Boolean, default: false },
}, { timestamps: true });

// Pre-save hook to auto-increment paymentId
schema.pre('save', async function (next) {
    if (this.isNew) {
        const lastPayment = await mongoose.model("UpiPaymentType").findOne().sort({ paymentId: -1 });
        this.paymentId = lastPayment ? lastPayment.paymentId + 1 : 1;
    }
    next();
});

module.exports = mongoose.model("UpiPaymentType", schema);