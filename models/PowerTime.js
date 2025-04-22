const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    powertime: {
      type: String,
      required: [true, "Please enter time"],
    },
    liveresultlink: {
      type: String,
      default: "",
    },
    liveresulttimer: {
      type: Number,
      default: 5,
    },
  },
  { timestamps: true }
); // Automatically adds createdAt and updatedAt

module.exports = mongoose.model("PowerTime", schema);
