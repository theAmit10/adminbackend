const { asyncError } = require("../middlewares/error.js");
const LotAppAbout = require("../models/lotappabout.js");
const Promotion = require("../models/promotion.js");
const User = require("../models/user.js");
const ErrorHandler = require("../utils/error.js");
const { getDataUri, sendEmail, sendToken } = require("../utils/features.js");
const fs = require("fs");
const pathModule = require("path");
const WalletOne = require("../models/walletone.js");
const WalletTwo = require("../models/wallettwo.js");
const { firebase } = require("../firebase/index.js");
const Notification = require("../models/Notification.js");
const { userInfo } = require("os");
const DepositPayment = require("../models/depositmodel.js");
const Transaction = require("../models/Transaction.js");
const Transactionwithdraw = require("../models/Transactionwithdraw.js");
const AppBalanceSheet = require("../models/AppBalanceSheet.js");
const cookieOptions = require("../utils/features.js");
const Currency = require("../models/currency.js");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const PartnerModule = require("../models/PartnerModule.js");
const ProfitDeduction = require("../models/ProfitDeduction.js");
const RechargeModule = require("../models/RechargeModule.js");

const login = asyncError(async (req, res, next) => {
  const { email, password } = req.body;

  const normalizedEmail = email.toLowerCase();
  console.log("Login attempt with email:", normalizedEmail); // Debugging line

  if (!password) return next(new ErrorHandler("Please enter password", 400));
  if (!normalizedEmail)
    return next(new ErrorHandler("Please enter email", 400));

  const user = await User.findOne({ email: normalizedEmail }).select(
    "+password"
  );
  console.log("User found:", user); // Debugging line

  if (!user) {
    console.log("User not found with email:", normalizedEmail); // Debugging line
    return next(new ErrorHandler("Not Registered, create an account", 400));
  }

  const isMatched = await user.comparePassword(password);
  console.log("Password matched:", isMatched); // Debugging line

  if (!isMatched) {
    return next(new ErrorHandler("Incorrect Email or Password", 400));
  }

  sendToken(user, res, `Welcome Back, ${user.name}`, 200);
});

// const register = asyncError(async (req, res, next) => {
//   const { name, email, password, devicetoken, role, country } = req.body;

//   const normalizedEmail = email.toLowerCase();

//   let userCount = await User.countDocuments();

//   let userId = 1000 + userCount;
//   let userExists = true;

//   // Loop until a unique userId is found
//   while (userExists) {
//     let user = await User.findOne({ contact: userId });
//     if (!user) {
//       userExists = false;
//     } else {
//       userId++; // Increment userId
//     }
//   }

//   let user = await User.findOne({ email: normalizedEmail });

//   if (user) return next(new ErrorHandler("User Already exist", 400));

//   const contact = userId;

//   user = await User.create({
//     name,
//     email: normalizedEmail,
//     password,
//     userId, // Add userId to the user object
//     contact,
//     devicetoken,
//     role,
//     country, // Add country to the user object
//   });

//   res.status(201).json({
//     success: true,
//     message: "Registered Successfully",
//   });
// });

// const register = asyncError(async (req, res, next) => {
//   const { name, email, password, devicetoken, role, country, parentId } = req.body;

//   const normalizedEmail = email.toLowerCase();
//   let userCount = await User.countDocuments();
//   let userId = 1000 + userCount;
//   let userExists = true;

//   // Loop until a unique userId is found
//   while (userExists) {
//     let user = await User.findOne({ contact: userId });
//     if (!user) {
//       userExists = false;
//     } else {
//       userId++; // Increment userId
//     }
//   }

//   let user = await User.findOne({ email: normalizedEmail });
//   if (user) return next(new ErrorHandler("User Already Exists", 400));

//   // Check if parentId is provided
//   let partner = null;
//   if (parentId) {
//     partner = await PartnerModule.findOne({ userId: parentId });
//     if (!partner) {
//       return next(new ErrorHandler("Invalid parentId: No matching partner found", 400));
//     }
//   }

//   const contact = userId;

//   // Create the new user
//   user = await User.create({
//     name,
//     email: normalizedEmail,
//     password,
//     userId,
//     contact,
//     devicetoken,
//     role,
//     country,

//   });

//   // If parentId is valid, add the user to the parent partner's userList
//   if (partner) {
//     partner.userList.push(user._id);
//     await partner.save();
//   }

//   res.status(201).json({
//     success: true,
//     message: "Registered Successfully",
//   });
// });
const register = asyncError(async (req, res, next) => {
  const { name, email, password, devicetoken, role, country, parentId } =
    req.body;

  const normalizedEmail = email.toLowerCase();
  let userCount = await User.countDocuments();
  let userId = 1000 + userCount;
  let userExists = true;

  // Loop until a unique userId is found
  while (userExists) {
    let user = await User.findOne({ contact: userId });
    if (!user) {
      userExists = false;
    } else {
      userId++; // Increment userId
    }
  }

  let user = await User.findOne({ email: normalizedEmail });
  if (user) return next(new ErrorHandler("User Already Exists", 400));

  // Default values for parent IDs
  let parentPartnerId = 1000;
  let parentParentPartnerId = 1000;
  let topParentId = 1000;
  let rechargePaymentId = 1000;

  // Check if parentId is provided and valid
  let partner = null;
  if (parentId) {
    partner = await PartnerModule.findOne({ userId: parentId });
    if (!partner) {
      return next(
        new ErrorHandler("Invalid parentId: No matching partner found", 400)
      );
    }

    // Set hierarchical parent IDs
    parentPartnerId = partner.userId;
    parentParentPartnerId = partner.parentPartnerId;
    topParentId = partner.parentParentPartnerId;
    rechargePaymentId = partner.rechargePaymentId;
  }

  const contact = userId;

  // Create the new user
  user = await User.create({
    name,
    email: normalizedEmail,
    password,
    userId,
    contact,
    devicetoken,
    role,
    country,
    parentPartnerId,
    parentParentPartnerId,
    topParentId,
    rechargePaymentId,
  });

  // If parentId is valid, add the user to the parent partner's userList
  if (partner) {
    partner.userList.push(user._id);
    await partner.save();
  }

  res.status(201).json({
    success: true,
    message: "Registered Successfully",
  });
});

const getMyProfile = asyncError(async (req, res, next) => {
  const user = await User.findById(req.user._id)
    .populate("walletOne")
    .populate("walletTwo")
    .populate("country");

  res.status(200).json({
    success: true,
    user,
  });
});

const getUserDetails = asyncError(async (req, res, next) => {
  let query;

  // Check if the passed id is a valid MongoDB ObjectId
  if (mongoose.Types.ObjectId.isValid(req.params.id)) {
    query = { _id: req.params.id };
  } else {
    query = { userId: req.params.id };
  }

  const user = await User.findOne(query)
    .populate("walletOne")
    .populate("walletTwo")
    .populate("country");

  if (!user) return next(new ErrorHandler("User not found", 404));

  res.status(200).json({
    success: true,
    user,
  });
});

// Update Wallet One
const updateWalletOne = asyncError(async (req, res, next) => {
  try {
    const { walletId } = req.params;
    const { balance, walletName, visibility, paymentUpdateNote } = req.body;

    // Validate input
    if (!balance || isNaN(balance)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid balance value" });
    }

    if (balance) {
      const wallet = await WalletOne.findById(walletId);
      if (!wallet) {
        return res
          .status(404)
          .json({ success: false, message: "Wallet not found" });
      }

      const walletBalance = parseFloat(wallet.balance);
      const newWalletBalance = parseFloat(balance);
      let amount = 0;
      let paymentType = "";

      if (walletBalance > newWalletBalance) {
        amount = walletBalance - newWalletBalance;
        paymentType = "Debit";
      } else {
        amount = newWalletBalance - walletBalance;
        paymentType = "Credit";
      }

      // NOW GETTING THE CALCULATED AMOUNT

      const user = await User.findById(wallet.userId);

      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "user not found" });
      }

      const currency = await Currency.findById(user.country._id);
      if (!currency) {
        return next(new ErrorHandler("Currency not found", 404));
      }

      const currencyconverter = parseFloat(
        currency.countrycurrencyvaluecomparedtoinr
      );

      const convertedAmount =
        parseFloat(amount) * parseFloat(currencyconverter);
      console.log("convertedAmount :: " + convertedAmount);

      const transaction = await Transaction.create({
        amount,
        convertedAmount: amount,
        paymentType: paymentType,
        username: user.name,
        userId: user.userId,
        transactionType: "AdminUpdate",
        paymentStatus: "Completed",
        currency: user.country._id.toString(),
        walletName: wallet.walletName,
        paymentUpdateNote: paymentUpdateNote,
      });

      user.transactionHistory.push(transaction._id);
      await user.save();

      const walletTwoBalances = await WalletTwo.find({}).populate("currencyId");
      let gameBalance = 0;

      walletTwoBalances.forEach((wallet) => {
        const walletCurrencyConverter = parseFloat(
          wallet.currencyId.countrycurrencyvaluecomparedtoinr
        );
        gameBalance += wallet.balance * walletCurrencyConverter;
      });

      // Fetch all WalletOne balances and populate currencyId
      const walletOneBalances = await WalletOne.find({}).populate("currencyId");
      let withdrawalBalance = 0;

      walletOneBalances.forEach((wallet) => {
        const walletCurrencyConverter = parseFloat(
          wallet.currencyId.countrycurrencyvaluecomparedtoinr
        );
        withdrawalBalance += wallet.balance * walletCurrencyConverter;
      });

      // Add the additional amount with currency conversion

      if (walletBalance > newWalletBalance) {
        withdrawalBalance -= parseFloat(amount * currencyconverter);
      } else {
        withdrawalBalance += parseFloat(amount * currencyconverter);
      }

      // Calculate total balance as the sum of walletOne and walletTwo balances
      const totalBalance = withdrawalBalance + gameBalance;

      // Create a new AppBalanceSheet document
      const appBalanceSheet = new AppBalanceSheet({
        amount: parseFloat(amount * currencyconverter),
        withdrawalbalance: withdrawalBalance,
        gamebalance: gameBalance,
        totalbalance: totalBalance,
        usercurrency: user.country._id.toString(),
        activityType: "AdminUpdate",
        userId: user.userId,
        transactionId: transaction._id,
        paymentProcessType: paymentType,
        walletName: wallet.walletName,
        paymentUpdateNote: paymentUpdateNote,
      });

      // Save the AppBalanceSheet document
      await appBalanceSheet.save();
      console.log("AppBalanceSheet Created Successfully");
    }

    // Update wallet
    const updatedWallet = await WalletOne.findByIdAndUpdate(
      walletId,
      { balance, walletName, visibility },
      { new: true }
    );

    if (!updatedWallet) {
      return res
        .status(404)
        .json({ success: false, message: "Wallet not found" });
    }

    res.status(200).json({ success: true, updatedWallet });
  } catch (error) {
    console.error("Error updating wallet:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Update Wallet Two
const updateWalletTwo = asyncError(async (req, res, next) => {
  try {
    const { walletId } = req.params;
    const { balance, walletName, visibility, paymentUpdateNote } = req.body;

    // Validate input
    if (!balance || isNaN(balance)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid balance value" });
    }

    if (balance) {
      const wallet = await WalletTwo.findById(walletId);
      if (!wallet) {
        return res
          .status(404)
          .json({ success: false, message: "Wallet not found" });
      }

      const walletBalance = parseFloat(wallet.balance);
      const newWalletBalance = parseFloat(balance);
      let amount = 0;
      let paymentType = "";

      if (walletBalance > newWalletBalance) {
        amount = walletBalance - newWalletBalance;
        paymentType = "Debit";
      } else {
        amount = newWalletBalance - walletBalance;
        paymentType = "Credit";
      }

      // NOW GETTING THE CALCULATED AMOUNT

      const user = await User.findById(wallet.userId);

      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "user not found" });
      }

      const currency = await Currency.findById(user.country._id);
      if (!currency) {
        return next(new ErrorHandler("Currency not found", 404));
      }

      const currencyconverter = parseFloat(
        currency.countrycurrencyvaluecomparedtoinr
      );

      const convertedAmount =
        parseFloat(amount) * parseFloat(currencyconverter);
      console.log("convertedAmount :: " + convertedAmount);

      const transaction = await Transaction.create({
        amount,
        convertedAmount: amount,
        paymentType: paymentType,
        username: user.name,
        userId: user.userId,
        transactionType: "AdminUpdate",
        paymentStatus: "Completed",
        currency: user.country._id.toString(),
        walletName: wallet.walletName,
        paymentUpdateNote: paymentUpdateNote,
      });

      user.transactionHistory.push(transaction._id);
      await user.save();

      const walletTwoBalances = await WalletTwo.find({}).populate("currencyId");
      let gameBalance = 0;

      walletTwoBalances.forEach((wallet) => {
        const walletCurrencyConverter = parseFloat(
          wallet.currencyId.countrycurrencyvaluecomparedtoinr
        );
        gameBalance += wallet.balance * walletCurrencyConverter;
      });

      // Fetch all WalletOne balances and populate currencyId
      const walletOneBalances = await WalletOne.find({}).populate("currencyId");
      let withdrawalBalance = 0;

      walletOneBalances.forEach((wallet) => {
        const walletCurrencyConverter = parseFloat(
          wallet.currencyId.countrycurrencyvaluecomparedtoinr
        );
        withdrawalBalance += wallet.balance * walletCurrencyConverter;
      });

      // Add the additional amount with currency conversion

      if (walletBalance > newWalletBalance) {
        gameBalance -= parseFloat(amount * currencyconverter);
      } else {
        gameBalance += parseFloat(amount * currencyconverter);
      }

      // Calculate total balance as the sum of walletOne and walletTwo balances
      const totalBalance = withdrawalBalance + gameBalance;

      // Create a new AppBalanceSheet document
      const appBalanceSheet = new AppBalanceSheet({
        amount: parseFloat(amount * currencyconverter),
        withdrawalbalance: withdrawalBalance,
        gamebalance: gameBalance,
        totalbalance: totalBalance,
        usercurrency: user.country._id.toString(),
        activityType: "AdminUpdate",
        userId: user.userId,
        transactionId: transaction._id,
        paymentProcessType: paymentType,
        walletName: wallet.walletName,
      });

      // Save the AppBalanceSheet document
      await appBalanceSheet.save();
      console.log("AppBalanceSheet Created Successfully");
    }

    // Update wallet
    const updatedWallet = await WalletTwo.findByIdAndUpdate(
      walletId,
      { balance, walletName, visibility },
      { new: true }
    );

    if (!updatedWallet) {
      return res
        .status(404)
        .json({ success: false, message: "Wallet not found" });
    }

    res.status(200).json({ success: true, updatedWallet });
  } catch (error) {
    console.error("Error updating wallet:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

const logout = asyncError(async (req, res, next) => {
  res
    .status(200)
    .cookie("token", "", {
      ...cookieOptions,
      expires: new Date(Date.now),
    })
    .json({
      success: true,
      message: "Logout successfully",
    });
});

const updateProfile = asyncError(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  const { name, email, contact } = req.body;

  if (name) user.name = name;

  // if (email) user.email = email;

  if (email) {
    let old_user = await User.findOne({ email });
    if (old_user) return next(new ErrorHandler("User Already exist", 400));
    user.email = email;
  }

  if (contact) {
    let old_user = await User.findOne({ contact });
    if (old_user) return next(new ErrorHandler("Contact Already exist", 400));
    user.contact = contact;
  }

  await user.save();

  res.status(200).json({
    success: true,
    message: "Profile Updated Successfully",
  });
});

const updateRole = asyncError(async (req, res, next) => {
  const { id, role } = req.body;

  const user = await User.findById(id);

  if (!id) return next(new ErrorHandler("user not found", 400));

  if (!role) return next(new ErrorHandler("please provide role ", 400));

  if (role) user.role = role;

  await user.save();

  res.status(200).json({
    success: true,
    message: "Role Updated Successfully",
  });
});

const changePassword = asyncError(async (req, res, next) => {
  const user = await User.findById(req.user._id).select("+password");

  const { oldPassword, newPassword } = req.body;

  // Checking the user have enter old and new password
  if (!oldPassword && !newPassword)
    return next(new ErrorHandler("Please enter old and new password", 400));

  const isMatched = await user.comparePassword(oldPassword);

  if (!isMatched) {
    return next(new ErrorHandler("Incorrect Old Password", 400));
  }

  user.password = newPassword;

  await user.save();

  res.status(200).json({
    success: true,
    message: "Password Changed Successfully",
  });
});

// Upload Profile pic work is not completed i have to research something because i dont want to use cloundinay
const updatePic = asyncError(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  // req.file
  const file = getDataUri();

  // add cloundinary

  res.status(200).json({
    success: true,
    user,
  });
});

const forgetPassword = asyncError(async (req, res, next) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) return next(new ErrorHandler("Incorrect email", 404));

  // Generating 6 digit otp
  // max,min 2000,10000
  // math.random()*(max-min)+min

  const randomSixDitgitNumber = Math.random() * (999999 - 100000) + 100000;
  const otp = Math.floor(randomSixDitgitNumber);
  const otp_expire = 15 * 60 * 1000;

  // Adding to the user otp
  user.otp = otp;
  user.otp_expire = new Date(Date.now() + otp_expire);

  // console.log("OTP CODE :: " + otp);

  await user.save();

  // After Saving the otp we have to send a email
  // sendEmail()

  const message = `Your OTP For Reseting Password is ${otp}\nPlease ignore if you haven't requested this`;

  try {
    await sendEmail("OTP for resetting password", user.email, message);
  } catch (error) {
    user.otp = null;
    user.otp_expire = null;

    await user.save();
    return next(error);
  }

  res.status(200).json({
    success: true,
    message: `Verification code has been sent to ${user.email}`,
  });
});

