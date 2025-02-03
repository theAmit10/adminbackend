const mongoose = require("mongoose");

const schema = new mongoose.Schema({
    powertime: {
        type: String,
        required: [true, "Please enter time"]
    }
}, { timestamps: true }); // Automatically adds createdAt and updatedAt

module.exports = mongoose.model("PowerTime", schema);


