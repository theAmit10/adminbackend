const mongoose = require("mongoose");

const schema = new mongoose.Schema({
    walletaddress: {
        type: String,
        required: [true, "Please enter wallet address"]
    },
    networktype: {
        type: String,
        required: [true, "Please enter network type address"]
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
        const lastPayment = await mongoose.model("CryptoPaymentType").findOne().sort({ paymentId: -1 });
        this.paymentId = lastPayment ? lastPayment.paymentId + 1 : 1;
    }
    next();
});

module.exports = mongoose.model("CryptoPaymentType", schema);