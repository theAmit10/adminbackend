const mongoose = require("mongoose");

const schema = new mongoose.Schema({
    lotlocation: {
        type: String,
        required: [true, "Please enter location name"]
    },
    locationTitle: {
        type: String,
        default: ""
    },
    locationDescription: {
        type: String,
        default: ""
    },
    maximumRange: {
        type: String,
        required: [true, "Please enter maximum range"]
    },
    createdAt: {
        type: Date,
        default: Date.now(),
    }
});

module.exports = mongoose.model("LotLocation", schema);