const resetPassword = asyncError(async (req, res, next) => {
  const { otp, password } = req.body;

  const user = await User.findOne({
    otp,
    otp_expire: {
      $gt: Date.now(),
    },
  });

  if (!user)
    return next(new ErrorHandler("Incorrect OTP or OTP has been expired", 400));

  if (!password)
    return next(new ErrorHandler("Please enter new password ", 400));

  user.password = password;
  user.otp = undefined;
  user.otp_expire = undefined;

  await user.save();

  res.status(200).json({
    success: true,
    message: "Password changed successfully , you can login now",
  });
});

// const deleteNotification = asyncError(async (req, res, next) => {
//   const { id } = req.params;
//   // Find the promotion by ID and delete it
//   const deletedNotification = await Notification.findByIdAndDelete(id);

//   if (!deletedNotification) {
//     return res.status(404).json({
//       success: false,
//       message: "Notification not found",
//     });
//   }

//   res.status(200).json({
//     success: true,
//     message: "Successfully Deleted",
//     deletedNotification,
//   });
// });

const deleteNotification = asyncError(async (req, res, next) => {
  const { id } = req.params;

  // Find and delete the notification by ID
  const deletedNotification = await Notification.findByIdAndDelete(id);

  if (!deletedNotification) {
    return res.status(404).json({
      success: false,
      message: "Notification not found",
    });
  }

  // Remove the deleted notification's ID from all users' notification lists
  await User.updateMany(
    { notifications: id },
    { $pull: { notifications: id } }
  );

  res.status(200).json({
    success: true,
    message: "Notification deleted and removed from user notification lists",
    deletedNotification,
  });
});

const updateProfilePic = asyncError(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  // Check if a file is provided in the request
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "No file uploaded",
    });
  }

  const { filename } = req.file;

  // Get the directory name of the current module using __dirname
  const currentDir = pathModule.dirname(__filename); // Use __filename instead of import.meta.url

  // If user already has an avatar, delete the previous image
  if (user.avatar && user.avatar.url) {
    // Construct the path to the previous image
    const previousImagePath = pathModule.join(
      currentDir,
      "..",
      "public",
      "uploads",
      user.avatar.url
    );
    try {
      // Delete the previous image from the server
      fs.unlinkSync(previousImagePath);
    } catch (err) {
      console.error("Error deleting previous image:", err);
    }
  }

  console.log(req.file);

  const file = getDataUri(req.file);

  user.avatar = {
    public_id: req.user._id,
    url: filename,
  };

  await user.save();

  res.status(200).json({
    success: true,
    message: "Profile Pic Updated Successfully",
  });
});

// const updateProfilePic = asyncError(async (req, res, next) => {
//   const user = await User.findById(req.user._id);

//   // Check if a file is provided in the request
//   if (!req.file) {
//     return res.status(400).json({
//       success: false,
//       message: "No file uploaded",
//     });
//   }

//   const { filename } = req.file;

//   // If user already has an avatar, delete the previous image
//   if (user.avatar && user.avatar.url) {
//     try {
//       // Delete the previous image from the server
//       fs.unlinkSync(pathModule.join(__dirname, "..", "public", "uploads", user.avatar.url));

//     } catch (err) {
//       console.error("Error deleting previous image:", err);
//     }
//   }

//   // Update the user's avatar with the new filename
//   user.avatar = {
//     public_id: req.user._id,
//     url: filename,
//   };

//   // Save the updated user object
//   await user.save();

//   res.status(200).json({
//     success: true,
//     message: "Profile Pic Updated Successfully",
//     avatar: user.avatar // Send updated avatar information in response
//   });
// });

// New Testing for creating and updating profile picture
const createProfilePic = asyncError(async (req, res, next) => {
  // Check if a file is provided in the request
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "No file uploaded",
    });
  }

  const { filename } = req.file;

  // Assuming you have some user ID available in the request
  const userId = req.user._id;

  // Find the user by ID
  const user = await User.findById(userId);

  // Update the user's avatar with the new filename
  user.avatar = {
    public_id: userId,
    url: filename,
  };

  // Save the updated user object
  await user.save();

  res.status(201).json({
    success: true,
    message: "Profile Pic Created Successfully",
    avatar: user.avatar, // Send updated avatar information in response
  });
});

// const updateProfilePic = asyncError(async (req, res, next) => {
//   // Check if a file is provided in the request
//   if (!req.file) {
//     return res.status(400).json({
//       success: false,
//       message: "No file uploaded",
//     });
//   }

//   const { filename } = req.file;

//   // Assuming you have some user ID available in the request
//   const userId = req.user._id;

//   // Find the user by ID
//   const user = await User.findById(userId);

//   // If user already has an avatar, delete the previous image
//   if (user.avatar && user.avatar.url) {
//     try {
//       // Delete the previous image from the server
//       fs.unlinkSync(pathModule.join(__dirname, "..", "public", "uploads", user.avatar.url));

//     } catch (err) {
//       console.error("Error deleting previous image:", err);
//     }
//   }

//   // Update the user's avatar with the new filename
//   user.avatar = {
//     public_id: userId,
//     url: filename,
//   };

//   // Save the updated user object
//   await user.save();

//   res.status(200).json({
//     success: true,
//     message: "Profile Pic Updated Successfully",
//     avatar: user.avatar // Send updated avatar information in response
//   });
// });

// For uploading profile pic
const getProfilePic = asyncError(async (req, res, next) => {
  // await User.findById(req.user._id);
  const users = await User.find();

  res.status(200).json({
    success: true,
    message: users,
  });
});

const addPromotion = asyncError(async (req, res, next) => {
  console.log(req.file);

  const { filename, path, mimetype } = req.file;

  // const uniqueFilename = `${Date.now()}${filename}`;

  // Assuming you want to save public_id and url of the image in the database
  const promotionData = {
    url: filename,
    // visibility: req.body.visibility, // Assuming you're passing visibility in the request body
  };

  // Create a new promotion record in the database
  await Promotion.create(promotionData);

  res.status(200).json({
    success: true,
    message: "Promotions Added Successfully",
  });
});

const getAllPromotions = asyncError(async (req, res, next) => {
  const promotions = await Promotion.find({});
  res.status(200).json({
    success: true,
    promotions,
  });
});

const deletePromotion = asyncError(async (req, res, next) => {
  const { id } = req.params;

  // Find the promotion by ID and delete it
  const deletedPromotion = await Promotion.findByIdAndDelete(id);

  if (!deletedPromotion) {
    return res.status(404).json({
      success: false,
      message: "Promotion not found",
    });
  }

  res.status(200).json({
    success: true,
    message: "Promotion deleted successfully",
    deletedPromotion,
  });
});

const updatePromotion = asyncError(async (req, res, next) => {
  const { visibility } = req.body;

  const promotion = await Promotion.findById(req.params.id);

  if (!promotion) return next(new ErrorHandler("Promotion not found", 404));

  console.log("Existing visibility:", promotion.visibility);
  console.log("New visibility:", visibility);

  promotion.visibility = visibility;

  await promotion.save();

  res.status(200).json({
    success: true,
    message: "Promotion Updated Successfully",
    promotion,
  });
});

