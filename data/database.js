const mongoose = require("mongoose");

const connectDb = async () => {
  try {
    const { connection } = await mongoose.connect(process.env.MONGO_URI, {
      dbName: "sinceapp",
    });

    console.log(`Server connected to database ${connection.host}`);
  } catch (error) {
    console.log("Something went wrong", error);
    process.exit(1);
  }
};

// const connectDb = async () => {
//   try {
//     await mongoose.connect(process.env.MONGO_URI);
//     console.log("MongoDB Connected!");
//   } catch (error) {
//     console.error("Something went wrong", error);
//     process.exit(1);
//   }
// };

module.exports = {
  connectDb,
};
