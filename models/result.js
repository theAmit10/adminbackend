const mongoose = require("mongoose");
const ErrorHandler = require("../utils/error");

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
    resultCreatedMethod:{
        type: String,
        required: [true,"please provide result created method"]
    }
}, { timestamps: true });

schema.pre('save', function (next) {
    if (!this.resultCreatedMethod) {
        console.log("resultCreatedMethod is missing:", this);
        return next(new ErrorHandler("resultCreatedMethod is missing:", 404));
    }
    next();
});

module.exports = mongoose.model("Result", schema);