const updateAnyUserUserId = asyncError(async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const newUserId = req.body.newUserId;

    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid user id" });
    }

    if (!newUserId) {
      return res
        .status(400)
        .json({ success: false, message: "New userid missing" });
    }

    // Check if the new userId is unique and not used by any other user
    const existingUser = await User.findOne({ userId: newUserId });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "New userId is already taken." });
    }

    // Find the user by the provided userId
    const user = await User.findOne({ userId: userId });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    // Update the userId of the user

    console.log("Getting user info for checking id and contact");
    console.log(user.contact);
    console.log(user.userId);

    if (user.contact === String(user.userId)) {
      user.contact = newUserId;
    }
    user.userId = newUserId;
    await user.save();

    return res
      .status(200)
      .json({ success: true, message: "User userId updated successfully." });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
});

// Controller to update subadmin features for a user by userId

const updateSubadminFeatures = asyncError(async (req, res, next) => {
  const userId = req.params.userId; // Extract userId from request parameters
  const newFeatures = req.body; // Extract the features object from the request body

  // Validate userId
  if (!userId) {
    return res.status(400).json({ success: false, message: "Invalid user id" });
  }

  // Validate the features object
  if (!newFeatures || typeof newFeatures !== "object") {
    return res.status(400).json({
      success: false,
      message: "Features object is missing or invalid",
    });
  }

  // Find the user by userId
  const user = await User.findOne({ userId });

  // Check if user exists
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found." });
  }

  // Update the subadminFeatures of the user
  user.subadminfeature = { ...user.subadminfeature.toObject(), ...newFeatures }; // Merge existing features with new ones

  // Save the updated user document
  await user.save();

  return res.status(200).json({
    success: true,
    message: "Subadmin features updated successfully.",
    subadminFeatures: user.subadminfeature,
  });
});

// Controller to delete a user by userId
const deleteUser = asyncError(async (req, res, next) => {
  const userId = req.params.userId; // Extract userId from request parameters

  // Validate userId
  if (!userId) {
    return res.status(400).json({ success: false, message: "Invalid user id" });
  }

  // Find the user by userId and delete
  const user = await User.findOneAndDelete({ userId });

  // Check if user was found and deleted
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found." });
  }

  // Respond with a success message
  return res
    .status(200)
    .json({ success: true, message: "User deleted successfully." });
});

// Controller to update user password
// const updateUserPassword = async (req, res, next) => {
//   const { userId } = req.params; // Extract userId from request parameters
//   const { newPassword } = req.body; // Extract newPassword from request body

//   // Validate input
//   if (!userId || !newPassword) {
//     return res.status(400).json({ success: false, message: "User ID and new password are required." });
//   }

//   try {
//     // Find the user by userId
//     const user = await User.findOne({ userId });

//     // Check if user exists
//     if (!user) {
//       return res.status(404).json({ success: false, message: "User not found." });
//     }

//     // Hash the new password
//     user.password = await bcrypt.hash(newPassword, 10);

//     // Save the updated user document
//     await user.save();

//     // Respond with success message
//     return res.status(200).json({ success: true, message: "Password updated successfully." });
//   } catch (error) {
//     // Handle any errors that occur during the process
//     return next(new ErrorHandler(error.message, 500));
//   }
// };

// Controller function to update password
const updateUserPassword = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { newPassword } = req.body;

    // Find the user by userId
    const user = await User.findOne({ userId }).select("+password");

    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }

    // Update the user's password (pre-save hook will hash the password)
    user.password = newPassword;

    // Save the user to trigger the pre-save hook for password hashing
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
};

// For Admin

// ####################
// ALL USER
// ####################

// const getAllNotification = asyncError(async (req, res, next) => {
//   const notifications = await Notification.find({}).sort({ createdAt: -1 });

//   res.status(200).json({
//     success: true,
//     notifications,
//   });
// });

const getAllNotification = asyncError(async (req, res, next) => {
  const notifications = await Notification.find({}).sort({ _id: -1 });

  res.status(200).json({
    success: true,
    notifications,
  });
});

const getAllUser = asyncError(async (req, res, next) => {
  const users = await User.find({})
    .populate("walletOne")
    .populate("walletTwo")
    .populate("country")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    users,
  });
});

// Get Single User Notification
const singleUserNotification = asyncError(async (req, res, next) => {
  try {
    const userId = req.params.userId;

    const notification = await Notification.findById(userId);

    if (!notification)
      return next(new ErrorHandler("Notification not found", 404));

    res.status(200).json({
      success: true,
      notification,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
});

// Send notification to all user

async function removeUnregisteredToken(token) {
  try {
    // Find the user with the given token and remove it from the database
    const result = await User.deleteOne({ devicetoken: token });
    if (result.deletedCount > 0) {
      console.log(`Removed unregistered token from the database`);
    } else {
      console.log(`User with token "${token}" not found in the database.`);
    }
  } catch (error) {
    console.error("Error removing unregistered token:", error);
    // You can choose to handle the error further if needed
  }
}

// Your notification sending function
// const sendNotificationToAllUser = asyncError(async (req, res, next) => {
//   const users = await User.find({})
//     .populate("walletOne")
//     .populate("walletTwo")
//     .sort({ createdAt: -1 });
//   const { title, description } = req.body;

//   console.log("Noti title :: " + title);
//   console.log("Noti Description :: " + description);

//   if (!title) return next(new ErrorHandler("Enter Notification title", 400));
//   if (!description)
//     return next(new ErrorHandler("Enter Notification Description", 400));

//   const tokens = [];

//   console.log("before tokens.length :: " + tokens.length);
//   console.log("users.length :: " + users.length);

//   for (const user of users) {
//     if (user.devicetoken) {
//       console.log(JSON.stringify(user));
//       tokens.push(user.devicetoken);
//     }
//   }

//   console.log("tokens.length :: " + tokens.length);
//   console.log("tokens :: " + JSON.stringify(tokens));

//   if (tokens.length === 0) return next(new ErrorHandler("No user found", 400));

//   try {
//     for (const token of tokens) {
//       await firebase.messaging().send({
//         token,
//         notification: {
//           title: title,
//           body: description,
//         },
//       });
//     }

//     const notification = new Notification({
//       title: title,
//       description: description,
//     });
//     await notification.save();

//     console.log("Notifications sent to all users");
//     res.status(200).json({
//       success: true,
//       message: "Notification sent successfully",
//     });
//   } catch (error) {
//     if (error.code === "messaging/registration-token-not-registered") {
//       // Handle unregistered token error
//       console.log("Unregistered token:", error.errorInfo.message);
//       // Capture the token that caused the error
//       const unregisteredToken = error.errorInfo.message.split(" ")[0];
//       // Remove the unregistered token from your database
//       await removeUnregisteredToken(unregisteredToken);
//     } else {
//       console.log(error);
//       next(new ErrorHandler(error, 400));
//     }
//   }
// });

// const sendNotificationToAllUser = asyncError(async (req, res, next) => {
//   const { title, description } = req.body;

//   // Validate title and description
//   if (!title) return next(new ErrorHandler("Enter Notification title", 400));
//   if (!description)
//     return next(new ErrorHandler("Enter Notification Description", 400));

//   try {
//     // Create a new notification in the database
//     const notification = new Notification({
//       title,
//       description,
//     });
//     await notification.save();

//     // Fetch users with non-null devicetoken
//     const users = await User.find({ devicetoken: { $ne: null } })
//       .populate("walletOne")
//       .populate("walletTwo")
//       .sort({ createdAt: -1 });

//     const tokens = users.map((user) => user.devicetoken).filter(Boolean);

//     console.log("tokens.length :: " + tokens.length);
//     console.log("tokens :: " + JSON.stringify(tokens));

//     if (tokens.length === 0) {
//       return res.status(200).json({
//         success: true,
//         message:
//           "No valid device tokens found. Notifications created in database.",
//       });
//     }

//     const failedTokens = [];

//     for (const token of tokens) {
//       try {
//         await firebase.messaging().send({
//           token,
//           notification: {
//             title: title,
//             body: description,
//           },
//         });
//       } catch (error) {
//         if (error.code === "messaging/registration-token-not-registered") {
//           // Handle unregistered token error
//           console.log("Unregistered token:", error.errorInfo.message);
//           // Capture the token that caused the error
//           const unregisteredToken = error.errorInfo.message.split(" ")[0];
//           // Remove the unregistered token from your database
//           await removeUnregisteredToken(unregisteredToken);
//         } else {
//           console.log("Error sending notification to token:", token);
//           console.error(error);
//           failedTokens.push(token);
//         }
//       }
//     }

//     // Update all users' notification lists
//     await User.updateMany(
//       { devicetoken: { $ne: null } }, // Match users with a device token
//       { $push: { notifications: notification._id } } // Add the notification ID to their notifications array
//     );

//     res.status(200).json({
//       success: true,
//       message: "Notification processed successfully",
//       notification,
//       failedTokens,
//     });
//   } catch (error) {
//     console.error(error);
//     next(new ErrorHandler("Internal server error", 500));
//   }
// });

const sendNotificationToAllUser = asyncError(async (req, res, next) => {
  const { title, description } = req.body;

  // Validate title and description
  if (!title) return next(new ErrorHandler("Enter Notification title", 400));
  if (!description)
    return next(new ErrorHandler("Enter Notification Description", 400));

  try {
    // Create a new notification in the database
    const notification = new Notification({
      title,
      description,
    });
    await notification.save();

    // Fetch users whose role is 'user' and have a valid devicetoken
    const users = await User.find({
      role: "user", // Ensure users with role 'user'
      devicetoken: { $ne: null }, // Only users with non-null devicetokens
    })
      .populate("walletOne")
      .populate("walletTwo")
      .sort({ createdAt: -1 });

    // Extract valid device tokens
    const tokens = users.map((user) => user.devicetoken).filter(Boolean);

    console.log("tokens.length :: " + tokens.length);
    console.log("tokens :: " + JSON.stringify(tokens));

    // If no valid tokens are found, return early
    if (tokens.length === 0) {
      return res.status(200).json({
        success: true,
        message:
          "No valid device tokens found. Notifications created in database.",
      });
    }

    const failedTokens = [];

    for (const token of tokens) {
      try {
        // Send FCM notification to each valid token
        await firebase.messaging().send({
          token,
          notification: {
            title: title,
            body: description,
          },
        });
      } catch (error) {
        // Handle unregistered token error
        if (error.code === "messaging/registration-token-not-registered") {
          console.log("Unregistered token:", error.errorInfo.message);
          const unregisteredToken = error.errorInfo.message.split(" ")[0];
          await removeUnregisteredToken(unregisteredToken); // Remove unregistered token from DB
        } else {
          console.log("Error sending notification to token:", token);
          console.error(error);
          failedTokens.push(token);
        }
      }
    }

    // Add the notification ID to the notification array of all users (whether they received the FCM or not)
    await User.updateMany(
      { role: "user" }, // Ensure only users with role 'user'
      { $push: { notifications: notification._id } } // Add notification ID to their notifications array
    );

    res.status(200).json({
      success: true,
      message: "Notification processed successfully",
      notification,
      failedTokens,
    });
  } catch (error) {
    console.error(error);
    next(new ErrorHandler("Internal server error", 500));
  }
});

const getUserNotifications = asyncError(async (req, res, next) => {
  const { userId } = req.params;

  // Check if the provided userId is a valid MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return next(new ErrorHandler("Invalid user ID", 400));
  }

  try {
    // Find the user by ID and populate the notifications array
    const user = await User.findById(userId).populate({
      path: "notifications",
      options: { sort: { createdAt: -1 } }, // Sort notifications by createdAt in descending order
    });

    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }

    // Return the populated notifications array
    res.status(200).json({
      success: true,
      notifications: user.notifications,
    });
  } catch (error) {
    next(new ErrorHandler(error.message, 500));
  }
});

const markUserNotificationsAsSeen = asyncError(async (req, res, next) => {
  const { userId } = req.params;

  // Validate userId
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return next(new ErrorHandler("Invalid user ID", 400));
  }

  try {
    // Find the user by ID and ensure they exist
    const user = await User.findById(userId);

    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }

    // Update only the notifications that belong to this specific user
    await Notification.updateMany(
      { _id: { $in: user.notifications } }, // Check if notification ID exists in the user's notifications array
      { $set: { seennow: true } } // Set the seenNow field to true
    );

    res.status(200).json({
      success: true,
      message: "User's notifications marked as seen",
    });
  } catch (error) {
    next(new ErrorHandler(error.message, 500));
  }
});

