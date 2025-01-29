const mongoose = require("mongoose");
const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");
const WalletOne = require("./walletone.js");
const WalletTwo = require("./wallettwo.js");
const Currency = require("./currency.js");
const ErrorHandler = require("../utils/error.js");

// RechargeModule Schema
const rechargeModuleSchema = new mongoose.Schema({
  upiPermission: { type: Boolean, default: false },
  bankPermission: { type: Boolean, default: false },
  paypalPermission: { type: Boolean, default: false },
  cryptoPermission: { type: Boolean, default: false }
});

const RechargeModule = mongoose.model("RechargeModule", rechargeModuleSchema);

// PartnerModule Schema
const partnerModuleSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  profitPercentage: { type: Number, required: true },
  rechargePercentage: { type: Number, required: true },
  parentPartnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'PartnerModule' },
  parentParentPartnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'PartnerModule' },
  topParentId: { type: mongoose.Schema.Types.ObjectId, ref: 'PartnerModule' },
  playHistoryPermission: { type: Boolean, default: false },
  transactionHistoryPermission: { type: Boolean, default: false },
  rechargeStatus: { type: Boolean, default: false },
  rechargeModule: { type: mongoose.Schema.Types.ObjectId, ref: 'RechargeModule' },
  userList: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // List of Users
  partnerList: [{ type: mongoose.Schema.Types.ObjectId, ref: 'PartnerModule' }] // List of Partners
});

const PartnerModule = mongoose.model("PartnerModule", partnerModuleSchema);

// User Schema
const schema = new mongoose.Schema({
  name: { type: String, required: [true, "Please enter name"] },
  email: { type: String, required: [true, "Please enter email"], unique: [true, "User already exists"] },
  contact: { type: String, unique: [true, "Contact already exists"] },
  password: { type: String, required: [true, "Please enter password"], minLength: [6, "Password must be at least 6 characters long"], select: false },
  walletOne: { type: mongoose.Schema.Types.ObjectId, ref: 'WalletOne' },
  walletTwo: { type: mongoose.Schema.Types.ObjectId, ref: 'WalletTwo' },
  role: { type: String, enum: ["admin", "user", "subadmin"], default: "user" },
  loginType: { type: String, enum: ['Google', 'manual'], default: 'manual' },
  avatar: { public_id: String, url: String },
  country: { type: mongoose.Schema.Types.ObjectId, ref: 'Currency' },
  otp: Number,
  otp_expire: Date,
  userId: Number,
  devicetoken: { type: String, default: null },
  transactionHistory: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' }],
  playbetHistory: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Playbet' }],
  notifications: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Notification' }],
  subadminfeature: { type: Object, default: {} },
  partnerStatus: { type: Boolean, default: false },
  partnerModule: { type: mongoose.Schema.Types.ObjectId, ref: 'PartnerModule' },
  rechargeStatus: { type: Boolean, default: false }, // Added rechargeStatus
  createdAt: { type: Date, default: Date.now }
});

