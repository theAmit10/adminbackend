const mongoose = require("mongoose");

const schema = new mongoose.Schema({
    aboutTitle: {
        type: String,
        default: ""
    },
    aboutDescription: {
        type: String,
        default: ""
    },
    createdAt: {
        type: Date,
        default: Date.now,
    }
});

module.exports = mongoose.model("LotAppAbout", schema);