const sendNotificationToSingleUser = asyncError(async (req, res, next) => {
  const { title, description, devicetoken, userId } = req.body;

  // Check for required fields
  if (!title) return next(new ErrorHandler("Enter Notification title", 400));
  if (!description)
    return next(new ErrorHandler("Enter Notification Description", 400));

  try {
    // Create a new notification in the database
    const notification = await Notification.create({ title, description });

    // Find the user and add the notification to their notification list
    const user = await User.findByIdAndUpdate(
      userId,
      { $push: { notifications: notification._id } },
      { new: true }
    );

    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }

    // If a device token is provided, try to send the notification via Firebase
    if (devicetoken) {
      try {
        await firebase.messaging().send({
          token: devicetoken,
          notification: {
            title: title,
            body: description,
          },
        });
        console.log("Firebase notification sent");
      } catch (error) {
        // Log the error, but do not interrupt the response flow
        console.error("Error sending Firebase notification:", error);
      }
    } else {
      console.log("Device token not provided, skipping Firebase notification");
    }

    // Respond with success, regardless of the Firebase result
    res.status(200).json({
      success: true,
      message: "Notification processed successfully",
      notification,
    });
  } catch (error) {
    next(new ErrorHandler(error.message, 500));
  }
});

// const sendNotificationToSingleUser = asyncError(async (req, res, next) => {
//   const { title, description, devicetoken, userId } = req.body;

//   // Check for required fields
//   if (!title) return next(new ErrorHandler("Enter Notification title", 400));
//   if (!description)
//     return next(new ErrorHandler("Enter Notification Description", 400));

//   try {
//     // Create a new notification in the database
//     const notification = await Notification.create({ title, description });

//     // Find the user and add the notification to their notification list
//     const user = await User.findByIdAndUpdate(
//       userId,
//       { $push: { notifications: notification._id } },
//       { new: true }
//     );

//     if (!user) {
//       return next(new ErrorHandler("User not found", 404));
//     }

//     // If a device token is provided, send the notification via Firebase
//     if (devicetoken) {
//       try {
//         await firebase.messaging().send({
//           token: devicetoken,
//           notification: {
//             title: title,
//             body: description,
//           },
//         });
//         console.log("Firebase notification sent");
//       } catch (error) {
//         console.error("Error sending Firebase notification:", error);
//         return next(new ErrorHandler("Failed to send Firebase notification", 500));
//       }
//     } else {
//       console.log("Device token not provided, skipping Firebase notification");
//     }

//     res.status(200).json({
//       success: true,
//       message: "Notification processed successfully",
//       notification,
//     });
//   } catch (error) {
//     next(new ErrorHandler(error.message, 500));
//   }
// });

// const sendNotificationToSingleUser = asyncError(async (req, res, next) => {
//   const users = await User.find({})
//     .populate("walletOne")
//     .populate("walletTwo")
//     .sort({ createdAt: -1 });
//   const { title, description, devicetoken, userId } = req.body;

//   console.log("Noti title :: " + title);
//   console.log("Noti Descrtipton :: " + description);

//   if (!title) return next(new ErrorHandler("Enter Notification title", 400));
//   if (!description)
//     return next(new ErrorHandler("Enter Notification Description", 400));
//   if (!devicetoken)
//     return next(new ErrorHandler("Device token not found", 400));

//   try {
//     await firebase.messaging().send({
//       token: devicetoken,
//       notification: {
//         // Notification content goes here
//         title: title,
//         body: description,
//       },
//     });

//     console.log("Notification sent and saved");
//   } catch (error) {
//     console.log(error);
//     next(new ErrorHandler(error, 400));
//   }

//   res.status(200).json({
//     success: true,
//     message: "Notification sent successfully",
//   });
// });

// All user who have register in last 24 hour

const getAllUserRegisterInLastOneDay = asyncError(async (req, res, next) => {
  // Get the current date and time in UTC
  const currentDate = new Date();
  const currentUTCDate = new Date(currentDate.toISOString());

  // Subtract 24 hours from the current date to get the date/time 24 hours ago
  const twentyFourHoursAgo = new Date(
    currentUTCDate.getTime() - 24 * 60 * 60 * 1000
  );

  // Find users created within the last 24 hours
  const users = await User.find({ createdAt: { $gte: twentyFourHoursAgo } })
    .populate("walletOne")
    .populate("walletTwo")
    .populate("country")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    users,
  });
});

const getAllSubadmin = asyncError(async (req, res, next) => {
  // Find users created within the last 24 hours
  const users = await User.find({ role: "subadmin" })
    .populate("walletOne")
    .populate("walletTwo")
    .populate("country")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    users,
  });
});

// #############################
//  About us Section
// #############################

// About us update

const updateAbout = asyncError(async (req, res, next) => {
  const about = await LotAppAbout.findById(req.params.id);

  if (!about) return next(new ErrorHandler("about not found", 404));

  const { aboutTitle, aboutDescription } = req.body;

  if (aboutTitle) about.aboutTitle = aboutTitle;
  if (aboutDescription) about.aboutDescription = aboutDescription;

  await about.save();

  res.status(200).json({
    success: true,
    message: "Updated Successfully",
  });
});

// Create Abuut app content
const createAbout = asyncError(async (req, res, next) => {
  const { aboutTitle, aboutDescription } = req.body;
  // if (!result) return next(new ErrorHandler("Result not found", 404))
  await LotAppAbout.create({ aboutTitle, aboutDescription });

  res.status(200).json({
    success: true,
    message: "Successfully added about us",
  });
});

const deleteAbout = asyncError(async (req, res, next) => {
  const { id } = req.params;

  // Find the promotion by ID and delete it
  const deletedAbout = await LotAppAbout.findByIdAndDelete(id);

  if (!deletedAbout) {
    return res.status(404).json({
      success: false,
      message: "About not found",
    });
  }

  res.status(200).json({
    success: true,
    message: "Successfully Deleted",
    deleteAbout,
  });
});

// Get all About Us
const getAllAbout = asyncError(async (req, res, next) => {
  const aboutus = await LotAppAbout.find({});

  res.status(200).json({
    success: true,
    aboutus,
  });
});

// Get All WalletOne
const getAllWalletOne = asyncError(async (req, res, next) => {
  const wallets = await WalletOne.find({});

  res.status(200).json({
    success: true,
    wallets,
  });
});

// Get All WalletTwo
const getAllWalletTwo = asyncError(async (req, res, next) => {
  const wallets = await WalletTwo.find({});

  res.status(200).json({
    success: true,
    wallets,
  });
});

// Update Wallet name
// Controller function to update wallet names in all data
const updateAllWalletNameOne = asyncError(async (req, res, next) => {
  const walletName = req.body.walletName; // Assuming you pass new wallet name in the request body

  // Update wallet names in all data
  await WalletOne.updateMany({}, { $set: { walletName: walletName } });

  res.status(200).json({
    success: true,
    message: "Wallet names updated successfully in all data.",
  });
});

// Update Wallet name
// Controller function to update wallet names in all data
const updateAllWalletNameTwo = asyncError(async (req, res, next) => {
  const walletName = req.body.walletName; // Assuming you pass new wallet name in the request body

  // Update wallet names in all data
  await WalletTwo.updateMany({}, { $set: { walletName: walletName } });

  res.status(200).json({
    success: true,
    message: "Wallet names updated successfully in all data.",
  });
});

// TRANSFER AMOUNT FROM WALLET ONE TO WALLET TWO
// Update Wallet Two

// const transferAmountFromWalletOneToWalletTwo = asyncError(
//   async (req, res, next) => {
//     try {
//       const { userid, amount } = req.body;

//       // Validate input
//       if (!amount || isNaN(amount) || amount <= 0) {
//         return res
//           .status(400)
//           .json({ success: false, message: "Invalid amount value" });
//       }

//       // Find the user
//       const user = await User.findById(userid)
//         .populate("walletOne")
//         .populate("walletTwo");
//       if (!user) {
//         return res
//           .status(404)
//           .json({ success: false, message: "User not found" });
//       }

//       const walletOne = user.walletOne;
//       const walletTwo = user.walletTwo;

//       // Check if walletOne has sufficient balance
//       if (walletOne.balance < amount) {
//         return res.status(400).json({
//           success: false,
//           message: "Insufficient balance in walletOne",
//         });
//       }

//       const currency = await Currency.findById(user.country._id);
//       if (!currency) {
//         return next(new ErrorHandler("Currency not found", 404));
//       }

//       const currencyconverter = parseFloat(
//         currency.countrycurrencyvaluecomparedtoinr
//       );

//       // Perform the transfer, ensuring balance is treated as a number

//       // walletOne.balance = parseFloat(walletOne.balance) - parseFloat(amount);
//       // walletTwo.balance = parseFloat(walletTwo.balance) + parseFloat(amount);
//       walletOne.balance = Number(walletOne.balance) - Number(amount);
//       walletTwo.balance = Number(walletTwo.balance) + Number(amount);

//       // // Save the updated wallets
//       // await walletOne.save();
//       // await walletTwo.save();

//       // FOR BALANCE SHEET

//       // Create AppBalanceSheet entry
//       // Calculate gameBalance as the total sum of all walletTwo balances  + totalAmount

//       // const walletTwoBalances = await WalletTwo.find({});
//       // const gameBalance =
//       //   walletTwoBalances.reduce((sum, wallet) => sum + wallet.balance, 0) +
//       //   amount;
//       // const walletTwoBalances = await WalletTwo.find({});
//       // const gameBalance =
//       //   walletTwoBalances.reduce(
//       //     (sum, wallet) => sum + parseFloat(wallet.balance),
//       //     0
//       //   ) + parseFloat(amount);

//       // // Calculate walletOneBalances as the total sum of all walletOne balances - totalAmount
//       // const walletOneBalances = await WalletOne.find({});
//       // const withdrawalBalance =
//       //   walletOneBalances.reduce((sum, wallet) => sum + wallet.balance, 0) -
//       //   amount;

//       // // Calculate totalbalance as the total sum of walletOne and walletTwo balances add totalAmount
//       // const totalBalance =
//       //   parseFloat(withdrawalBalance) + parseFloat(gameBalance);

//       // Fetch all WalletTwo balances and populate currencyId
//       const walletTwoBalances = await WalletTwo.find({}).populate("currencyId");
//       let gameBalance = 0;

//       walletTwoBalances.forEach((wallet) => {
//         const walletCurrencyConverter = parseFloat(
//           wallet.currencyId.countrycurrencyvaluecomparedtoinr
//         );
//         gameBalance += wallet.balance * walletCurrencyConverter;
//       });

//       // Fetch all WalletOne balances and populate currencyId
//       const walletOneBalances = await WalletOne.find({}).populate("currencyId");
//       let withdrawalBalance = 0;

//       walletOneBalances.forEach((wallet) => {
//         const walletCurrencyConverter = parseFloat(
//           wallet.currencyId.countrycurrencyvaluecomparedtoinr
//         );
//         withdrawalBalance += wallet.balance * walletCurrencyConverter;
//       });

//       // Add the additional amount with currency conversion
//       // withdrawalBalance += parseFloat(playnumberEntry.distributiveamount);

//       // Calculate total balance as the sum of walletOne and walletTwo balances
//       const totalBalance = withdrawalBalance + gameBalance;

//       // Create a new AppBalanceSheet document
//       const appBalanceSheet = new AppBalanceSheet({
//         amount: parseFloat(amount * currencyconverter),
//         withdrawalbalance: withdrawalBalance,
//         gamebalance: gameBalance,
//         totalbalance: totalBalance,
//         usercurrency: user.country._id.toString(),
//         activityType: "Transfer",
//         userId: user.userId,
//         paymentProcessType: "Exchange",
//       });

//       // Save the AppBalanceSheet document
//       await appBalanceSheet.save();
//       console.log("AppBalanceSheet Created Successfully");

//       // END BALANCE SHEET

//       // Save the updated wallets
//       await walletOne.save();
//       await walletTwo.save();

//       res.status(200).json({
//         success: true,
//         message: "Transfer successful",
//         walletOne: { balance: walletOne.balance },
//         walletTwo: { balance: walletTwo.balance },
//       });
//     } catch (error) {
//       console.error("Error transferring amount:", error);
//       res
//         .status(500)
//         .json({ success: false, message: "Internal server error" });
//     }
//   }
// );

