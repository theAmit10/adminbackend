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
    swiftcode: {
        type: String,
    },
    paymentnote: {
        type: String,
    },
    paymentId: Number,
    userId: { type: Number, default: 1000 },
    activationStatus: { type: Boolean, default: false },
 
},{ timestamps: true });

// Pre-save hook to auto-increment paymentId
schema.pre('save', async function (next) {
    if (this.isNew) {
        const lastPayment = await mongoose.model("BankPaymentType").findOne().sort({ paymentId: -1 });
        this.paymentId = lastPayment ? lastPayment.paymentId + 1 : 1;
    }
    next();
});

module.exports = mongoose.model("BankPaymentType", schema);