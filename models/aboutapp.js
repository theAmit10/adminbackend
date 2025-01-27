const mongoose = require("mongoose");

const schema = new mongoose.Schema({
    lotlocation: {
        type: String,
        required: [true,"Please enter location name"]
    },
    locationTitle: {
        type: String,
        default: ""
    },
    locationDescription: {
        type: String,
        default: ""
    }
}, { timestamps: true });

module.exports = mongoose.model("AboutApp", schema);