const transferAmountFromWalletOneToWalletTwo = asyncError(
  async (req, res, next) => {
    try {
      const { userid, amount } = req.body;

      // Validate input
      if (!amount || isNaN(amount) || amount <= 0) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid amount value" });
      }

      // Find the user
      const user = await User.findById(userid)
        .populate("walletOne")
        .populate("walletTwo");
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }

      const walletOne = user.walletOne;
      const walletTwo = user.walletTwo;

      // Check if walletOne has sufficient balance
      if (walletOne.balance < amount) {
        return res.status(400).json({
          success: false,
          message: "Insufficient balance in walletOne",
        });
      }

      const currency = await Currency.findById(user.country._id);
      if (!currency) {
        return next(new ErrorHandler("Currency not found", 404));
      }

      const currencyconverter = parseFloat(
        currency.countrycurrencyvaluecomparedtoinr
      );

      // Perform the transfer, ensuring balance is treated as a number

      // walletOne.balance = parseFloat(walletOne.balance) - parseFloat(amount);
      // walletTwo.balance = parseFloat(walletTwo.balance) + parseFloat(amount);
      walletOne.balance = Number(walletOne.balance) - Number(amount);
      walletTwo.balance = Number(walletTwo.balance) + Number(amount);

      // // Save the updated wallets
      // await walletOne.save();
      // await walletTwo.save();

      const transaction = await Transaction.create({
        amount,
        convertedAmount: amount,
        paymentType: "Credit",
        username: user.name,
        userId: user.userId,
        transactionType: "Transfer",
        paymentStatus: "Completed",
        currency: user.country._id.toString(),
        walletName: walletTwo.walletName,
      });

      user.transactionHistory.push(transaction._id);
      await user.save();

      // FOR BALANCE SHEET

      // Fetch all WalletTwo balances and populate currencyId
      const walletTwoBalances = await WalletTwo.find({}).populate("currencyId");
      let gameBalance = 0;

      walletTwoBalances.forEach((wallet) => {
        const walletCurrencyConverter = parseFloat(
          wallet.currencyId.countrycurrencyvaluecomparedtoinr
        );
        gameBalance += wallet.balance * walletCurrencyConverter;
      });

      // Fetch all WalletOne balances and populate currencyId
      const walletOneBalances = await WalletOne.find({}).populate("currencyId");
      let withdrawalBalance = 0;

      walletOneBalances.forEach((wallet) => {
        const walletCurrencyConverter = parseFloat(
          wallet.currencyId.countrycurrencyvaluecomparedtoinr
        );
        withdrawalBalance += wallet.balance * walletCurrencyConverter;
      });

      // Add the additional amount with currency conversion
      // withdrawalBalance += parseFloat(playnumberEntry.distributiveamount);

      // Calculate total balance as the sum of walletOne and walletTwo balances
      const totalBalance = withdrawalBalance + gameBalance;

      // Create a new AppBalanceSheet document
      const appBalanceSheet = new AppBalanceSheet({
        amount: parseFloat(amount * currencyconverter),
        withdrawalbalance: withdrawalBalance,
        gamebalance: gameBalance,
        totalbalance: totalBalance,
        usercurrency: user.country._id.toString(),
        activityType: "Transfer",
        userId: user.userId,
        paymentProcessType: "Exchange",
      });

      // Save the AppBalanceSheet document
      await appBalanceSheet.save();
      console.log("AppBalanceSheet Created Successfully");

      // END BALANCE SHEET

      // Save the updated wallets
      await walletOne.save();
      await walletTwo.save();

      res.status(200).json({
        success: true,
        message: "Transfer successful",
        walletOne: { balance: walletOne.balance },
        walletTwo: { balance: walletTwo.balance },
      });
    } catch (error) {
      console.error("Error transferring amount:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  }
);

// ##########################################
// DEPOSIT
// ##########################################

// Add Deposit
// const addDeposit = asyncError(async (req, res, next) => {
//   const {
//     amount,
//     transactionid,
//     remark,
//     paymenttype,
//     paymenttypeid,
//     username,
//     userid,
//     paymentstatus,
//   } = req.body;

//   // Validate user existence
//   const user = await User.findOne({ contact: userid });
//   if (!user) {
//     return next(new ErrorHandler("User not found", 404));
//   }

//   // Validate required fields
//   if (!amount) return next(new ErrorHandler("Amount missing", 400));
//   if (!transactionid) return next(new ErrorHandler("Transaction ID missing", 400));
//   if (!paymenttype) return next(new ErrorHandler("Payment type missing", 400));
//   if (!paymenttypeid) return next(new ErrorHandler("Payment type ID missing", 400));
//   if (!username) return next(new ErrorHandler("Username missing", 400));

//   // Check if a file is provided in the request
//   if (!req.file) {
//     return res.status(400).json({
//       success: false,
//       message: "Please upload receipt screenshot",
//     });
//   }

//   const { filename } = req.file;
//   const receipt = filename;

//   // Create a new transaction
//   const transaction = await Transaction.create({
//     amount,
//     transactionId: transactionid,
//     receipt,
//     remark,
//     paymentType: paymenttype,
//     paymentTypeId: paymenttypeid,
//     username,
//     userId: userid,
//     transactionType: "Deposit",
//     paymentStatus: paymentstatus || "Pending",
//   });

//   // Update user's transaction history
//   user.transactionHistory.push(transaction._id);
//   await user.save();

//   res.status(200).json({
//     success: true,
//     message: "Deposit request sent successfully",
//     transaction,
//   });
// });

// const addDeposit = asyncError(async (req, res, next) => {
//   const {
//     amount,
//     remark,
//     paymenttype,
//     username,
//     userid,
//     paymentstatus,
//     transactionid,
//     paymenttypeid,
//     transactionType
//   } = req.body;

//   // Validate user existence
//   const user = await User.findOne({ contact: userid });
//   if (!user) {
//     return next(new ErrorHandler("User not found", 404));
//   }

//   // Validate required fields
//   if (!amount) return next(new ErrorHandler("Amount missing", 400));
//   if (!transactionid) return next(new ErrorHandler("Transaction ID missing", 400));
//   if (!paymenttype) return next(new ErrorHandler("Payment type missing", 400));
//   if (!paymenttypeid) return next(new ErrorHandler("Payment type ID missing", 400));
//   if (!username) return next(new ErrorHandler("Username missing", 400));
//   if (!transactionType) return next(new ErrorHandler("Transaction Type missing", 400));

//   // Check if a file is provided in the request
//   if (!req.file) {
//     return res.status(400).json({
//       success: false,
//       message: "Please upload receipt screenshot",
//     });
//   }

//   const { filename } = req.file;
//   const receipt = filename;

//   // Create a new transaction
//   const transaction = await Transaction.create({
//     amount,
//     transactionId: transactionid,
//     receipt,
//     remark,
//     paymentType: paymenttype,
//     paymentTypeId: paymenttypeid,
//     username,
//     userId: userid,
//     transactionType: transactionType,
//     paymentStatus: paymentstatus || "Pending",
//   });

//   // Update user's transaction history
//   user.transactionHistory.push(transaction._id);
//   await user.save();

//   res.status(200).json({
//     success: true,
//     message: "Deposit request sent successfully",
//     transaction,
//   });
// });

const addDeposit = asyncError(async (req, res, next) => {
  const {
    amount,
    remark,
    paymenttype,
    username,
    userid,
    paymentstatus,
    transactionid,
    paymenttypeid,
  } = req.body;

  const user = await User.findOne({ userId: userid });
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  if (!amount) return next(new ErrorHandler("Amount missing", 400));
  if (!transactionid)
    return next(new ErrorHandler("Transaction ID missing", 400));
  if (!paymenttype) return next(new ErrorHandler("Payment type missing", 400));
  if (!paymenttypeid)
    return next(new ErrorHandler("Payment type ID missing", 400));
  if (!username) return next(new ErrorHandler("Username missing", 400));

  // I have just add the below line just to check
  if (!req.file) return next(new ErrorHandler("Please add screenshot", 400));

  // NOW GETTING THE CALCULATED AMOUNT

  const currency = await Currency.findById(user.country._id);
  if (!currency) {
    return next(new ErrorHandler("Currency not found", 404));
  }

  const currencyconverter = parseFloat(
    currency.countrycurrencyvaluecomparedtoinr
  );

  const convertedAmount = parseFloat(amount) * parseFloat(currencyconverter);
  console.log("convertedAmount :: " + convertedAmount);

  const transaction = await Transaction.create({
    amount,
    convertedAmount,
    transactionId: transactionid,
    remark,
    paymentType: paymenttype,
    paymentTypeId: paymenttypeid,
    username,
    userId: userid,
    transactionType: "Deposit",
    paymentStatus: paymentstatus || "Pending",
    currency: user.country._id.toString(),
    receipt: req.file ? req.file.filename : undefined,
  });

  user.transactionHistory.push(transaction._id);
  await user.save();

  res.status(200).json({
    success: true,
    message: "Deposit request sent successfully",
    transaction,
  });
});

// const getUserTransactions = asyncError(async (req, res, next) => {
//   const { userid } = req.query;

//   const transactions = await Transaction.find({ userId: userid }).sort({
//     createdAt: -1,
//   });

//   res.status(200).json({
//     success: true,
//     transactions,
//   });
// });

const getUserTransactions = asyncError(async (req, res, next) => {
  const { userid } = req.query;

  try {
    // Find the user by ID and populate transactions with currency in each transaction
    const user = await User.findOne({ userId: userid }).populate({
      path: "transactionHistory",
      populate: { path: "currency", model: "Currency" }, // Populate currency within each transaction
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Get the transactions array from the user document
    let transactions = user.transactionHistory;

    // Ensure createdAt is treated as a date
    transactions = transactions.map((transaction) => ({
      ...transaction.toObject(), // Ensure it's a plain object
      createdAt: new Date(transaction.createdAt),
    }));

    // Reverse the order to get the oldest first
    transactions.reverse();

    res.status(200).json({
      success: true,
      transactions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve transactions",
      error: error.message,
    });
  }
});

const getAllTransaction = asyncError(async (req, res, next) => {
  const transactions = await Transaction.find().sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    transactions,
  });
});

// Get all Deposit transactions
const getAllDeposit = asyncError(async (req, res, next) => {
  // Get page and limit from query params or set default values
  const page = parseInt(req.query.page) || 1; // Default page is 1
  const limit = parseInt(req.query.limit) || 20; // Default limit is 10

  // Calculate the number of documents to skip for pagination
  const skip = (page - 1) * limit;

  // Fetch deposits with pagination
  const deposits = await Transaction.find({ transactionType: "Deposit" })
    .populate("currency")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  // Get the total number of documents (for calculating total pages)
  const totalDeposits = await Transaction.countDocuments({
    transactionType: "Deposit",
  });

  res.status(200).json({
    success: true,
    deposits,
    page,
    limit,
    totalPages: Math.ceil(totalDeposits / limit),
    totalDeposits,
  });
});
// const getAllDeposit = asyncError(async (req, res, next) => {
//   const deposits = await Transaction.find({ transactionType: "Deposit" })
//     .populate("currency")
//     .sort({
//       createdAt: -1,
//     });

//   res.status(200).json({
//     success: true,
//     deposits,
//   });
// });

// UPDATE PAYMENT STATUS
const updateDepositStatus = asyncError(async (req, res, next) => {
  const {
    transactionId,
    paymentStatus,
    paymentUpdateNote,
    paymentupdatereceipt,
    amount: reqAmount,
  } = req.body;

  // Validate required fields
  if (!transactionId) {
    return next(new ErrorHandler("Transaction ID missing", 400));
  }
  if (!paymentStatus) {
    return next(new ErrorHandler("Payment status missing", 400));
  }
  if (!reqAmount) {
    return next(new ErrorHandler("Amount not found", 400));
  }

  // Validate payment status value
  const validStatuses = ["Pending", "Completed", "Cancelled"];
  if (!validStatuses.includes(paymentStatus)) {
    return next(new ErrorHandler("Invalid payment status", 400));
  }

  const transaction = await Transaction.findById(transactionId);

  if (!transaction) {
    return next(new ErrorHandler("Transaction not found", 404));
  }

  // FOR PAYMENT COMPLETED FOR DEPOSIT
  if (
    paymentStatus === "Completed" &&
    transaction.transactionType === "Deposit"
  ) {
    const userId = transaction.userId;
    // const amount = parseInt(transaction.amount);
    let amount = parseInt(reqAmount);

    const user = await User.findOne({ userId });

    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }

    // FOR DEPOSITING MONEY IN USER WALLET ONE
    console.log("Deposit request of user :: " + user);

    const currency = await Currency.findById(user.country._id);
    if (!currency) {
      return next(new ErrorHandler("Currency not found", 404));
    }

    const currencyconverter = parseFloat(
      currency.countrycurrencyvaluecomparedtoinr
    );

    amount = amount / currencyconverter;

    transaction.amount = amount;

    const walletId = user.walletTwo._id;
    console.log("wallet one 2 id :: " + walletId);

    const wallet = await WalletTwo.findById(walletId);

    console.log("Wallet one 2 ::  " + wallet);
    console.log("Before User Wallet Two balance :: " + wallet.balance);
    console.log("Amount to Add :: " + amount);

    const totalBalanceAmount = parseFloat(wallet.balance);

    console.log("Float User Wallet One balance :: " + totalBalanceAmount);

    const remainingWalletBalance = totalBalanceAmount + parseFloat(amount);
    console.log("REMAINING AMOUNT AFTER ADDITION :: " + remainingWalletBalance);

    // // Update wallet
    // const updatedWallet = await WalletOne.findByIdAndUpdate(
    //   walletId,
    //   { balance: remainingWalletBalance },
    //   { new: true }
    // );

    // console.log("User's walletOne updated successfully :: " + updatedWallet);

    // Search for the "INR" countrycurrencysymbol in the Currency Collection
    // const currency = await Currency.findById(user.country._id);
    // if (!currency) {
    //   return next(new ErrorHandler("Currency not found", 404));
    // }

    // const currencyconverter = parseFloat(
    //   currency.countrycurrencyvaluecomparedtoinr
    // );

    // FOR BALANCE SHEET

    // Create AppBalanceSheet entry
    // Calculate gameBalance as the total sum of all walletTwo balances

    // const walletTwoBalances = await WalletOne.find({});
    // const gameBalance = walletTwoBalances.reduce(
    //   (sum, wallet) => sum + wallet.balance,
    //   0
    // );

    // // Calculate walletOneBalances as the total sum of all walletOne balances add totalAmount
    // const walletOneBalances = await WalletTwo.find({});
    // const withdrawalBalance =
    //   walletOneBalances.reduce((sum, wallet) => sum + wallet.balance, 0) +
    //   parseFloat(amount * currencyconverter);

    // // Calculate totalbalance as the total sum of walletOne and walletTwo balances add totalAmount
    // const totalBalance = withdrawalBalance + gameBalance;

    // Fetch all WalletTwo balances and populate currencyId
    const walletTwoBalances = await WalletTwo.find({}).populate("currencyId");
    let gameBalance = 0;

    walletTwoBalances.forEach((wallet) => {
      const walletCurrencyConverter = parseFloat(
        wallet.currencyId.countrycurrencyvaluecomparedtoinr
      );
      gameBalance += wallet.balance * walletCurrencyConverter;
    });

    // Fetch all WalletOne balances and populate currencyId
    const walletOneBalances = await WalletOne.find({}).populate("currencyId");
    let withdrawalBalance = 0;

    walletOneBalances.forEach((wallet) => {
      const walletCurrencyConverter = parseFloat(
        wallet.currencyId.countrycurrencyvaluecomparedtoinr
      );
      withdrawalBalance += wallet.balance * walletCurrencyConverter;
    });

    // Add the additional amount with currency conversion
    gameBalance += parseFloat(amount * currencyconverter);

    // Calculate total balance as the sum of walletOne and walletTwo balances
    const totalBalance = withdrawalBalance + gameBalance;

    // Update wallet
    const updatedWallet = await WalletTwo.findByIdAndUpdate(
      walletId,
      { balance: remainingWalletBalance },
      { new: true }
    );

    console.log("User's walletOne updated successfully :: " + updatedWallet);

    // Create a new AppBalanceSheet document
    const appBalanceSheet = new AppBalanceSheet({
      amount: parseFloat(amount * currencyconverter),
      withdrawalbalance: withdrawalBalance,
      gamebalance: gameBalance,
      totalbalance: totalBalance,
      usercurrency: user.country._id.toString(),
      activityType: "Deposit",
      userId: userId,
      transactionId: transaction._id,
      paymentProcessType: "Credit",
      walletName: wallet.walletName,
    });

    // Save the AppBalanceSheet document
    await appBalanceSheet.save();
    console.log("AppBalanceSheet Created Successfully");

    // Create notification for deposit completion
    const notification = new Notification({
      title: "Deposit Completed",
      description: `Your deposit of ${amount} has been completed successfully.`,
    });
    await notification.save();

    // Add notification to user's notification list
    user.notifications.push(notification._id);
    await user.save();

    console.log("Notification created and added to user successfully");

    // END BALANCE SHEET
  }

  // FOR PAYMENT COMPLETED FOR WITHDRAW
  if (
    paymentStatus === "Completed" &&
    transaction.transactionType === "Withdraw"
  ) {
    const userId = transaction.userId;
    // const amount = parseInt(transaction.amount);
    let amount = parseInt(reqAmount);

    const user = await User.findOne({ userId });

    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }

    // FOR DEPOSITING MONEY IN USER WALLET ONE
    console.log("Deposit request of user :: " + user);

    const currency = await Currency.findById(user.country._id);
    if (!currency) {
      return next(new ErrorHandler("Currency not found", 404));
    }

    const currencyconverter = parseFloat(
      currency.countrycurrencyvaluecomparedtoinr
    );

    amount = amount / currencyconverter;

    transaction.amount = amount;

    const walletId = user.walletOne._id;
    console.log("wallet one id :: " + walletId);

    const wallet = await WalletOne.findById(walletId);

    console.log("Wallet one ::  " + wallet);
    console.log("Before User Wallet Two balance :: " + wallet.balance);
    console.log("Amount to Add :: " + amount);

    if (wallet.balance < amount) {
      return res.status(400).json({
        success: false,
        message: "Insufficient balance",
      });
    }

    const totalBalanceAmount = parseFloat(wallet.balance);

    console.log("Float User Wallet One balance :: " + totalBalanceAmount);

    const remainingWalletBalance = totalBalanceAmount - parseFloat(amount);
    console.log("REMAINING AMOUNT AFTER ADDITION :: " + remainingWalletBalance);

    // Update wallet
    // const updatedWallet = await WalletOne.findByIdAndUpdate(
    //   walletId,
    //   { balance: remainingWalletBalance },
    //   { new: true }
    // );

    // console.log("User's walletOne updated successfully :: " + updatedWallet);

    // FOR BALANCE SHEET

    // const currency = await Currency.findById(user.country._id);
    // if (!currency) {
    //   return next(new ErrorHandler("Currency not found", 404));
    // }

    // const currencyconverter = parseFloat(
    //   currency.countrycurrencyvaluecomparedtoinr
    // );

    // Create AppBalanceSheet entry
    // Calculate gameBalance as the total sum of all walletTwo balances

    // const walletTwoBalances = await WalletTwo.find({});
    // const gameBalance = walletTwoBalances.reduce(
    //   (sum, wallet) => sum + wallet.balance,
    //   0
    // );

    // // Calculate walletOneBalances as the total sum of all walletOne balances add totalAmount
    // const walletOneBalances = await WalletOne.find({});
    // const withdrawalBalance =
    //   walletOneBalances.reduce((sum, wallet) => sum + wallet.balance, 0) -
    //   parseFloat(amount * currencyconverter);

    // // Calculate totalbalance as the total sum of walletOne and walletTwo balances add totalAmount
    // const totalBalance = withdrawalBalance + gameBalance;

    // Fetch all WalletTwo balances and populate currencyId
    const walletTwoBalances = await WalletTwo.find({}).populate("currencyId");
    let gameBalance = 0;

    walletTwoBalances.forEach((wallet) => {
      const walletCurrencyConverter = parseFloat(
        wallet.currencyId.countrycurrencyvaluecomparedtoinr
      );
      gameBalance += wallet.balance * walletCurrencyConverter;
    });

    // Fetch all WalletOne balances and populate currencyId
    const walletOneBalances = await WalletOne.find({}).populate("currencyId");
    let withdrawalBalance = 0;

    walletOneBalances.forEach((wallet) => {
      const walletCurrencyConverter = parseFloat(
        wallet.currencyId.countrycurrencyvaluecomparedtoinr
      );
      withdrawalBalance += wallet.balance * walletCurrencyConverter;
    });

    // Add the additional amount with currency conversion
    withdrawalBalance -= parseFloat(amount * currencyconverter);

    // Calculate total balance as the sum of walletOne and walletTwo balances
    const totalBalance = withdrawalBalance + gameBalance;

    const updatedWallet = await WalletOne.findByIdAndUpdate(
      walletId,
      { balance: remainingWalletBalance },
      { new: true }
    );

    console.log("User's walletOne updated successfully :: " + updatedWallet);

    // Create a new AppBalanceSheet document
    const appBalanceSheet = new AppBalanceSheet({
      amount: parseFloat(amount * currencyconverter),
      withdrawalbalance: withdrawalBalance,
      gamebalance: gameBalance,
      totalbalance: totalBalance,
      usercurrency: user.country._id.toString(),
      activityType: "Withdraw",
      userId: userId,
      transactionId: transaction._id,
      paymentProcessType: "Debit",
      walletName: wallet.walletName,
    });

    // Save the AppBalanceSheet document
    await appBalanceSheet.save();
    console.log("AppBalanceSheet Created Successfully");

    // END BALANCE SHEET

    // Create notification for deposit completion
    const notification = new Notification({
      title: "Withdraw Completed",
      description: `Your withdraw of ${amount} has been completed successfully.`,
    });
    await notification.save();

    // Add notification to user's notification list
    user.notifications.push(notification._id);
    await user.save();

    console.log("Notification created and added to user successfully");
  }

  if (paymentStatus) transaction.paymentStatus = paymentStatus;
  if (paymentUpdateNote) transaction.paymentUpdateNote = paymentUpdateNote;

  if (req.file)
    transaction.paymentupdatereceipt = req.file ? req.file.filename : undefined;

  if (reqAmount) {
    transaction.convertedAmount = reqAmount;
  }

  await transaction.save();

  res.status(200).json({
    success: true,
    message: "Payment status updated successfully",
    transaction,
  });
});

