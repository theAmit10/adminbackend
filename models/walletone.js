const mongoose = require("mongoose");

const schema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    walletName: String,
    balance: { type: Number, default: 0 },
    visibility: Boolean,
    currencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Currency' },
}, { timestamps: true });

module.exports = mongoose.model("WalletOne", schema);
