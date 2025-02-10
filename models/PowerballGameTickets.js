const mongoose = require("mongoose");


const schema = new mongoose.Schema({
    powerdate: {
        type: String,
        required: [true, "Please enter date"]
    },
    powertime: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PowerTime",
        required: [true, "Please enter time id"]
    },
    alltickets: [
          { type: mongoose.Schema.Types.ObjectId, ref: "Tickets" },
        ],

}, { timestamps: true });

module.exports = mongoose.model("PowerballGameTickets", schema);
