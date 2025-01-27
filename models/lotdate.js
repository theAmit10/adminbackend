const mongoose = require("mongoose");

const schema = new mongoose.Schema({
    lotdate: {
        type: String,
        required: [true, "Please enter date"]
    },
    lottime: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "LotTime",
        required: [true, "Please enter time id"]
    },
}, { timestamps: true });

module.exports = mongoose.model("LotDate", schema);
