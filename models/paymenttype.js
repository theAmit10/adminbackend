const mongoose = require("mongoose");

const schema = new mongoose.Schema({
    paymentName: {
        type: String,
        required: [true, "Please enter payment name"]
    },
    paymentId: Number,
  
}, { timestamps: true });

// Pre-save hook to auto-increment paymentId
schema.pre('save', async function (next) {
    if (this.isNew) {
        const lastPayment = await mongoose.model("PaymentType").findOne().sort({ paymentId: -1 });
        this.paymentId = lastPayment ? lastPayment.paymentId + 1 : 1;
    }
    next();
});

module.exports = mongoose.model("PaymentType", schema);



// const mongoose = require("mongoose");

// const schema = new mongoose.Schema({
//     paymentName: {
//         type: String,
//         required: [true,"Please enter payment name"]
//     },
//     paymentId: Number,
//     createdAt:{
//         type: Date,
//         default: Date.now(),
//     }
// });

// module.exports = mongoose.model("PaymentType", schema);