// ##########################################
// WITHDRAW
// ##########################################

const addWithdraw = asyncError(async (req, res, next) => {
  const {
    amount,
    remark,
    paymenttype,
    username,
    userid,
    paymentstatus,
    upiHolderName,
    upiId,
    bankName,
    accountHolderName,
    bankIFSC,
    bankAccountNumber,
    paypalEmail,
    cryptoWalletAddress,
    networkType,
    skrillContact,
    swiftcode,
  } = req.body;

  const user = await User.findOne({ userId: userid });
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  if (!amount) return next(new ErrorHandler("Amount missing", 400));
  if (!paymenttype) return next(new ErrorHandler("Payment type missing", 400));
  if (!username) return next(new ErrorHandler("Username missing", 400));

  // NOW GETTING THE CALCULATED AMOUNT

  const currency = await Currency.findById(user.country._id);
  if (!currency) {
    return next(new ErrorHandler("Currency not found", 404));
  }

  const currencyconverter = parseFloat(
    currency.countrycurrencyvaluecomparedtoinr
  );

  const convertedAmount = parseFloat(amount) * parseFloat(currencyconverter);
  console.log("convertedAmount :: " + convertedAmount);

  const transaction = await Transaction.create({
    amount,
    convertedAmount,
    remark,
    paymentType: paymenttype,
    username,
    userId: userid,
    transactionType: "Withdraw",
    paymentStatus: paymentstatus || "Pending",
    upiHolderName,
    upiId,
    bankName,
    accountHolderName,
    bankIFSC,
    bankAccountNumber,
    paypalEmail,
    cryptoWalletAddress,
    networkType,
    skrillContact,
    currency: user.country._id.toString(),
    swiftcode,
  });

  user.transactionHistory.push(transaction._id);
  await user.save();

  res.status(200).json({
    success: true,
    message: "Withdrawal request sent successfully",
    transaction,
  });
});

// Get all withdraw transactions
// const getAllWithdrawals = asyncError(async (req, res, next) => {
//   const withdrawals = await Transaction.find({
//     transactionType: "Withdraw",
//   })
//     .populate("currency")
//     .sort({ createdAt: -1 });

//   res.status(200).json({
//     success: true,
//     withdrawals,
//   });
// });

