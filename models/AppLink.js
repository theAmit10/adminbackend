const mongoose = require("mongoose");

const appLinkSchema = new mongoose.Schema({
  androidLink: {
    type: String,
  },
  iosLink: {
    type: String,
  },
}, { timestamps: true });

module.exports = mongoose.model("AppLink", appLinkSchema);