// Pre-save hook
schema.pre("save", async function (next) {
  if (this.isNew) {
    try {
      this.password = await bcrypt.hash(this.password, 10);

      const currency = await Currency.findById(this.country);
      if (!currency) return next(new ErrorHandler("Currency not found", 404));

      let walletOne = await WalletOne.create({
        userId: this._id,
        walletName: "Wallet One",
        visibility: true,
        currencyId: currency._id,
      });

      let walletTwo = await WalletTwo.create({
        userId: this._id,
        walletName: "Wallet Two",
        visibility: true,
        currencyId: currency._id,
      });

      this.walletOne = walletOne._id;
      this.walletTwo = walletTwo._id;

      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

// Middleware to handle partner status update
schema.pre("findOneAndUpdate", async function (next) {
  const update = this.getUpdate();

  if (update.partnerStatus === true) {
    const user = await this.model.findOne(this.getQuery());

    if (!user.partnerModule) {
      const partnerModule = await PartnerModule.create({
        userId: user._id,
        profitPercentage: 0,
        rechargePercentage: 0,
        parentPartnerId: null,
        parentParentPartnerId: null,
        topParentId: null,
        playHistoryPermission: false,
        transactionHistoryPermission: false,
        rechargeStatus: false,
        userList: [user._id],
        partnerList: []
      });
      update.partnerModule = partnerModule._id;
    }
  }

  next();
});

// Middleware to handle recharge status update
PartnerModule.pre("findOneAndUpdate", async function (next) {
  const update = this.getUpdate();

  if (update.rechargeStatus === true) {
    const partner = await this.model.findOne(this.getQuery());

    if (!partner.rechargeModule) {
      const rechargeModule = await RechargeModule.create({
        upiPermission: false,
        bankPermission: false,
        paypalPermission: false,
        cryptoPermission: false,
      });

      update.rechargeModule = rechargeModule._id;
    }
  }

  next();
});

schema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

schema.methods.generateToken = function () {
  return jwt.sign({ _id: this._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
};

module.exports = mongoose.model("User", schema);


// const mongoose = require("mongoose");
// const bcrypt = require('bcryptjs');
// const jwt = require("jsonwebtoken");
// const WalletOne  = require("./walletone.js");
// const WalletTwo  = require("./wallettwo.js");
// const Currency  = require("./currency.js");
// const ErrorHandler = require("../utils/error.js");

// // Subadmin features schema
// const subadminFeatureSchema = new mongoose.Schema({
//   alllocation: { type: Boolean, default: false },
//   createlocation: { type: Boolean, default: false },
//   createtime: { type: Boolean, default: false },
//   edittime: { type: Boolean, default: false },
//   deletetime: { type: Boolean, default: false },
//   users: { type: Boolean, default: false },
//   withdrawalletbalanceedit: { type: Boolean, default: false },
//   gamewalletbalnceedit: { type: Boolean, default: false },
//   useridedit: { type: Boolean, default: false },
//   notificationsend: { type: Boolean, default: false },
//   play: { type: Boolean, default: false },
//   createresult: { type: Boolean, default: false },
//   results: { type: Boolean, default: false },
//   deposits: { type: Boolean, default: false },
//   withdraws: { type: Boolean, default: false },
//   paymentoption: { type: Boolean, default: false },
//   wallet: { type: Boolean, default: false },
//   gamedescription: { type: Boolean, default: false },
//   promotions: { type: Boolean, default: false },
//   pushnotification: { type: Boolean, default: false },
//   transcationhistory: { type: Boolean, default: false },
//   allcountry: { type: Boolean, default: false },
//   createcountry: { type: Boolean, default: false },
//   editanddeletecountry: { type: Boolean, default: false },
//   updateprofile: { type: Boolean, default: false },
//   changepassword: { type: Boolean, default: false },
//   applinks: { type: Boolean, default: false },
//   aboutus: { type: Boolean, default: false },
// });

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
//     enum: ["admin", "user","subadmin"],
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
//   country: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Currency'
//   },
//   otp: Number,
//   otp_expire: Date,
//   userId: Number,
//   devicetoken: {
//     type: String,
//     default: null,
//   },
//   transactionHistory: [
//     {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'Transaction'
//     }
//   ],
//   playbetHistory: [{
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Playbet'
//   }],
//   notifications: [{
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Notification'
//   }],
//   subadminfeature: subadminFeatureSchema, // New subadmin feature field
//   createdAt:{
//     type: Date,
//     default: Date.now,
//   }
// });

// // Pre-save hook to handle additional logic for 'subadmin' role
// schema.pre("save", async function (next) {
//   if (!this.isNew && this.isModified("password")) {
//     this.password = await bcrypt.hash(this.password, 10);
//     return next();
//   }

//   if (this.isNew) {
//     try {
//       // Hash the password
//       this.password = await bcrypt.hash(this.password, 10);

//       // Fetch the currency based on the provided country
//       const currency = await Currency.findById(this.country);
//       if (!currency) {
//         return next(new ErrorHandler("Currency not found", 404));
//       }
      
//        // **Fetch existing WalletOne to determine the walletName**
//       let existingWalletOne = await WalletOne.findOne().sort({ _id: 1 }); // Sort by _id to get the first created
//       let walletOneName = existingWalletOne
//         ? existingWalletOne.walletName
//         : "Wallet One";

//       // **Fetch existing WalletTwo to determine the walletName**
//       let existingWalletTwo = await WalletTwo.findOne().sort({ _id: 1 }); // Sort by _id to get the first created
//       let walletTwoName = existingWalletTwo
//         ? existingWalletTwo.walletName
//         : "Wallet Two";
//       //  ##########

//       // Create Wallets
//       const walletOne = await WalletOne.create({
//         userId: this._id,
//         walletName: walletOneName,
//         visibility: true,
//         currencyId: currency._id,
//       });
//       const walletTwo = await WalletTwo.create({
//         userId: this._id,
//         walletName: walletTwoName,
//         visibility: true,
//         currencyId: currency._id,
//       });


//       this.walletOne = walletOne._id;
//       this.walletTwo = walletTwo._id;

//       // Initialize history arrays
//       this.transactionHistory = [];
//       this.playbetHistory = [];

//       // If the role is 'subadmin', initialize the subadminfeature array
//       if (this.role === "subadmin") {
//         this.subadminfeature = {}; // Insert default object with false values
//       }

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

// schema.methods.generateToken = function () {
//   const expirationTime = Math.floor(Date.now() / 1000) + (60 * 60); // 1 hour in seconds
//   return jwt.sign({ _id: this._id }, process.env.JWT_SECRET, { expiresIn: expirationTime });
// };

// module.exports = mongoose.model("User", schema);