const getAllWithdrawals = asyncError(async (req, res, next) => {
  // Get page and limit from query params or set default values
  const page = parseInt(req.query.page) || 1; // Default page is 1
  const limit = parseInt(req.query.limit) || 20; // Default limit is 10

  // Calculate the number of documents to skip for pagination
  const skip = (page - 1) * limit;

  // Fetch withdrawals with pagination
  const withdrawals = await Transaction.find({
    transactionType: "Withdraw",
  })
    .populate("currency")
    .sort({ createdAt: -1 })
    .skip(skip) // Skip previous pages
    .limit(limit); // Limit the results to the page size

  // Get the total number of withdrawal transactions (for calculating total pages)
  const totalWithdrawals = await Transaction.countDocuments({
    transactionType: "Withdraw",
  });

  res.status(200).json({
    success: true,
    withdrawals,
    page,
    limit,
    totalPages: Math.ceil(totalWithdrawals / limit), // Total number of pages
    totalWithdrawals, // Total number of withdrawal records
  });
});

// FOR PARTNER MODULE

const makeUserPartner = asyncError(async (req, res, next) => {
  const { userId } = req.body; // Get userId from the request body

  // Find the user by userId
  const user = await User.findOne({ userId });
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  // Check if the user is already a partner
  if (user.partnerStatus === true) {
    return next(new ErrorHandler("User is already a partner", 400));
  }

  // Set partnerStatus to true
  user.partnerStatus = true;

  // Create a PartnerModule for the user
  const partnerModule = await PartnerModule.create({
    userId: user.userId,
    name: user.name, // Use the user's name
    profitPercentage: 0, // Default value
    rechargePercentage: 0, // Default value
    parentPartnerId: user.parentPartnerId, // Use the user's parentPartnerId
    parentParentPartnerId: user.parentParentPartnerId, // Use the user's parentParentPartnerId
    topParentId: user.topParentId, // Use the user's topParentId
    playHistoryPermission: false, // Default value
    transactionHistoryPermission: false, // Default value
    partnerType: "partner", // Set partnerType to "partner"
    rechargeStatus: false, // Default value
    userList: [], // Add the user to the userList
    partnerList: [], // Initialize partnerList as empty
  });

  // Assign the created PartnerModule to the user
  user.partnerModule = partnerModule._id;

  // Save the updated user
  await user.save();

  res.status(200).json({
    success: true,
    message: "User promoted to partner successfully",
    user,
  });
});

const makeUserSubPartner = asyncError(async (req, res, next) => {
  const { userId, parentId } = req.body; // Get userId and parentId from the request body

  // Find the user by userId
  const user = await User.findOne({ userId });
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  // Find the partner (parent) using the parentId
  const parent = await PartnerModule.findOne({ userId: parentId });
  if (!parent) {
    return next(new ErrorHandler("Parent partner not found", 404));
  }

  // Check if the user is already a subpartner (in the userList of the parent)
  const isSubPartner = parent.userList.includes(user._id);
  if (!isSubPartner) {
    return next(
      new ErrorHandler("User is not part of the parent partner's userList", 400)
    );
  }

  // Create a PartnerModule for the user as a subpartner
  const partnerModule = await PartnerModule.create({
    userId: user.userId,
    name: user.name, // Use the user's name
    profitPercentage: 0, // Default value
    rechargePercentage: 0, // Default value
    parentPartnerId: parent.userId, // Use the parent's userId
    parentParentPartnerId: parent.parentPartnerId, // Use the parent's parentPartnerId
    topParentId: parent.topParentId, // Use the parent's topParentId
    playHistoryPermission: false, // Default value
    transactionHistoryPermission: false, // Default value
    partnerType: "subpartner", // Explicitly set partnerType to "subpartner"
    rechargeStatus: false, // Default value
    userList: [], // Initialize userList as empty
    partnerList: [], // Initialize partnerList as empty
  });

  // Add the created PartnerModule._id to the parent partner's partnerList
  parent.partnerList.push(partnerModule._id);
  await parent.save();

  // Assign the created PartnerModule to the user
  user.partnerModule = partnerModule._id;
  // user.partnerStatus = true; // Mark the user as a partner

  // Save the updated user
  await user.save();

  res.status(200).json({
    success: true,
    message: "Partner request send successfully",
    user,
  });
});

const updateSubPartnerStatus = asyncError(async (req, res, next) => {
  const { userId, partnerStatus } = req.body; // Get userId and parentId from the request body

  if (!userId) {
    return next(new ErrorHandler("Enter userid", 404));
  }
  if (partnerStatus === undefined) {
    // Check explicitly for undefined
    return next(new ErrorHandler("Partner status not found", 404));
  }

  // Find the user by userId
  const user = await User.findOne({ userId });
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  user.partnerStatus = partnerStatus; // Mark the user as a partner

  // Save the updated user
  await user.save();

  res.status(200).json({
    success: true,
    message: "Partner status updated successfully",
    user,
  });
});

const getAllPartners = asyncError(async (req, res, next) => {
  // Find all PartnerModule documents where partnerType is "partner" and sort by createdAt in descending order
  const partners = await PartnerModule.find({ partnerType: "partner" }).sort({
    createdAt: -1,
  });

  if (!partners || partners.length === 0) {
    return next(new ErrorHandler("No partners found", 404));
  }

  res.status(200).json({
    success: true,
    message: "Partners fetched successfully",
    partners,
  });
});

const getAllSubpartners = asyncError(async (req, res, next) => {
  // Find all PartnerModule documents where partnerType is "subpartner"
  const subpartners = await PartnerModule.find({
    partnerType: "subpartner",
  }).sort({ createdAt: -1 });

  if (!subpartners || subpartners.length === 0) {
    return next(new ErrorHandler("No subpartners found", 404));
  }

  res.status(200).json({
    success: true,
    message: "Subpartners fetched successfully",
    subpartners,
  });
});

const getPartnerByUserId = asyncError(async (req, res, next) => {
  const { userId } = req.params;

  // Find the partner in PartnerModule using userId
  const partner = await PartnerModule.findOne({ userId });

  if (!partner) {
    return next(new ErrorHandler("Partner not found", 404));
  }

  res.status(200).json({
    success: true,
    message: "Partner fetched successfully",
    partner,
  });
});

const getPartnerUserList = asyncError(async (req, res, next) => {
  const { userId } = req.params;

  // Find the PartnerModule entry for the given userId and populate the userList
  const partner = await PartnerModule.findOne({ userId }).populate({
    path: "userList",
    options: { sort: { _id: -1 } }, // Sorting by _id in descending order
  });

  if (!partner) {
    return next(new ErrorHandler("Partner not found", 404));
  }

  res.status(200).json({
    success: true,
    message: "Populated user list fetched successfully",
    userList: partner.userList, // Populated user list in descending order
  });
});

const getPartnerPartnerList = asyncError(async (req, res, next) => {
  const { userId } = req.params;

  // Find the PartnerModule entry for the given userId and populate the userList
  const partner = await PartnerModule.findOne({ userId }).populate({
    path: "partnerList",
    options: { sort: { _id: -1 } }, // Sorting by _id in descending order
  });

  if (!partner) {
    return next(new ErrorHandler("Partner not found", 404));
  }

  res.status(200).json({
    success: true,
    message: "Populated partner list fetched successfully",
    userList: partner.partnerList, // Populated user list in descending order
  });
});

const increasePartnerProfit = asyncError(async (req, res, next) => {
  const { partnerId, profitPercentage } = req.body;

  // Validate required fields
  if (!partnerId || profitPercentage === undefined) {
    return next(new ErrorHandler("All fields are required", 400));
  }

  // Ensure profitPercentage is a valid number and positive
  if (typeof profitPercentage !== "number" || profitPercentage <= 0) {
    return next(
      new ErrorHandler("Profit percentage must be a positive number", 400)
    );
  }

  // Find the partner using partnerId
  const partner = await PartnerModule.findOne({ userId: partnerId });
  if (!partner) {
    return next(new ErrorHandler("Partner not found", 404));
  }

  partner.profitPercentage += profitPercentage;
  await partner.save();

  res.status(201).json({
    success: true,
    message: "Profit increase successfully",
  });
});

const createProfitDeduction = asyncError(async (req, res, next) => {
  const { userId, partnerId, profitPercentage, reason } = req.body;

  // Validate required fields
  if (!userId || !partnerId || !profitPercentage || !reason) {
    return next(new ErrorHandler("All fields are required", 400));
  }

  // Find the partner using partnerId
  const partnerUser = await PartnerModule.findOne({ userId: userId });
  if (!partnerUser) {
    return next(new ErrorHandler("Partner not found", 404));
  }

  // Find the partner using partnerId
  const partner = await PartnerModule.findOne({ userId: partnerId });
  if (!partner) {
    return next(new ErrorHandler("Parent Partner not found", 404));
  }

  // Create the ProfitDeduction entry
  const profitDeduction = await ProfitDeduction.create({
    userId,
    partnerId,
    name: partnerUser.name, // Using partner's name
    profitPercentage,
    reason,
    status: "Pending", // Default status
  });

  // Add the ProfitDeduction _id to the partner's profitDeduction array
  partner.profitDeduction.push(profitDeduction._id);
  await partner.save();

  res.status(201).json({
    success: true,
    message: "Profit Deduction created successfully",
    profitDeduction,
  });
});

const getAllProfitDeductions = asyncError(async (req, res, next) => {
  try {
    // Fetch all profit deductions sorted by newest first
    const profitDeductions = await ProfitDeduction.find().sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      count: profitDeductions.length,
      profitDeductions,
    });
  } catch (error) {
    next(error);
  }
});

const getPartnerProfitDeductions = asyncError(async (req, res, next) => {
  const { userId } = req.params;

  // Validate userId
  if (!userId) {
    return next(new ErrorHandler("User ID is required", 400));
  }

  // Find the partner associated with the given userId
  const partner = await PartnerModule.findOne({ userId }).populate({
    path: "profitDeduction",
    options: { sort: { createdAt: -1 } }, // Sort by newest first
  });

  if (!partner) {
    return next(new ErrorHandler("Partner not found", 404));
  }

  res.status(200).json({
    success: true,
    profitDeductions: partner.profitDeduction,
  });
});

const updateProfitDeductionStatus = asyncError(async (req, res, next) => {
  const { id, status } = req.body;

  // Validate inputs
  if (!id || !status) {
    return next(new ErrorHandler("ID and status are required", 400));
  }

  // Ensure status is valid
  if (!["Pending", "Completed", "Cancelled"].includes(status)) {
    return next(new ErrorHandler("Invalid status value", 400));
  }

  // Find the ProfitDeduction entry by ID
  const profitDeduction = await ProfitDeduction.findById(id);
  if (!profitDeduction) {
    return next(new ErrorHandler("Profit deduction entry not found", 404));
  }

  // If status is "Cancelled", just update the status
  if (status === "Cancelled") {
    profitDeduction.status = "Cancelled";
    await profitDeduction.save();
    return res.status(200).json({
      success: true,
      message: "Profit deduction cancelled successfully",
    });
  }

  // If status is "Completed", deduct the profit from the partner
  if (status === "Completed") {
    const { userId, profitPercentage } = profitDeduction;

    // Find the partner associated with the userId
    const partner = await PartnerModule.findOne({ userId });
    if (!partner) {
      return next(new ErrorHandler("Associated partner not found", 404));
    }

    // Ensure the deduction doesn't make profitPercentage negative
    if (partner.profitPercentage < profitPercentage) {
      return next(
        new ErrorHandler("Insufficient profit percentage to deduct", 400)
      );
    }

    // Deduct the profit percentage
    partner.profitPercentage -= profitPercentage;
    await partner.save();

    // Update the status of the profit deduction
    profitDeduction.status = "Completed";
    await profitDeduction.save();

    return res.status(200).json({
      success: true,
      message: "Profit deduction completed successfully",
    });
  }
});

const updateProfitDeductionStatusAndAmount = asyncError(
  async (req, res, next) => {
    const { id, status, profitPercentage } = req.body;

    // Validate inputs
    if (!id || !status || !profitPercentage) {
      return next(
        new ErrorHandler("ID , status and profit percentage are required", 400)
      );
    }

    // Ensure status is valid
    if (!["Pending", "Completed", "Cancelled"].includes(status)) {
      return next(new ErrorHandler("Invalid status value", 400));
    }

    // Find the ProfitDeduction entry by ID
    const profitDeduction = await ProfitDeduction.findById(id);
    if (!profitDeduction) {
      return next(new ErrorHandler("Profit deduction entry not found", 404));
    }

    // If status is "Cancelled", just update the status
    if (status === "Cancelled") {
      profitDeduction.status = "Cancelled";
      await profitDeduction.save();
      return res.status(200).json({
        success: true,
        message: "Profit deduction cancelled successfully",
      });
    }

    // If status is "Completed", deduct the profit from the partner
    if (status === "Completed") {
      const { userId } = profitDeduction;

      // Find the partner associated with the userId
      const partner = await PartnerModule.findOne({ userId });
      if (!partner) {
        return next(new ErrorHandler("Associated partner not found", 404));
      }

      // Ensure the deduction doesn't make profitPercentage negative
      // if (partner.profitPercentage < profitPercentage) {
      //   return next(new ErrorHandler("Insufficient profit percentage to deduct", 400));
      // }

      // Deduct the profit percentage
      partner.profitPercentage = profitPercentage;
      await partner.save();

      // Update the status of the profit deduction
      profitDeduction.status = "Completed";
      await profitDeduction.save();

      return res.status(200).json({
        success: true,
        message: "Profit deduction completed successfully",
      });
    }
  }
);

