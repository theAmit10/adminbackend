const mongoose = require("mongoose");

const schema = new mongoose.Schema({
    lottime: {
        type: String,
        required: [true, "Please enter time"]
    },
    lotlocation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "LotLocation",
        required: [true, "Please enter Location id"]
    }
}, { timestamps: true }); // Automatically adds createdAt and updatedAt

module.exports = mongoose.model("LotTime", schema);


// const mongoose = require("mongoose");

// const schema = new mongoose.Schema({
//     lottime: {
//         type: String,
//         required: [true, "Please enter time"]
//     },
//     lotlocation: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "LotLocation",
//         required: [true, "please enter Location id"]
//     },
//     createdAt: {
//         type: Date,
//         default: Date.now(),
//     }
// });

// module.exports = mongoose.model("LotTime", schema);
