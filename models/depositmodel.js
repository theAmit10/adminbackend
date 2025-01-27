const mongoose = require("mongoose");

const schema = new mongoose.Schema({
    amount: {
        type: String,
        required: [true, "Please enter deposit amount"]
    },
    transactionid: {
        type: String,
        required: [true, "Please enter transaction id"]
    },
    receipt: {
        type: String,
        required: [true, "Please add receipt screenshot"]
    },
    remark: {
        type: String,
    },
    paymenttype: {
        type: String,
        required: [true, "Please enter payment type"],
    },
    paymenttypeid: {
        type: String,
        required: [true, "Please enter payment type id"]
    },
    username: {
        type: String,
        required: [true, "Please enter username"]
    },
    userid: {
        type: String,
        required: [true, "Please enter userid"]
    },
    paymentstatus: {
        type: String,
        enum: ["Pending", "Completed","Cancelled"],
        default: "Pending",
    }
}, { timestamps: true });



module.exports = mongoose.model("DepositPayment", schema);