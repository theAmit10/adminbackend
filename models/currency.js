const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    countryname: {
      type: String,
      required: [true, "Please enter country name"],
    },
    countryicon: {
      type: String,
      required: [true, "Please add country image"],
    },
    countrycurrencysymbol: {
      type: String,
      required: [true, "Please enter country currency symbol"],
    },
    timezone: {
      type: String,
      required: [true, "Please enter country timezone"],
    },
    ticketprice: {
      type: Number,
      required: [true, "Please enter ticket price"],
    },
    multiplierprice: {
      type: Number,
      required: [true, "Please enter ticket multiplier price"],
    },
    countrycurrencyvaluecomparedtoinr: {
      type: Number,
      required: [true, "Please enter country currency value compared to INR"],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Currency", schema);
