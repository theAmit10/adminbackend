const mongoose = require("mongoose");

// const schema = new mongoose.Schema({
//     notifications: [{
//         userId: String,
//         title: String,
//         description: String
//     }]
// });
// module.exports = mongoose.model("Notification", schema);
// const mongoose = require("mongoose");


const schema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, "Please enter title"]
    },
    description: {
        type: String,
        required: [true, "Please enter description"]
    },

});

module.exports = mongoose.model("Notification", schema);