const updatePartnerPermissions = asyncError(async (req, res, next) => {
  const { userId, playHistoryPermission, transactionHistoryPermission } =
    req.body;

  // Validate userId
  if (!userId) {
    return next(new ErrorHandler("User ID is required", 400));
  }

  // Check if at least one of the permissions is provided
  if (
    playHistoryPermission === undefined &&
    transactionHistoryPermission === undefined
  ) {
    return next(
      new ErrorHandler("At least one permission field is required", 400)
    );
  }

  // Find the partner by userId
  const partner = await PartnerModule.findOne({ userId });
  if (!partner) {
    return next(new ErrorHandler("Partner not found", 404));
  }

  // Update permissions if provided
  if (playHistoryPermission !== undefined) {
    partner.playHistoryPermission = playHistoryPermission;
  }
  if (transactionHistoryPermission !== undefined) {
    partner.transactionHistoryPermission = transactionHistoryPermission;
  }

  // Save the updated partner
  await partner.save();

  res.status(200).json({
    success: true,
    message: "Partner permissions updated successfully",
    partner,
  });
});

// PROMOTE PARTNER TO TOP PARTNER

const promoteSubPartnerToTopPartner = asyncError(async (req, res, next) => {
  const { userId } = req.body;

  if (!userId) {
    return next(new ErrorHandler("User ID is required", 400));
  }

  // Find the partner using userId
  const partner = await PartnerModule.findOne({ userId })
    .populate("userList")
    .populate("partnerList");

  if (!partner) {
    return next(new ErrorHandler("Partner not found", 404));
  }

  // Get the parent partner ID of the current partner
  const parentPartnerId = partner.parentPartnerId;

  // Find the parent partner and remove this partner from their lists
  if (parentPartnerId !== 1000) {
    const parentPartner = await PartnerModule.findOne({ userId: parentPartnerId });

    if (parentPartner) {
      // Remove the partner's _id from parentPartner's userList and partnerList
      parentPartner.userList = parentPartner.userList.filter(
        (user) => user.toString() !== partner._id.toString()
      );
      parentPartner.partnerList = parentPartner.partnerList.filter(
        (partnerItem) => partnerItem.toString() !== partner._id.toString()
      );

      // Save the updated parent partner
      await parentPartner.save();
    }
  }

  // Promote the partner to a top-level partner
  partner.parentPartnerId = 1000;
  partner.parentParentPartnerId = 1000;
  partner.topParentId = 1000;
  partner.partnerType = "partner";
  await partner.save();

  // Update all users in the userList
  await Promise.all(
    partner.userList.map((user) =>
      User.findByIdAndUpdate(user._id, {
        parentParentPartnerId: 1000,
        topParentId: 1000,
      })
    )
  );

  // Update all partners in the partnerList
  await Promise.all(
    partner.partnerList.map(async (subPartner) => {
      await PartnerModule.findByIdAndUpdate(subPartner._id, {
        parentParentPartnerId: 1000,
        topParentId: 1000,
      });

      // Fetch sub-partner with populated userList
      const subPartnerData = await PartnerModule.findById(subPartner._id).populate("userList");

      // Update all users inside sub-partner's userList
      await Promise.all(
        subPartnerData.userList.map((user) =>
          User.findByIdAndUpdate(user._id, {
            topParentId: 1000,
          })
        )
      );
    })
  );

  res.status(200).json({
    success: true,
    message: "Sub-partner promoted to top-level partner successfully",
  });
});

// REMOVE ANY USER FROM THE USERLIST OF THE PARTNER

const removeUserFromPartnerList = asyncError(async (req, res, next) => {
  const { id, partnerId } = req.body;

  if (!id || !partnerId) {
    return next(new ErrorHandler("User ID and Partner ID are required", 400));
  }

  // Find the partner using partnerId
  const partner = await PartnerModule.findOne({ userId: partnerId });

  if (!partner) {
    return next(new ErrorHandler("Partner not found", 404));
  }

  // Find the user using id
  const user = await User.findById(id);
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  // Update the user's hierarchy
  user.parentPartnerId = 1000;
  user.parentParentPartnerId = 1000;
  user.topParentId = 1000;
  await user.save();

  // Remove the user from the partner's userList
  partner.userList = partner.userList.filter((userItem) => userItem.toString() !== id.toString());
  await partner.save();

  res.status(200).json({
    success: true,
    message: "User removed from partner's userList and hierarchy updated successfully",
  });
});

// ADD USER TO THE USERLIST OF THE PARTNER

const addUserToUserList = asyncError(async (req, res, next) => {
  const { id, partnerId } = req.body;

  if (!id || !partnerId) {
    return next(new ErrorHandler("User ID and Partner ID are required", 400));
  }

  // Find the partner using partnerId
  const partner = await PartnerModule.findOne({ userId: partnerId });

  if (!partner) {
    return next(new ErrorHandler("Partner not found", 404));
  }

  // Find the user using id
  const user = await User.findById(id);
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  // Update the user's hierarchy
  user.parentPartnerId = partner.userId;
  user.parentParentPartnerId = partner.parentPartnerId;
  user.topParentId = partner.parentParentPartnerId;
  await user.save();

  // Add the user to the partner's userList (if not already present)
  if (!partner.userList.includes(id)) {
    partner.userList.push(id);
    await partner.save();
  }

  res.status(200).json({
    success: true,
    message: "User added to partner's userList and hierarchy updated successfully",
  });
});


// REMOVE TOP PARTNER 

const removeTopPartner = asyncError(async (req, res, next) => {
  const { userId } = req.body;

  if (!userId) {
    return next(new ErrorHandler("User ID is required", 400));
  }

  // Find the partner using userId
  const partner = await PartnerModule.findOne({ userId })
    .populate("userList")
    .populate("partnerList");

  if (!partner) {
    return next(new ErrorHandler("Partner not found", 404));
  }

  // Update the partner type to "user"
  partner.partnerType = "user";

  // Process the userList
  for (const user of partner.userList) {
    await User.findByIdAndUpdate(user._id, {
      parentPartnerId: 1000,
      parentParentPartnerId: 1000,
      topParentId: 1000,
    });
  }
  partner.userList = []; // Remove all users from userList

  // Process the partnerList
  for (const subPartner of partner.partnerList) {
    await PartnerModule.findByIdAndUpdate(subPartner._id, {
      parentPartnerId: 1000,
      parentParentPartnerId: 1000,
      topParentId: 1000,
      partnerType: "partner",
    });

    // Update each sub-partner's userList
    const subPartnerData = await PartnerModule.findById(
      subPartner._id
    ).populate("userList");

    for (const user of subPartnerData.userList) {
      await User.findByIdAndUpdate(user._id, {
        parentParentPartnerId: 1000,
        topParentId: 1000,
      });
    }

    // Update each sub-partner's partnerList
    const nestedPartnerData = await PartnerModule.findById(
      subPartner._id
    ).populate("partnerList");

    for (const nestedPartner of nestedPartnerData.partnerList) {
      await PartnerModule.findByIdAndUpdate(nestedPartner._id, {
        parentParentPartnerId: 1000,
        topParentId: 1000,
      });

      // Update each nested partner's userList
      const nestedUserList = await PartnerModule.findById(
        nestedPartner._id
      ).populate("userList");

      for (const nestedUser of nestedUserList.userList) {
        await User.findByIdAndUpdate(nestedUser._id, {
          topParentId: 1000,
        });
      }
    }
  }
  partner.partnerList = []; // Remove all partners from partnerList

  await partner.save();

  res.status(200).json({
    success: true,
    message: "Top partner removed and hierarchy updated successfully",
  });
});

// Recharge Module

const updateRechargeStatus = async (req, res) => {
  try {
    const { userId, rechargeStatus } = req.body;

    if (typeof rechargeStatus !== "boolean") {
      return res.status(400).json({ message: "Invalid rechargeStatus value" });
    }

    const partner = await PartnerModule.findOneAndUpdate(
      { userId },
      { rechargeStatus },
      { new: true, runValidators: true }
    );

    if (!partner) {
      return res.status(404).json({ message: "Partner not found" });
    }

    res.status(200).json({ message: "Recharge status updated successfully", partner });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

const getAllRecharge = asyncError(async (req, res, next) => {
  try {
    // Fetch all profit deductions sorted by newest first
    const rechargeModule = await RechargeModule.find().sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      count: rechargeModule.length,
      rechargeModule,
    });
  } catch (error) {
    next(error);
  }
});

const getRechargeById = asyncError(async (req, res, next) => {
  try {
    const { id } = req.params;

    // Fetch the recharge module by ID
    const rechargeModule = await RechargeModule.findById(id);

    if (!rechargeModule) {
      return res.status(404).json({
        success: false,
        message: "Recharge module not found",
      });
    }

    res.status(200).json({
      success: true,
      rechargeModule,
    });
  } catch (error) {
    next(error);
  }
});

const updateRechargePermission = asyncError(async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body; // Expecting one or more fields to update

    // Ensure only the allowed fields are updated
    const allowedFields = [
      "upiPermission",
      "bankPermission",
      "paypalPermission",
      "cryptoPermission",
      "skrillPermission",
      "otherPaymentPermission",
    ];

    const updateFields = Object.keys(updateData);

    // Check if the request contains only allowed fields
    const isValidUpdate = updateFields.every((field) =>
      allowedFields.includes(field)
    );

    if (!isValidUpdate) {
      return res.status(400).json({
        success: false,
        message: "Invalid update fields",
      });
    }

    // Find the recharge module by ID and update
    const rechargeModule = await RechargeModule.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!rechargeModule) {
      return res.status(404).json({
        success: false,
        message: "Recharge module not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Recharge module updated successfully",
      rechargeModule,
    });
  } catch (error) {
    next(error);
  }
});



module.exports = {
  login,
  register,
  getMyProfile,
  getUserDetails,
  updateWalletOne,
  updateWalletTwo,
  logout,
  updateProfile,
  changePassword,
  updatePic,
  resetPassword,
  forgetPassword,
  updateProfilePic,
  getProfilePic,
  addPromotion,
  getAllPromotions,
  deletePromotion,
  updatePromotion,
  updateAnyUserUserId,
  getAllUser,
  getAllUserRegisterInLastOneDay,
  updateAbout,
  createAbout,
  getAllAbout,
  getAllWalletOne,
  getAllWalletTwo,
  updateAllWalletNameOne,
  updateAllWalletNameTwo,
  deleteAbout,
  sendNotificationToAllUser,
  sendNotificationToSingleUser,
  singleUserNotification,
  getAllNotification,
  createProfilePic,
  deleteNotification,
  getAllTransaction,
  getUserTransactions,
  addDeposit,
  updateDepositStatus,
  addWithdraw,
  getAllDeposit,
  getAllWithdrawals,
  transferAmountFromWalletOneToWalletTwo,
  getAllSubadmin,
  updateRole,
  getUserNotifications,
  markUserNotificationsAsSeen,
  updateSubadminFeatures,
  updateUserPassword,
  deleteUser,
  makeUserPartner,
  getAllSubpartners,
  getAllPartners,
  getPartnerByUserId,
  getPartnerUserList,
  makeUserSubPartner,
  getPartnerPartnerList,
  updateSubPartnerStatus,
  createProfitDeduction,
  increasePartnerProfit,
  getAllProfitDeductions,
  getPartnerProfitDeductions,
  updateProfitDeductionStatus,
  updatePartnerPermissions,
  updateProfitDeductionStatusAndAmount,
  promoteSubPartnerToTopPartner,
  removeUserFromPartnerList,
  addUserToUserList,
  removeTopPartner,
  updateRechargeStatus,
  getAllRecharge,
  getRechargeById,
  updateRechargePermission
};
