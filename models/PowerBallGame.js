const mongoose = require("mongoose");

const PowerBallGameSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    range: {
      startRange: {
        type: Number,
        required: true,
      },
      endRange: {
        type: Number,
        required: true,
      },
    },
    multiplier: [
      {
        value: {
          type: String, // Example: { value: "2X" }
          required: true,
        },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("PowerBallGame", PowerBallGameSchema);
