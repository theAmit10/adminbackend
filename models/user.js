const mongoose = require("mongoose");
// const bcrypt = require("bcrypt");
const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");
const WalletOne  = require("./walletone.js");
const WalletTwo  = require("./wallettwo.js");

const schema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please enter name"],
  },
  email: {
    type: String,
    required: [true, "Please enter email"],
    unique: [true, "user already exists"],
  },
  contact: {
    type: String,
    unique: [true, "contact already exists"],
  },
  password: {
    type: String,
    required: [true, "Please enter password"],
    minLength: [6, "Password must be atleast 6 characters long"],
    select: false,
  },
  walletOne: { type: mongoose.Schema.Types.ObjectId, ref: 'WalletOne' },
  walletTwo: { type: mongoose.Schema.Types.ObjectId, ref: 'WalletTwo' },
  role: {
    type: String,
    enum: ["admin", "user","subadmin"],
    default: "user",
  },
  loginType: {
    type: String,
    enum: ['Google', 'manual'],
    default: 'manual'
  },
  avatar: {
    public_id: String,
    url: String,
  },
  otp: Number,
  otp_expire: Date,
  userId: Number,
  devicetoken: {
    type: String,
    default: null,
  },
  transactionHistory: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction'
    }
  ],
  playbetHistory: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Playbet'
  }],
  createdAt:{
    type: Date,
    default: Date.now(),
  }
});

schema.pre("save", async function (next) {
  if (!this.isNew && this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
    return;
  }

  if (this.isNew) {
    try {
      this.password = await bcrypt.hash(this.password, 10);
      const walletOne = await WalletOne.create({
        userId: this._id,
        walletName: 'Wallet One',
        visibility: true
      });
      const walletTwo = await WalletTwo.create({
        userId: this._id,
        walletName: 'Wallet Two',
        visibility: true
      });
      this.walletOne = walletOne._id;
      this.walletTwo = walletTwo._id;
      this.transactionHistory = [];
      this.playbetHistory = [];
      next();
    } catch (error) {
      next(error);
    }
    return;
  }

  if (!this.isNew || !this.isModified("password")) {
    next();
    return;
  }
});

schema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};



schema.methods.generateToken = function () {
  // Set expiration time to a very large value (e.g., 10 years from now)
  const expirationTime = Math.floor(Date.now() / 1000) + (10 * 365 * 24 * 60 * 60); // 10 years in seconds

  // Generate the token with no expiration
  return jwt.sign({ _id: this._id, exp: expirationTime }, process.env.JWT_SECRET);
};


module.exports = mongoose.model("User", schema);

// schema.methods.generateToken = function () {
//   return jwt.sign({ _id: this._id }, process.env.JWT_SECRET);
// };

// schema.methods.generateToken = function () {
//   return jwt.sign({ _id: this.userId }, process.env.JWT_SECRET);
// };



// const mongoose = require("mongoose");
// const bcrypt = require("bcrypt");
// const jwt = require("jsonwebtoken");
// const WalletOne  = require("./walletone.js");
// const WalletTwo  = require("./wallettwo.js");

// const schema = new mongoose.Schema({
//   name: {
//     type: String,
//     required: [true, "Please enter name"],
//   },
//   email: {
//     type: String,
//     required: [true, "Please enter email"],
//     unique: [true, "user already exists"],
//   },
//   contact: {
//     type: String,
//     unique: [true, "contact already exists"],
//   },
//   password: {
//     type: String,
//     required: [true, "Please enter password"],
//     minLength: [6, "Password must be atleast 6 characters long"],
//     select: false,
//   },
//   walletOne: { type: mongoose.Schema.Types.ObjectId, ref: 'WalletOne' },
//   walletTwo: { type: mongoose.Schema.Types.ObjectId, ref: 'WalletTwo' },
//   role: {
//     type: String,
//     enum: ["admin", "user"],
//     default: "user",
//   },
//   loginType: {
//     type: String,
//     enum: ['Google', 'manual'],
//     default: 'manual'
//   },
//   avatar: {
//     public_id: String,
//     url: String,
//   },
//   otp: Number,
//   otp_expire: Date,
//   userId: Number,
//   devicetoken: {
//     type: String,
//     default: null,
//   },
//   createdAt:{
//     type: Date,
//     default: Date.now(),
//   }
// });

// schema.pre("save", async function (next) {
//   if (!this.isNew && this.isModified("password")) {
//     this.password = await bcrypt.hash(this.password, 10);
//     return;
//   }

//   if (this.isNew) {
//     try {
//       this.password = await bcrypt.hash(this.password, 10);
//       const walletOne = await WalletOne.create({
//         userId: this._id,
//         walletName: 'Wallet One',
//         visibility: true
//       });
//       const walletTwo = await WalletTwo.create({
//         userId: this._id,
//         walletName: 'Wallet Two',
//         visibility: true
//       });
//       this.walletOne = walletOne._id;
//       this.walletTwo = walletTwo._id;
//       next();
//     } catch (error) {
//       next(error);
//     }
//     return;
//   }

//   if (!this.isNew || !this.isModified("password")) {
//     next();
//     return;
//   }
// });

// schema.methods.comparePassword = async function (enteredPassword) {
//   return await bcrypt.compare(enteredPassword, this.password);
// };

// // schema.methods.generateToken = function () {
// //   return jwt.sign({ _id: this._id }, process.env.JWT_SECRET);
// // };

// schema.methods.generateToken = function () {
//   // Set expiration time to a very large value (e.g., 10 years from now)
//   const expirationTime = Math.floor(Date.now() / 1000) + (10 * 365 * 24 * 60 * 60); // 10 years in seconds

//   // Generate the token with no expiration
//   return jwt.sign({ _id: this._id, exp: expirationTime }, process.env.JWT_SECRET);
// };

// // schema.methods.generateToken = function () {
// //   return jwt.sign({ _id: this.userId }, process.env.JWT_SECRET);
// // };




// module.exports = mongoose.model("User", schema);
