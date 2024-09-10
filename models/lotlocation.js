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
    maximumNumber: {
        type: String,
        required: [true, "Please enter maximum number range"]
    },
    maximumReturn: {
        type: String,
        required: [true, "Please enter maximum return range"]
    },
    automation: {
        type: String,
        enum: ["automatic", "manual"],
        default: "manual",
    },
    automationUpdatedAt: {
        type: Date,
        default: Date.now, // Default value is the current date and time
    },
    createdAt: {
        type: Date,
        default: Date.now(),
    }
});

module.exports = mongoose.model("LotLocation", schema);
