// const mongoose = require("mongoose");

// const schema = new mongoose.Schema({
//     title: {
//         type: String,
//         required: [true, "Please enter title"]
//     },
//     description: {
//         type: String,
//         required: [true, "Please enter description"]
//     },

// });

// module.exports = mongoose.model("Notification", schema);


const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Please enter a title"]
  },
  description: {
    type: String,
    required: [true, "Please enter a description"]
  },
  seennow: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Notification", notificationSchema);
