const mongoose = require("mongoose");

const schema = new mongoose.Schema({
    url: {
        type: String,
        required: [true, "Please Add Promotion Image"]
    },
    visibility: {
        type: Boolean,
        default: true,
    },
}, { timestamps: true });

module.exports = mongoose.model("Promotion", schema);
