const mongoose = require("mongoose");

const schema = new mongoose.Schema({
    lottime: {
        type: String,
        required: [true, "Please enter time"]
    },
    lotlocation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "LotLocation",
        required: [true, "Please enter Location id"]
    },
    liveresultlink: {
        type: String,
        default: ""
    },
    liveresulttimer:{
        type: Number,
        default: 5
    }
}, { timestamps: true }); // Automatically adds createdAt and updatedAt

module.exports = mongoose.model("LotTime", schema);


