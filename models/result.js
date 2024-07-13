const mongoose = require("mongoose");

const schema = new mongoose.Schema({
    resultNumber:{
        type: String,
        required: [true, "Please enter result"]
    },
    lotdate:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "LotDate",
        required: [true,"please enter date id"]
    },
    lottime:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "LotTime",
        required: [true,"please enter Time id"]
    },
    lotlocation:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "LotLocation",
        required: [true,"please enter Location id"]
    },
    nextresulttime:{
        type: String,
        required: [true,"please enter next result time"]
    },
    createdAt:{
        type: Date,
        default: Date.now(),
    }
});

module.exports = mongoose.model("Result", schema);
