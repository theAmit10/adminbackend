const mongoose = require("mongoose");

const schema = new mongoose.Schema({
    aboutTitle: {
        type: String,
        default: ""
    },
    aboutDescription: {
        type: String,
        default: ""
    }
}, { timestamps: true });

module.exports = mongoose.model("LotAppAbout", schema);
