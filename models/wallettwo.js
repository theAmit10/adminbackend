const mongoose = require("mongoose");

const schema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    walletName: String,
    balance: { type: Number, default: 0 },
    visibility: Boolean
});

module.exports = mongoose.model("WalletTwo", schema);
