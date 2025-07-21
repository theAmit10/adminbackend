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
const PowerBallGame = require("../models/PowerBallGame.js");
const PowerTime = require("../models/PowerTime.js");
const PowerDate = require("../models/PowerDate.js");
const PowerballGameTickets = require("../models/PowerballGameTickets.js");
const Settings = require("../models/Settings.js");
const PartnerPerformancePowerball = require("../models/PartnerPerformancePowerball.jsx");
const { use } = require("../routes/user.js");
const moment = require("moment-timezone");

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

    const parentUser = await User.findOne({ userId: parentId });
    if (!parentUser) {
      return next(new ErrorHandler("partner user not found", 400));
    }

    // Set hierarchical parent IDs
    parentPartnerId = partner.userId;
    parentParentPartnerId = partner.parentPartnerId;
    topParentId = partner.parentParentPartnerId;
    if (partner.rechargeStatus) {
      rechargePaymentId = partner.userId;
    } else {
      rechargePaymentId = parentUser.rechargePaymentId;
    }
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

// const updateProfile = asyncError(async (req, res, next) => {
//   const user = await User.findById(req.user._id);

//   const { name, email, contact } = req.body;

//   if (name) user.name = name;

//   // if (email) user.email = email;

//   if (email) {
//     let old_user = await User.findOne({ email });
//     if (old_user) return next(new ErrorHandler("User Already exist", 400));
//     user.email = email;
//   }

//   if (contact) {
//     let old_user = await User.findOne({ contact });
//     if (old_user) return next(new ErrorHandler("Contact Already exist", 400));
//     user.contact = contact;
//   }

//   await user.save();

//   res.status(200).json({
//     success: true,
//     message: "Profile Updated Successfully",
//   });
// });

const updateProfile = asyncError(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  if (!user) return next(new ErrorHandler("User not found", 404));

  const { name, email, contact } = req.body;

  // Update user fields with validation
  if (name) user.name = name;

  if (email) {
    const existingUserWithEmail = await User.findOne({
      email,
      _id: { $ne: user._id },
    });
    if (existingUserWithEmail) {
      return next(new ErrorHandler("Email already exists", 400));
    }
    user.email = email;
  }

  if (contact) {
    const existingUserWithContact = await User.findOne({
      contact,
      _id: { $ne: user._id },
    });
    if (existingUserWithContact) {
      return next(new ErrorHandler("Contact already exists", 400));
    }
    user.contact = contact;
  }

  // Save the updated user
  await user.save();

  // Find and update the corresponding partner document
  try {
    const partner = await PartnerModule.findOne({ userId: user.userId });
    if (partner) {
      const updates = {};
      if (name) updates.name = name;
      if (email) updates.email = email;
      if (contact) updates.contact = contact;

      if (Object.keys(updates).length > 0) {
        await PartnerModule.updateOne({ _id: partner._id }, { $set: updates });
      }
    }
  } catch (error) {
    console.error("Error updating partner profile:", error);
    // Continue even if partner update fails, but log the error
  }

  res.status(200).json({
    success: true,
    message: "Profile Updated Successfully",
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      contact: user.contact,
      userId: user.userId,
    },
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

// const getAllUser = asyncError(async (req, res, next) => {
//   const users = await User.find({})
//     .populate("walletOne")
//     .populate("walletTwo")
//     .populate("country")
//     .sort({ createdAt: -1 });

//   res.status(200).json({
//     success: true,
//     users,
//   });
// });

const getAllUser = asyncError(async (req, res, next) => {
  let { page, limit } = req.query;

  // Convert page and limit to integers and set default values
  page = parseInt(page) || 1;
  limit = parseInt(limit) || 10;
  const skip = (page - 1) * limit;

  try {
    // Fetch users with pagination, sorting, and populating necessary fields
    const users = await User.find({ partnerType: "user" })
      .skip(skip) // Skip based on page number
      .limit(limit) // Limit the number of users per page
      .populate("walletOne")
      .populate("walletTwo")
      .populate("country")
      .sort({ createdAt: -1 });

    // Get the total number of users
    const totalUsers = await User.countDocuments();

    res.status(200).json({
      success: true,
      users,
      totalUsers,
      totalPages: Math.ceil(totalUsers / limit),
      currentPage: page,
    });
  } catch (error) {
    next(error);
  }
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

// const getUserNotifications = asyncError(async (req, res, next) => {
//   const { userId } = req.params;

//   // Check if the provided userId is a valid MongoDB ObjectId
//   if (!mongoose.Types.ObjectId.isValid(userId)) {
//     return next(new ErrorHandler("Invalid user ID", 400));
//   }

//   try {
//     // Find the user by ID and populate the notifications array
//     const user = await User.findById(userId).populate({
//       path: "notifications",
//       options: { sort: { createdAt: -1 } }, // Sort notifications by createdAt in descending order
//     });

//     if (!user) {
//       return next(new ErrorHandler("User not found", 404));
//     }

//     // Return the populated notifications array
//     res.status(200).json({
//       success: true,
//       notifications: user.notifications,
//     });
//   } catch (error) {
//     next(new ErrorHandler(error.message, 500));
//   }
// });
const getUserNotifications = asyncError(async (req, res, next) => {
  const { userId } = req.params;
  const { page, limit } = req.query;

  if (userId == 1000) {
    // Check if the provided userId is a valid MongoDB ObjectId

    // Set default values for pagination if not provided
    const currentPage = parseInt(page) || 1;
    const itemsPerPage = parseInt(limit) || 10;
    const skip = (currentPage - 1) * itemsPerPage;

    try {
      // Find the user by ID and populate the notifications array with pagination
      const user = await User.findOne({ userId }).populate({
        path: "notifications",
        options: {
          sort: { createdAt: -1 },
          skip: skip,
          limit: itemsPerPage,
        },
      });

      if (!user) {
        return next(new ErrorHandler("User not found", 404));
      }

      // Get the total count of notifications for pagination
      const totalNotifications = await User.countDocuments({
        _id: user._id,
      });

      // Return the populated notifications array with pagination info
      res.status(200).json({
        success: true,
        notifications: user.notifications,
        totalNotifications,
        totalPages: Math.ceil(totalNotifications / itemsPerPage),
        currentPage,
      });
    } catch (error) {
      next(new ErrorHandler(error.message, 500));
    }
  } else {
    // Check if the provided userId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return next(new ErrorHandler("Invalid user ID", 400));
    }

    // Set default values for pagination if not provided
    const currentPage = parseInt(page) || 1;
    const itemsPerPage = parseInt(limit) || 10;
    const skip = (currentPage - 1) * itemsPerPage;

    try {
      // Find the user by ID and populate the notifications array with pagination
      const user = await User.findById(userId).populate({
        path: "notifications",
        options: {
          sort: { createdAt: -1 },
          skip: skip,
          limit: itemsPerPage,
        },
      });

      if (!user) {
        return next(new ErrorHandler("User not found", 404));
      }

      // Get the total count of notifications for pagination
      const totalNotifications = await User.countDocuments({
        _id: userId,
      });

      // Return the populated notifications array with pagination info
      res.status(200).json({
        success: true,
        notifications: user.notifications,
        totalNotifications,
        totalPages: Math.ceil(totalNotifications / itemsPerPage),
        currentPage,
      });
    } catch (error) {
      next(new ErrorHandler(error.message, 500));
    }
  }
});

const markUserNotificationsAsSeen = asyncError(async (req, res, next) => {
  const { userId } = req.params;

  // Validate userId
  // if (!mongoose.Types.ObjectId.isValid(userId)) {
  //   return next(new ErrorHandler("Invalid user ID", 400));
  // }

  try {
    let user;

    // First check if it's a valid MongoDB ObjectId and try finding by _id
    if (mongoose.Types.ObjectId.isValid(userId)) {
      user = await User.findById(userId);
    }

    // If not found by _id, or if invalid ObjectId, try finding by userId field
    if (!user) {
      user = await User.findOne({ userId: userId });
    }

    // If still not found, return error
    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }

    // Find the user by ID and ensure they exist
    // const user = await User.findById(userId);

    // if (!user) {
    //   return next(new ErrorHandler("User not found", 404));
    // }

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

// const sendNotificationToSingleUser = asyncError(async (req, res, next) => {
//   const { title, description, devicetoken, userId } = req.body;

//   // Check for required fields
//   if (!title) return next(new ErrorHandler("Enter Notification title", 400));
//   if (!description)
//     return next(new ErrorHandler("Enter Notification Description", 400));

//   try {
//     // Create a new notification in the database
//     const notification = await Notification.create({
//       title,
//       description,
//       userId: req.user.userId,
//     });

//     // Find the user and add the notification to their notification list
//     // const user = await User.findByIdAndUpdate(
//     //   userId,
//     //   { $push: { notifications: notification._id } },
//     //   { new: true }
//     // );

//     // Find the user based on the custom userId field and update
//     const user = await User.findOneAndUpdate(
//       { userId }, // Assuming `userId` is a unique field in the User schema
//       { $push: { notifications: notification._id } },
//       { new: true }
//     );

//     if (!user) {
//       return next(new ErrorHandler("User not found", 404));
//     }

//     // If a device token is provided, try to send the notification via Firebase
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
//         // Log the error, but do not interrupt the response flow
//         console.error("Error sending Firebase notification:", error);
//       }
//     } else {
//       console.log("Device token not provided, skipping Firebase notification");
//     }

//     // Respond with success, regardless of the Firebase result
//     res.status(200).json({
//       success: true,
//       message: "Notification processed successfully",
//       notification,
//     });
//   } catch (error) {
//     next(new ErrorHandler(error.message, 500));
//   }
// });

const sendNotificationToSingleUser = asyncError(async (req, res, next) => {
  const { title, description, devicetoken, userId } = req.body;

  if (!title) return next(new ErrorHandler("Enter Notification title", 400));
  if (!description)
    return next(new ErrorHandler("Enter Notification Description", 400));

  try {
    let notificationPayload = {
      title,
      description,
    };

    // Only assign userId to the notification if the requester is a 'user'
    if (req.user.role === "user") {
      notificationPayload.userId = req.user.userId;
    }

    // Create a new notification
    const notification = await Notification.create(notificationPayload);

    // Only push notification to the user's notifications array if their role is 'user'
    let user = null;

    user = await User.findOneAndUpdate(
      { userId },
      { $push: { notifications: notification._id } },
      { new: true }
    );

    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }

    // Send Firebase push notification if device token is provided
    if (devicetoken) {
      try {
        await firebase.messaging().send({
          token: devicetoken,
          notification: {
            title,
            body: description,
          },
        });
        console.log("Firebase notification sent");
      } catch (error) {
        console.error("Error sending Firebase notification:", error);
      }
    } else {
      console.log("Device token not provided, skipping Firebase notification");
    }

    res.status(200).json({
      success: true,
      message: "Notification processed successfully",
      notification,
    });
  } catch (error) {
    next(new ErrorHandler(error.message, 500));
  }
});

// const getAllUserRegisterInLastOneDay = asyncError(async (req, res, next) => {
//   // Get the current date and time in UTC
//   const currentDate = new Date();
//   const currentUTCDate = new Date(currentDate.toISOString());

//   // Subtract 24 hours from the current date to get the date/time 24 hours ago
//   const twentyFourHoursAgo = new Date(
//     currentUTCDate.getTime() - 24 * 60 * 60 * 1000
//   );

//   // Find users created within the last 24 hours
//   const users = await User.find({ createdAt: { $gte: twentyFourHoursAgo } })
//     .populate("walletOne")
//     .populate("walletTwo")
//     .populate("country")
//     .sort({ createdAt: -1 });

//   res.status(200).json({
//     success: true,
//     users,
//   });
// });

const getAllUserRegisterInLastOneDay = asyncError(async (req, res, next) => {
  // Get the current date and time in UTC
  const currentDate = new Date();
  const currentUTCDate = new Date(currentDate.toISOString());

  // Subtract 24 hours from the current date to get the date/time 24 hours ago
  const twentyFourHoursAgo = new Date(
    currentUTCDate.getTime() - 24 * 60 * 60 * 1000
  );

  // Get pagination parameters from the query (default to page 1 and 10 users per page)
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  // Calculate the number of documents to skip based on the current page
  const skip = (page - 1) * limit;

  try {
    // Find users created within the last 24 hours with pagination
    const users = await User.find({ createdAt: { $gte: twentyFourHoursAgo } })
      .populate("walletOne")
      .populate("walletTwo")
      .populate("country")
      .sort({ createdAt: -1 })
      .skip(skip) // Skip the documents for pagination
      .limit(limit); // Limit the number of documents

    // Get the total count of users (without pagination) for pagination info
    const totalCount = await User.countDocuments({
      createdAt: { $gte: twentyFourHoursAgo },
    });

    // Calculate total pages
    const totalPages = Math.ceil(totalCount / limit);

    res.status(200).json({
      success: true,
      users,
      pagination: {
        totalCount,
        totalPages,
        currentPage: page,
        limit,
      },
    });
  } catch (error) {
    next(new ErrorHandler(error.message, 500));
  }
});

// const getAllSubadmin = asyncError(async (req, res, next) => {
//   // Find users created within the last 24 hours
//   const users = await User.find({ role: "subadmin" })
//     .populate("walletOne")
//     .populate("walletTwo")
//     .populate("country")
//     .sort({ createdAt: -1 });

//   res.status(200).json({
//     success: true,
//     users,
//   });
// });

const getAllSubadmin = asyncError(async (req, res, next) => {
  // Get pagination parameters from the query (default to page 1 and 10 users per page)
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  // Calculate the number of documents to skip based on the current page
  const skip = (page - 1) * limit;

  try {
    // Find subadmin users with pagination
    const users = await User.find({ role: "subadmin" })
      .populate("walletOne")
      .populate("walletTwo")
      .populate("country")
      .sort({ createdAt: -1 })
      .skip(skip) // Skip the documents for pagination
      .limit(limit); // Limit the number of documents

    // Get the total count of subadmin users for pagination info
    const totalCount = await User.countDocuments({ role: "subadmin" });

    // Calculate total pages
    const totalPages = Math.ceil(totalCount / limit);

    res.status(200).json({
      success: true,
      users,
      pagination: {
        totalCount,
        totalPages,
        currentPage: page,
        limit,
      },
    });
  } catch (error) {
    next(new ErrorHandler(error.message, 500));
  }
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
//   } = req.body;

//   const user = await User.findOne({ userId: userid });
//   if (!user) {
//     return next(new ErrorHandler("User not found", 404));
//   }

//   if (!amount) return next(new ErrorHandler("Amount missing", 400));
//   if (!transactionid)
//     return next(new ErrorHandler("Transaction ID missing", 400));
//   if (!paymenttype) return next(new ErrorHandler("Payment type missing", 400));
//   if (!paymenttypeid)
//     return next(new ErrorHandler("Payment type ID missing", 400));
//   if (!username) return next(new ErrorHandler("Username missing", 400));

//   // I have just add the below line just to check
//   if (!req.file) return next(new ErrorHandler("Please add screenshot", 400));

//   // NOW GETTING THE CALCULATED AMOUNT

//   const currency = await Currency.findById(user.country._id);
//   if (!currency) {
//     return next(new ErrorHandler("Currency not found", 404));
//   }

//   const currencyconverter = parseFloat(
//     currency.countrycurrencyvaluecomparedtoinr
//   );

//   const convertedAmount = parseFloat(amount) * parseFloat(currencyconverter);
//   console.log("convertedAmount :: " + convertedAmount);

//   let transactiontype = "";

//   // FOR CHECKING DEPOSIT OR RECHARGE TRANSACTION
//   const numericRechargeId = Number(user.rechargePaymentId);

//   if(numericRechargeId === 1000)
//   {
//     transactiontype = "Deposit";
//   }else{
//     transactiontype = "Recharge";
//   }

//   const transaction = await Transaction.create({
//     amount,
//     convertedAmount,
//     transactionId: transactionid,
//     remark,
//     paymentType: paymenttype,
//     paymentTypeId: paymenttypeid,
//     username,
//     userId: userid,
//     transactionType: transactiontype || "Deposit",
//     paymentStatus: paymentstatus || "Pending",
//     currency: user.country._id.toString(),
//     receipt: req.file ? req.file.filename : undefined,
//   });

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

  // Step 1: Fetch user details
  const user = await User.findOne({ userId: userid });
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  // Step 2: Validate required fields
  if (!amount) return next(new ErrorHandler("Amount missing", 400));
  if (!transactionid)
    return next(new ErrorHandler("Transaction ID missing", 400));
  if (!paymenttype) return next(new ErrorHandler("Payment type missing", 400));
  if (!paymenttypeid)
    return next(new ErrorHandler("Payment type ID missing", 400));
  if (!username) return next(new ErrorHandler("Username missing", 400));
  if (!req.file) return next(new ErrorHandler("Please add screenshot", 400));

  // Step 3: Fetch currency and calculate converted amount
  const currency = await Currency.findById(user.country._id);
  if (!currency) {
    return next(new ErrorHandler("Currency not found", 404));
  }

  const currencyconverter = parseFloat(
    currency.countrycurrencyvaluecomparedtoinr
  );

  const convertedAmount = parseFloat(amount) * parseFloat(currencyconverter);
  console.log("convertedAmount :: " + convertedAmount);

  let transactiontype = "";

  // Step 4: Determine transaction type
  const numericRechargeId = Number(user.rechargePaymentId);

  if (numericRechargeId === 1000) {
    transactiontype = "Deposit";
  } else {
    // transactiontype = "Recharge";
    const partneruser = await PartnerModule.findOne({
      userId: numericRechargeId,
    }).populate("rechargeModule");

    if (!partneruser || !partneruser.rechargeModule) {
      return next(new ErrorHandler("Partner not found", 404));
    }

    const rechargeModule = partneruser.rechargeModule;

    if (paymenttype === "Upi") {
      transactiontype = rechargeModule.upiPermission ? "Recharge" : "Deposit";
    } else if (paymenttype === "Bank") {
      transactiontype = rechargeModule.bankPermission ? "Recharge" : "Deposit";
    } else if (paymenttype === "Paypal") {
      transactiontype = rechargeModule.paypalPermission
        ? "Recharge"
        : "Deposit";
    } else if (paymenttype === "Crypto") {
      transactiontype = rechargeModule.cryptoPermission
        ? "Recharge"
        : "Deposit";
    } else if (paymenttype === "Skrill") {
      transactiontype = rechargeModule.skrillPermission
        ? "Recharge"
        : "Deposit";
    } else if (paymenttype === "Other") {
      transactiontype = rechargeModule.otherPaymentPermission
        ? "Recharge"
        : "Deposit";
    }
  }

  // Step 5: Create a transaction
  const transaction = await Transaction.create({
    amount,
    convertedAmount,
    transactionId: transactionid,
    remark,
    paymentType: paymenttype,
    paymentTypeId: paymenttypeid,
    username,
    userId: userid,
    partnerId: numericRechargeId,
    transactionType: transactiontype || "Deposit",
    paymentStatus: paymentstatus || "Pending",
    currency: user.country._id.toString(),
    receipt: req.file ? req.file.filename : undefined,
  });

  // Step 6: Add transaction ID to user's transaction history
  user.transactionHistory.push(transaction._id);
  await user.save();

  // Step 7: If numericRechargeId !== 1000, update rechargeModule
  if (numericRechargeId !== 1000) {
    const partner = await PartnerModule.findOne({
      userId: numericRechargeId,
    }).populate("rechargeModule");

    if (!partner || !partner.rechargeModule) {
      return next(new ErrorHandler("Recharge Module not found", 404));
    }

    const rechargeModule = partner.rechargeModule;

    // Push the transaction ID to rechargeList
    rechargeModule.rechargeList.push(transaction._id);

    // Save the updated rechargeModule
    await rechargeModule.save();

    // Sending a notification for recharge

    const partnerUser = await User.findOne({ userId: partner.userId });
    if (!partnerUser) {
      return next(new ErrorHandler("Partner user not found", 404));
    }

    // Create notification for deposit completion
    const notification = new Notification({
      title: "Recharge Request",
      description: `New recharge request of $${amount} received.`,
    });
    await notification.save();

    // Add notification to user's notification list
    partnerUser.notifications.push(notification._id);
    await partnerUser.save();

    console.log("Notification created and added to user successfully");
  }

  // Step 8: Return success response
  res.status(200).json({
    success: true,
    message: "Deposit request sent successfully",
    transaction,
  });
});

// const getUserTransactions = asyncError(async (req, res, next) => {
//   const { userid } = req.query;

//   try {
//     // Find the user by ID and populate transactions with currency in each transaction
//     const user = await User.findOne({ userId: userid }).populate({
//       path: "transactionHistory",
//       populate: { path: "currency", model: "Currency" }, // Populate currency within each transaction
//     });

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: "User not found",
//       });
//     }

//     // Get the transactions array from the user document
//     let transactions = user.transactionHistory;

//     // Ensure createdAt is treated as a date
//     transactions = transactions.map((transaction) => ({
//       ...transaction.toObject(), // Ensure it's a plain object
//       createdAt: new Date(transaction.createdAt),
//     }));

//     // Reverse the order to get the oldest first
//     transactions.reverse();

//     res.status(200).json({
//       success: true,
//       transactions,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Failed to retrieve transactions",
//       error: error.message,
//     });
//   }
// });
const getUserTransactions = asyncError(async (req, res, next) => {
  const { userid } = req.query;
  let { page, limit } = req.query;

  // Convert page and limit to integers and set default values
  page = parseInt(page) || 1;
  limit = parseInt(limit) || 10;
  const skip = (page - 1) * limit;

  try {
    // Find the user by ID and populate transactions with currency in each transaction
    const user = await User.findOne({ userId: userid }).populate({
      path: "transactionHistory",
      populate: { path: "currency", model: "Currency" }, // Populate currency within each transaction
      options: {
        skip: skip, // Skip based on page number
        limit: limit, // Limit the number of transactions per page
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Get the total number of transactions for the user
    const totalTransactions = await User.countDocuments({ userId: userid });

    // Get the transactions array from the user document
    let transactions = user.transactionHistory;

    // Ensure createdAt is treated as a date
    transactions = transactions.map((transaction) => ({
      ...transaction.toObject(), // Ensure it's a plain object
      createdAt: new Date(transaction.createdAt),
    }));

    // Reverse the order to get the oldest first
    transactions.reverse();

    // Return paginated response
    res.status(200).json({
      success: true,
      transactions,
      totalTransactions,
      totalPages: Math.ceil(totalTransactions / limit),
      currentPage: page,
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

// Get all RECHARGE transactions
const getAllRechargeAdmin = asyncError(async (req, res, next) => {
  // Get page and limit from query params or set default values
  const page = parseInt(req.query.page) || 1; // Default page is 1
  const limit = parseInt(req.query.limit) || 20; // Default limit is 10

  // Calculate the number of documents to skip for pagination
  const skip = (page - 1) * limit;

  // Fetch deposits with pagination
  const deposits = await Transaction.find({ transactionType: "Recharge" })
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

  // FOR PAYMENT RECHARGE COMPLETED
  if (
    paymentStatus === "Completed" &&
    transaction.transactionType === "Recharge"
  ) {
    // GETTING PARENT USER
    // Get the parentUser using req.user._id
    const parentUser = await User.findById(req.user._id);

    if (!parentUser) {
      return next(new ErrorHandler("Parent user not found", 404));
    }

    // Get the walletTwo ID from the parentUser
    const parentwalletTwoId = parentUser.walletTwo._id;

    // Fetch the walletTwo details
    const parentwalletTwo = await WalletTwo.findById(parentwalletTwoId);

    if (!parentwalletTwo) {
      return next(new ErrorHandler("parent wallet not found", 404));
    }

    const userId = transaction.userId;
    // const amount = parseInt(transaction.amount);
    let amount = parseInt(reqAmount);
    console.log("initial amount :: ", amount);
    const user = await User.findOne({ userId });

    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }

    // FOR DEPOSITING MONEY IN USER WALLET ONE
    const currency = await Currency.findById(user.country._id);
    if (!currency) {
      return next(new ErrorHandler("Currency not found", 404));
    }

    const currencyconverter = parseFloat(
      currency.countrycurrencyvaluecomparedtoinr
    );

    // FOR PARTNER WALLET
    const currencyPartner = await Currency.findById(parentUser.country._id);
    if (!currencyPartner) {
      return next(new ErrorHandler("Currency Partner not found", 404));
    }

    const currencyconverterPartner = parseFloat(
      currencyPartner.countrycurrencyvaluecomparedtoinr
    );
    // END PARTNER WALLET

    amount = amount / currencyconverter;

    let parentamount = parseInt(reqAmount) / currencyconverterPartner;

    console.log("amount :: ", amount);
    console.log("amount currencyconverter :: ", currencyconverter);
    console.log("parentamount :: ", parentamount);
    console.log(
      "parentamount currencyconverterPartner :: ",
      currencyconverterPartner
    );

    // Check if the wallet balance is sufficient
    const parentwalletBalance = parseFloat(parentwalletTwo.balance);
    //  const parentamount = parseFloat(reqAmount);

    if (parentwalletBalance < parentamount) {
      return next(new ErrorHandler("Insufficient balance", 400));
    }

    console.log(
      "parentwalletBalance < parentamount :: ",
      parentwalletBalance < parentamount
    );
    // transaction.amount = amount;
    transaction.amount = amount;

    // ADDING BALANCE TO USER WALLET
    const walletId = user.walletTwo._id;
    const wallet = await WalletTwo.findById(walletId);
    const totalBalanceAmount = parseFloat(wallet.balance);
    const remainingWalletBalance = totalBalanceAmount + parseFloat(amount);
    // Update wallet
    const updatedWallet = await WalletTwo.findByIdAndUpdate(
      walletId,
      { balance: remainingWalletBalance },
      { new: true }
    );

    // DEDUCTING AMOUNT FROM PARENT WALLET
    const parentremainingWalletBalance =
      parentwalletBalance - parseFloat(parentamount);
    // Update wallet
    const parentupdatedWallet = await WalletTwo.findByIdAndUpdate(
      parentwalletTwoId,
      { balance: parentremainingWalletBalance },
      { new: true }
    );

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

    // END RECHARGE COMPLETED
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

// const updateDepositStatus = asyncError(async (req, res, next) => {
//   const {
//     transactionId,
//     paymentStatus,
//     paymentUpdateNote,
//     paymentupdatereceipt,
//     amount: reqAmount,
//   } = req.body;

//   // Validate required fields
//   if (!transactionId) {
//     return next(new ErrorHandler("Transaction ID missing", 400));
//   }
//   if (!paymentStatus) {
//     return next(new ErrorHandler("Payment status missing", 400));
//   }
//   if (!reqAmount) {
//     return next(new ErrorHandler("Amount not found", 400));
//   }

//   // Validate payment status value
//   const validStatuses = ["Pending", "Completed", "Cancelled"];
//   if (!validStatuses.includes(paymentStatus)) {
//     return next(new ErrorHandler("Invalid payment status", 400));
//   }

//   const transaction = await Transaction.findById(transactionId);

//   if (!transaction) {
//     return next(new ErrorHandler("Transaction not found", 404));
//   }

//   // FOR PAYMENT RECHARGE COMPLETED
//   if (
//     paymentStatus === "Completed" &&
//     transaction.transactionType === "Recharge"
//   ) {
//     const userId = transaction.userId;
//     // const amount = parseInt(transaction.amount);
//     let amount = parseInt(reqAmount);

//     const user = await User.findOne({ userId });

//     if (!user) {
//       return next(new ErrorHandler("User not found", 404));
//     }

//     // FOR DEPOSITING MONEY IN USER WALLET ONE
//     console.log("Deposit request of user :: " + user);

//     const currency = await Currency.findById(user.country._id);
//     if (!currency) {
//       return next(new ErrorHandler("Currency not found", 404));
//     }

//     const currencyconverter = parseFloat(
//       currency.countrycurrencyvaluecomparedtoinr
//     );

//     amount = amount / currencyconverter;

//     transaction.amount = amount;

//     const walletId = user.walletTwo._id;
//     console.log("wallet one 2 id :: " + walletId);

//     const wallet = await WalletTwo.findById(walletId);

//     console.log("Wallet one 2 ::  " + wallet);
//     console.log("Before User Wallet Two balance :: " + wallet.balance);
//     console.log("Amount to Add :: " + amount);

//     const totalBalanceAmount = parseFloat(wallet.balance);

//     console.log("Float User Wallet One balance :: " + totalBalanceAmount);

//     const remainingWalletBalance = totalBalanceAmount + parseFloat(amount);
//     console.log("REMAINING AMOUNT AFTER ADDITION :: " + remainingWalletBalance);

//     // Update wallet
//     const updatedWallet = await WalletTwo.findByIdAndUpdate(
//       walletId,
//       { balance: remainingWalletBalance },
//       { new: true }
//     );

//     console.log("User's walletOne updated successfully :: " + updatedWallet);

//     // Create notification for deposit completion
//     const notification = new Notification({
//       title: "Deposit Completed",
//       description: `Your deposit of ${amount} has been completed successfully.`,
//     });
//     await notification.save();

//     // Add notification to user's notification list
//     user.notifications.push(notification._id);
//     await user.save();

//     console.log("Notification created and added to user successfully");

//     // END RECHARGE COMPLETED
//   }

//   // FOR PAYMENT COMPLETED FOR DEPOSIT
//   if (
//     paymentStatus === "Completed" &&
//     transaction.transactionType === "Deposit"
//   ) {
//     const userId = transaction.userId;
//     // const amount = parseInt(transaction.amount);
//     let amount = parseInt(reqAmount);

//     const user = await User.findOne({ userId });

//     if (!user) {
//       return next(new ErrorHandler("User not found", 404));
//     }

//     // FOR DEPOSITING MONEY IN USER WALLET ONE
//     console.log("Deposit request of user :: " + user);

//     const currency = await Currency.findById(user.country._id);
//     if (!currency) {
//       return next(new ErrorHandler("Currency not found", 404));
//     }

//     const currencyconverter = parseFloat(
//       currency.countrycurrencyvaluecomparedtoinr
//     );

//     amount = amount / currencyconverter;

//     transaction.amount = amount;

//     const walletId = user.walletTwo._id;
//     console.log("wallet one 2 id :: " + walletId);

//     const wallet = await WalletTwo.findById(walletId);

//     console.log("Wallet one 2 ::  " + wallet);
//     console.log("Before User Wallet Two balance :: " + wallet.balance);
//     console.log("Amount to Add :: " + amount);

//     const totalBalanceAmount = parseFloat(wallet.balance);

//     console.log("Float User Wallet One balance :: " + totalBalanceAmount);

//     const remainingWalletBalance = totalBalanceAmount + parseFloat(amount);
//     console.log("REMAINING AMOUNT AFTER ADDITION :: " + remainingWalletBalance);

//     // Fetch all WalletTwo balances and populate currencyId
//     const walletTwoBalances = await WalletTwo.find({}).populate("currencyId");
//     let gameBalance = 0;

//     walletTwoBalances.forEach((wallet) => {
//       const walletCurrencyConverter = parseFloat(
//         wallet.currencyId.countrycurrencyvaluecomparedtoinr
//       );
//       gameBalance += wallet.balance * walletCurrencyConverter;
//     });

//     // Fetch all WalletOne balances and populate currencyId
//     const walletOneBalances = await WalletOne.find({}).populate("currencyId");
//     let withdrawalBalance = 0;

//     walletOneBalances.forEach((wallet) => {
//       const walletCurrencyConverter = parseFloat(
//         wallet.currencyId.countrycurrencyvaluecomparedtoinr
//       );
//       withdrawalBalance += wallet.balance * walletCurrencyConverter;
//     });

//     // Add the additional amount with currency conversion
//     gameBalance += parseFloat(amount * currencyconverter);

//     // Calculate total balance as the sum of walletOne and walletTwo balances
//     const totalBalance = withdrawalBalance + gameBalance;

//     // Update wallet
//     const updatedWallet = await WalletTwo.findByIdAndUpdate(
//       walletId,
//       { balance: remainingWalletBalance },
//       { new: true }
//     );

//     console.log("User's walletOne updated successfully :: " + updatedWallet);

//     // Create a new AppBalanceSheet document
//     const appBalanceSheet = new AppBalanceSheet({
//       amount: parseFloat(amount * currencyconverter),
//       withdrawalbalance: withdrawalBalance,
//       gamebalance: gameBalance,
//       totalbalance: totalBalance,
//       usercurrency: user.country._id.toString(),
//       activityType: "Deposit",
//       userId: userId,
//       transactionId: transaction._id,
//       paymentProcessType: "Credit",
//       walletName: wallet.walletName,
//     });

//     // Save the AppBalanceSheet document
//     await appBalanceSheet.save();
//     console.log("AppBalanceSheet Created Successfully");

//     // Create notification for deposit completion
//     const notification = new Notification({
//       title: "Deposit Completed",
//       description: `Your deposit of ${amount} has been completed successfully.`,
//     });
//     await notification.save();

//     // Add notification to user's notification list
//     user.notifications.push(notification._id);
//     await user.save();

//     console.log("Notification created and added to user successfully");

//     // END BALANCE SHEET
//   }

//   // FOR PAYMENT COMPLETED FOR WITHDRAW
//   if (
//     paymentStatus === "Completed" &&
//     transaction.transactionType === "Withdraw"
//   ) {
//     const userId = transaction.userId;
//     // const amount = parseInt(transaction.amount);
//     let amount = parseInt(reqAmount);

//     const user = await User.findOne({ userId });

//     if (!user) {
//       return next(new ErrorHandler("User not found", 404));
//     }

//     // FOR DEPOSITING MONEY IN USER WALLET ONE
//     console.log("Deposit request of user :: " + user);

//     const currency = await Currency.findById(user.country._id);
//     if (!currency) {
//       return next(new ErrorHandler("Currency not found", 404));
//     }

//     const currencyconverter = parseFloat(
//       currency.countrycurrencyvaluecomparedtoinr
//     );

//     amount = amount / currencyconverter;

//     transaction.amount = amount;

//     const walletId = user.walletOne._id;
//     console.log("wallet one id :: " + walletId);

//     const wallet = await WalletOne.findById(walletId);

//     console.log("Wallet one ::  " + wallet);
//     console.log("Before User Wallet Two balance :: " + wallet.balance);
//     console.log("Amount to Add :: " + amount);

//     if (wallet.balance < amount) {
//       return res.status(400).json({
//         success: false,
//         message: "Insufficient balance",
//       });
//     }

//     const totalBalanceAmount = parseFloat(wallet.balance);

//     console.log("Float User Wallet One balance :: " + totalBalanceAmount);

//     const remainingWalletBalance = totalBalanceAmount - parseFloat(amount);
//     console.log("REMAINING AMOUNT AFTER ADDITION :: " + remainingWalletBalance);

//     // Fetch all WalletTwo balances and populate currencyId
//     const walletTwoBalances = await WalletTwo.find({}).populate("currencyId");
//     let gameBalance = 0;

//     walletTwoBalances.forEach((wallet) => {
//       const walletCurrencyConverter = parseFloat(
//         wallet.currencyId.countrycurrencyvaluecomparedtoinr
//       );
//       gameBalance += wallet.balance * walletCurrencyConverter;
//     });

//     // Fetch all WalletOne balances and populate currencyId
//     const walletOneBalances = await WalletOne.find({}).populate("currencyId");
//     let withdrawalBalance = 0;

//     walletOneBalances.forEach((wallet) => {
//       const walletCurrencyConverter = parseFloat(
//         wallet.currencyId.countrycurrencyvaluecomparedtoinr
//       );
//       withdrawalBalance += wallet.balance * walletCurrencyConverter;
//     });

//     // Add the additional amount with currency conversion
//     withdrawalBalance -= parseFloat(amount * currencyconverter);

//     // Calculate total balance as the sum of walletOne and walletTwo balances
//     const totalBalance = withdrawalBalance + gameBalance;

//     const updatedWallet = await WalletOne.findByIdAndUpdate(
//       walletId,
//       { balance: remainingWalletBalance },
//       { new: true }
//     );

//     console.log("User's walletOne updated successfully :: " + updatedWallet);

//     // Create a new AppBalanceSheet document
//     const appBalanceSheet = new AppBalanceSheet({
//       amount: parseFloat(amount * currencyconverter),
//       withdrawalbalance: withdrawalBalance,
//       gamebalance: gameBalance,
//       totalbalance: totalBalance,
//       usercurrency: user.country._id.toString(),
//       activityType: "Withdraw",
//       userId: userId,
//       transactionId: transaction._id,
//       paymentProcessType: "Debit",
//       walletName: wallet.walletName,
//     });

//     // Save the AppBalanceSheet document
//     await appBalanceSheet.save();
//     console.log("AppBalanceSheet Created Successfully");

//     // END BALANCE SHEET

//     // Create notification for deposit completion
//     const notification = new Notification({
//       title: "Withdraw Completed",
//       description: `Your withdraw of ${amount} has been completed successfully.`,
//     });
//     await notification.save();

//     // Add notification to user's notification list
//     user.notifications.push(notification._id);
//     await user.save();

//     console.log("Notification created and added to user successfully");
//   }

//   if (paymentStatus) transaction.paymentStatus = paymentStatus;
//   if (paymentUpdateNote) transaction.paymentUpdateNote = paymentUpdateNote;

//   if (req.file)
//     transaction.paymentupdatereceipt = req.file ? req.file.filename : undefined;

//   if (reqAmount) {
//     transaction.convertedAmount = reqAmount;
//   }

//   await transaction.save();

//   res.status(200).json({
//     success: true,
//     message: "Payment status updated successfully",
//     transaction,
//   });
// });

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

  // Fetch settings dynamically
  const settings = await Settings.findOne();
  const MIN_PROFIT_PERCENTAGE = settings?.minProfitPercentage || 0;
  const MIN_RECHARGE_PERCENTAGE = settings?.minRechargePercentage || 0;

  // Set partnerStatus to true
  user.partnerStatus = true;
  user.partnerType = "partner";

  // Create a PartnerModule for the user
  const partnerModule = await PartnerModule.create({
    userId: user.userId,
    name: user.name, // Use the user's name
    profitPercentage: MIN_PROFIT_PERCENTAGE, // Set dynamic value
    rechargePercentage: MIN_RECHARGE_PERCENTAGE, // Set dynamic value
    parentPartnerId: user.parentPartnerId, // Use the user's parentPartnerId
    parentParentPartnerId: user.parentParentPartnerId, // Use the user's parentParentPartnerId
    topParentId: user.topParentId, // Use the user's topParentId
    walletTwo: user.walletTwo._id,
    country: user.country._id,
    playHistoryPermission: false, // Default value
    transactionHistoryPermission: false, // Default value
    partnerType: "partner", // Set partnerType to "partner"
    rechargeStatus: false, // Default value
    partnerStatus: true,
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

// const makeUserPartner = asyncError(async (req, res, next) => {
//   const { userId } = req.body; // Get userId from the request body

//   // Find the user by userId
//   const user = await User.findOne({ userId });
//   if (!user) {
//     return next(new ErrorHandler("User not found", 404));
//   }

//   // Check if the user is already a partner
//   if (user.partnerStatus === true) {
//     return next(new ErrorHandler("User is already a partner", 400));
//   }

//   // Set partnerStatus to true
//   user.partnerStatus = true;
//   user.partnerType = "partner";

//   // Create a PartnerModule for the user
//   const partnerModule = await PartnerModule.create({
//     userId: user.userId,
//     name: user.name, // Use the user's name
//     profitPercentage: 0, // Default value
//     rechargePercentage: 0, // Default value
//     parentPartnerId: user.parentPartnerId, // Use the user's parentPartnerId
//     parentParentPartnerId: user.parentParentPartnerId, // Use the user's parentParentPartnerId
//     topParentId: user.topParentId, // Use the user's topParentId
//     walletTwo: user.walletTwo._id,
//     playHistoryPermission: false, // Default value
//     transactionHistoryPermission: false, // Default value
//     partnerType: "partner", // Set partnerType to "partner"
//     rechargeStatus: false, // Default value
//     userList: [], // Add the user to the userList
//     partnerList: [], // Initialize partnerList as empty
//   });

//   // Assign the created PartnerModule to the user
//   user.partnerModule = partnerModule._id;

//   // Save the updated user
//   await user.save();

//   res.status(200).json({
//     success: true,
//     message: "User promoted to partner successfully",
//     user,
//   });
// });

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

  // Fetch settings dynamically
  const settings = await Settings.findOne();
  const MIN_PROFIT_PERCENTAGE = settings?.minProfitPercentage || 0;
  const MIN_RECHARGE_PERCENTAGE = settings?.minRechargePercentage || 0;

  // Create a PartnerModule for the user as a subpartner
  const partnerModule = await PartnerModule.create({
    userId: user.userId,
    name: user.name, // Use the user's name
    profitPercentage: MIN_PROFIT_PERCENTAGE, // Set dynamic value
    rechargePercentage: MIN_RECHARGE_PERCENTAGE, // Set dynamic value
    parentPartnerId: parent.userId, // Use the parent's userId
    parentParentPartnerId: parent.parentPartnerId, // Use the parent's parentPartnerId
    topParentId: parent.topParentId, // Use the parent's topParentId
    playHistoryPermission: false, // Default value
    walletTwo: user.walletTwo._id,
    country: user.country._id,
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
  user.partnerType = "subpartner";
  user.partnerStatus = true;

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

  const partner = await PartnerModule.findOne({ userId: userId });
  if (!partner) {
    return next(new ErrorHandler("Partner not found", 404));
  }

  partner.partnerStatus = partnerStatus;
  await partner.save();

  res.status(200).json({
    success: true,
    message: "Partner status updated successfully",
    user,
  });
});

// const getAllPartners = asyncError(async (req, res, next) => {
//   let { page, limit, sortBy, sortOrder } = req.query;

//   // Convert page and limit to integers and set default values
//   page = parseInt(page) || 1;
//   limit = parseInt(limit) || 10;
//   const skip = (page - 1) * limit;

//   // Default sort (newest first)
//   let sortCriteria = { createdAt: -1 };
//   let needsInMemorySorting = false;

//   // Handle custom sorting
//   if (sortBy) {
//     sortOrder = sortOrder === "desc" ? -1 : 1;

//     switch (sortBy) {
//       case "profit":
//         sortCriteria = { profitPercentage: sortOrder };
//         break;
//       case "recharge":
//         sortCriteria = { rechargePercentage: sortOrder };
//         break;
//       case "walletBalance":
//         // Special handling needed for populated field
//         needsInMemorySorting = true;
//         sortCriteria = { createdAt: -1 }; // Temporary default
//         break;
//       case "userCount":
//         needsInMemorySorting = true;
//         sortCriteria = { createdAt: -1 }; // Temporary default
//         break;
//       case "name":
//         sortCriteria = { name: sortOrder };
//         break;
//       case "createdAt":
//         sortCriteria = { createdAt: sortOrder };
//         break;
//       default:
//         break;
//     }
//   }

//   // Get total number of partners
//   const totalPartners = await PartnerModule.countDocuments({
//     partnerType: "partner",
//   });

//   // First get ALL partners with walletTwo populated
//   let partners = await PartnerModule.find({ partnerType: "partner" })
//     .populate("walletTwo")
//     .lean(); // Convert to plain JS objects for better sorting performance

//   if (!partners || partners.length === 0) {
//     return next(new ErrorHandler("No partners found", 404));
//   }

//   // Apply in-memory sorting if needed
//   if (needsInMemorySorting) {
//     partners.sort((a, b) => {
//       if (sortBy === "walletBalance") {
//         const aBalance = a.walletTwo?.balance || 0;
//         const bBalance = b.walletTwo?.balance || 0;
//         return sortOrder === 1 ? aBalance - bBalance : bBalance - aBalance;
//       } else if (sortBy === "userCount") {
//         const aCount = a.userList?.length || 0;
//         const bCount = b.userList?.length || 0;
//         return sortOrder === 1 ? aCount - bCount : bCount - aCount;
//       }
//       // Default fallback
//       return sortOrder === 1
//         ? a.createdAt - b.createdAt
//         : b.createdAt - a.createdAt;
//     });
//   } else {
//     // For cases where we can sort at database level
//     partners = await PartnerModule.find({ partnerType: "partner" })
//       .sort(sortCriteria)
//       .skip(skip)
//       .limit(limit)
//       .populate("walletTwo")
//       .lean();
//   }

//   // Apply pagination AFTER all sorting is complete
//   const paginatedPartners = needsInMemorySorting
//     ? partners.slice(skip, skip + limit)
//     : partners;

//   res.status(200).json({
//     success: true,
//     message: "Partners fetched successfully",
//     partners: paginatedPartners,
//     totalPartners,
//     totalPages: Math.ceil(totalPartners / limit),
//     currentPage: page,
//     sortBy,
//     sortOrder: sortOrder === -1 ? "desc" : "asc",
//   });
// });
const getAllPartners = asyncError(async (req, res, next) => {
  let { page, limit, sortBy, sortOrder } = req.query;

  // Convert page and limit to integers and set default values
  page = parseInt(page) || 1;
  limit = parseInt(limit) || 10;
  const skip = (page - 1) * limit;

  // Default sort (newest first)
  let sortCriteria = { createdAt: -1 };
  let needsInMemorySorting = false;

  // Handle custom sorting
  if (sortBy) {
    sortOrder = sortOrder === "desc" ? -1 : 1;

    switch (sortBy) {
      case "profit":
        sortCriteria = { profitPercentage: sortOrder };
        break;
      case "recharge":
        sortCriteria = { rechargePercentage: sortOrder };
        break;
      case "walletBalance":
        // Special handling needed for populated field
        needsInMemorySorting = true;
        sortCriteria = { createdAt: -1 }; // Temporary default
        break;
      case "userCount":
        needsInMemorySorting = true;
        sortCriteria = { createdAt: -1 }; // Temporary default
        break;
      case "name":
        sortCriteria = { name: sortOrder };
        break;
      case "createdAt":
        sortCriteria = { createdAt: sortOrder };
        break;
      case "partnerStatus":
        sortCriteria = { partnerStatus: sortOrder };
        break;
      case "rechargeStatus":
        sortCriteria = { rechargeStatus: sortOrder };
        break;
      default:
        break;
    }
  }

  // Get total number of partners
  const totalPartners = await PartnerModule.countDocuments({
    partnerType: "partner",
  });

  // First get ALL partners with walletTwo populated
  let partners = await PartnerModule.find({ partnerType: "partner" })
    .populate("walletTwo")
    .populate("country")
    .lean(); // Convert to plain JS objects for better sorting performance

  if (!partners || partners.length === 0) {
    return next(new ErrorHandler("No partners found", 404));
  }

  // Apply in-memory sorting if needed
  if (needsInMemorySorting) {
    partners.sort((a, b) => {
      if (sortBy === "walletBalance") {
        const aBalance = a.walletTwo?.balance || 0;
        const bBalance = b.walletTwo?.balance || 0;
        return sortOrder === 1 ? aBalance - bBalance : bBalance - aBalance;
      } else if (sortBy === "userCount") {
        const aCount = a.userList?.length || 0;
        const bCount = b.userList?.length || 0;
        return sortOrder === 1 ? aCount - bCount : bCount - aCount;
      }
      // Default fallback
      return sortOrder === 1
        ? a.createdAt - b.createdAt
        : b.createdAt - a.createdAt;
    });
  } else {
    // For cases where we can sort at database level
    partners = await PartnerModule.find({ partnerType: "partner" })
      .sort(sortCriteria)
      .skip(skip)
      .limit(limit)
      .populate("walletTwo")
      .populate("country")
      .lean();
  }

  // Apply pagination AFTER all sorting is complete
  const paginatedPartners = needsInMemorySorting
    ? partners.slice(skip, skip + limit)
    : partners;

  res.status(200).json({
    success: true,
    message: "Partners fetched successfully",
    partners: paginatedPartners,
    totalPartners,
    totalPages: Math.ceil(totalPartners / limit),
    currentPage: page,
    sortBy,
    sortOrder: sortOrder === -1 ? "desc" : "asc",
  });
});
// const getAllSubpartners = asyncError(async (req, res, next) => {
//   let { page, limit, sortBy, sortOrder } = req.query;

//   // Convert page and limit to integers and set default values
//   page = parseInt(page) || 1;
//   limit = parseInt(limit) || 10;
//   const skip = (page - 1) * limit;

//   // Default sort (newest first)
//   let sortCriteria = { createdAt: -1 };
//   let needsInMemorySorting = false;

//   // Handle custom sorting
//   if (sortBy) {
//     sortOrder = sortOrder === "desc" ? -1 : 1;

//     switch (sortBy) {
//       case "profit":
//         sortCriteria = { profitPercentage: sortOrder };
//         break;
//       case "recharge":
//         sortCriteria = { rechargePercentage: sortOrder };
//         break;
//       case "walletBalance":
//         // Special handling needed for populated field
//         needsInMemorySorting = true;
//         sortCriteria = { createdAt: -1 }; // Temporary default
//         break;
//       case "userCount":
//         needsInMemorySorting = true;
//         sortCriteria = { createdAt: -1 }; // Temporary default
//         break;
//       case "name":
//         sortCriteria = { name: sortOrder };
//         break;
//       case "createdAt":
//         sortCriteria = { createdAt: sortOrder };
//         break;
//       default:
//         break;
//     }
//   }

//   // Get total number of subpartners
//   const totalSubpartners = await PartnerModule.countDocuments({
//     partnerType: "subpartner",
//   });

//   // First get ALL subpartners with walletTwo populated
//   let subpartners = await PartnerModule.find({ partnerType: "subpartner" })
//     .populate("walletTwo")
//     .lean(); // Convert to plain JS objects for better sorting performance

//   if (!subpartners || subpartners.length === 0) {
//     return next(new ErrorHandler("No subpartners found", 404));
//   }

//   // Apply in-memory sorting if needed
//   if (needsInMemorySorting) {
//     subpartners.sort((a, b) => {
//       if (sortBy === "walletBalance") {
//         const aBalance = a.walletTwo?.balance || 0;
//         const bBalance = b.walletTwo?.balance || 0;
//         return sortOrder === 1 ? aBalance - bBalance : bBalance - aBalance;
//       } else if (sortBy === "userCount") {
//         const aCount = a.userList?.length || 0;
//         const bCount = b.userList?.length || 0;
//         return sortOrder === 1 ? aCount - bCount : bCount - aCount;
//       }
//       // Default fallback
//       return sortOrder === 1
//         ? a.createdAt - b.createdAt
//         : b.createdAt - a.createdAt;
//     });
//   } else {
//     // For cases where we can sort at database level
//     subpartners = await PartnerModule.find({ partnerType: "subpartner" })
//       .sort(sortCriteria)
//       .skip(skip)
//       .limit(limit)
//       .populate("walletTwo")
//       .lean();
//   }

//   // Apply pagination AFTER all sorting is complete
//   const paginatedSubpartners = needsInMemorySorting
//     ? subpartners.slice(skip, skip + limit)
//     : subpartners;

//   res.status(200).json({
//     success: true,
//     message: "Subpartners fetched successfully",
//     subpartners: paginatedSubpartners,
//     totalSubpartners,
//     totalPages: Math.ceil(totalSubpartners / limit),
//     currentPage: page,
//     sortBy,
//     sortOrder: sortOrder === -1 ? "desc" : "asc",
//   });
// });
const getAllSubpartners = asyncError(async (req, res, next) => {
  let { page, limit, sortBy, sortOrder } = req.query;

  // Convert page and limit to integers and set default values
  page = parseInt(page) || 1;
  limit = parseInt(limit) || 10;
  const skip = (page - 1) * limit;

  // Default sort (newest first)
  let sortCriteria = { createdAt: -1 };
  let needsInMemorySorting = false;

  // Handle custom sorting
  if (sortBy) {
    sortOrder = sortOrder === "desc" ? -1 : 1;

    switch (sortBy) {
      case "profit":
        sortCriteria = { profitPercentage: sortOrder };
        break;
      case "recharge":
        sortCriteria = { rechargePercentage: sortOrder };
        break;
      case "walletBalance":
        // Special handling needed for populated field
        needsInMemorySorting = true;
        sortCriteria = { createdAt: -1 }; // Temporary default
        break;
      case "userCount":
        needsInMemorySorting = true;
        sortCriteria = { createdAt: -1 }; // Temporary default
        break;
      case "name":
        sortCriteria = { name: sortOrder };
        break;
      case "createdAt":
        sortCriteria = { createdAt: sortOrder };
        break;
      case "partnerStatus":
        sortCriteria = { partnerStatus: sortOrder };
        break;
      case "rechargeStatus":
        sortCriteria = { rechargeStatus: sortOrder };
        break;
      default:
        break;
    }
  }

  // Get total number of subpartners
  const totalSubpartners = await PartnerModule.countDocuments({
    partnerType: "subpartner",
  });

  // First get ALL subpartners with walletTwo populated
  let subpartners = await PartnerModule.find({ partnerType: "subpartner" })
    .populate("walletTwo")
    .populate("country")
    .lean(); // Convert to plain JS objects for better sorting performance

  if (!subpartners || subpartners.length === 0) {
    return next(new ErrorHandler("No subpartners found", 404));
  }

  // Apply in-memory sorting if needed
  if (needsInMemorySorting) {
    subpartners.sort((a, b) => {
      if (sortBy === "walletBalance") {
        const aBalance = a.walletTwo?.balance || 0;
        const bBalance = b.walletTwo?.balance || 0;
        return sortOrder === 1 ? aBalance - bBalance : bBalance - aBalance;
      } else if (sortBy === "userCount") {
        const aCount = a.userList?.length || 0;
        const bCount = b.userList?.length || 0;
        return sortOrder === 1 ? aCount - bCount : bCount - aCount;
      }
      // Default fallback
      return sortOrder === 1
        ? a.createdAt - b.createdAt
        : b.createdAt - a.createdAt;
    });
  } else {
    // For cases where we can sort at database level
    subpartners = await PartnerModule.find({ partnerType: "subpartner" })
      .sort(sortCriteria)
      .skip(skip)
      .limit(limit)
      .populate("walletTwo")
      .populate("country")
      .lean();
  }

  // Apply pagination AFTER all sorting is complete
  const paginatedSubpartners = needsInMemorySorting
    ? subpartners.slice(skip, skip + limit)
    : subpartners;

  res.status(200).json({
    success: true,
    message: "Subpartners fetched successfully",
    subpartners: paginatedSubpartners,
    totalSubpartners,
    totalPages: Math.ceil(totalSubpartners / limit),
    currentPage: page,
    sortBy,
    sortOrder: sortOrder === -1 ? "desc" : "asc",
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

// const getPartnerUserList = asyncError(async (req, res, next) => {
//   const { userId } = req.params;

//   // Find the PartnerModule entry for the given userId and populate the userList
//   const partner = await PartnerModule.findOne({ userId }).populate({
//     path: "userList",
//     options: { sort: { _id: -1 } }, // Sorting by _id in descending order
//   });

//   if (!partner) {
//     return next(new ErrorHandler("Partner not found", 404));
//   }

//   res.status(200).json({
//     success: true,
//     message: "Populated user list fetched successfully",
//     userList: partner.userList, // Populated user list in descending order
//   });
// });
const getPartnerUserList = asyncError(async (req, res, next) => {
  const { userId } = req.params;
  let { page, limit } = req.query;

  // Convert page and limit to integers and set default values
  page = parseInt(page) || 1;
  limit = parseInt(limit) || 10;
  const skip = (page - 1) * limit;

  // Find the PartnerModule entry for the given userId and populate the userList with pagination
  // const partner = await PartnerModule.findOne({ userId }).populate({
  //   path: "userList",
  //   options: {
  //     sort: { _id: -1 }, // Sorting by _id in descending order
  //     skip: skip, // Skip based on page number
  //     limit: limit, // Limit the number of users per page
  //   },
  // });

  // Find the PartnerModule entry for the given userId and populate the userList with pagination
  const partner = await PartnerModule.findOne({ userId }).populate({
    path: "userList",
    populate: {
      path: "country", // ✅ Populating the country field from userList
    },
    options: {
      sort: { _id: -1 }, // Sorting by _id in descending order
      skip: skip, // Skip based on page number
      limit: limit, // Limit the number of users per page
    },
  });

  if (!partner) {
    return next(new ErrorHandler("Partner not found", 404));
  }

  // ✅ Find the partner and get total user count BEFORE pagination
  const partnerTotal = await PartnerModule.findOne({ userId });

  const totalUsers = partnerTotal.userList.length; // ✅ Total count before pagination

  // ✅ Get total number of users in the userList (fixed)
  // const totalUsers = partner.userList.length; // Count the number of populated users

  res.status(200).json({
    success: true,
    message: "Populated user list fetched successfully",
    userList: partner.userList,
    totalUsers,
    totalPages: Math.ceil(totalUsers / limit),
    currentPage: page,
  });
});

const searchPartnerUserList = asyncError(async (req, res, next) => {
  let { userId } = req.params;
  const { query } = req.query;

  if (!userId || !query) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid userId or search query" });
  }

  // Ensure correct format
  userId = isNaN(userId) ? userId.toString() : Number(userId);

  const partner = await PartnerModule.findOne({ userId }).populate("userList");

  if (!partner) {
    return res
      .status(404)
      .json({ success: false, message: "Partner not found" });
  }

  // Filter userList by userId OR name
  const filteredUsers = partner.userList.filter(
    (user) =>
      user.name.toLowerCase().includes(query.toLowerCase()) ||
      user.userId.toString().includes(query)
  );

  res.status(200).json({
    success: true,
    userList: filteredUsers,
  });
});

const searchPartnerPartnerList = asyncError(async (req, res, next) => {
  let { userId } = req.params;
  const { query } = req.query;

  if (!userId || !query) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid userId or search query" });
  }

  // Ensure correct format
  userId = isNaN(userId) ? userId.toString() : Number(userId);

  const partner = await PartnerModule.findOne({ userId }).populate(
    "partnerList"
  );

  if (!partner) {
    return res
      .status(404)
      .json({ success: false, message: "Partner not found" });
  }

  // Filter userList by userId OR name
  const filteredUsers = partner.partnerList.filter(
    (user) =>
      user.name.toLowerCase().includes(query.toLowerCase()) ||
      user.userId.toString().includes(query)
  );

  res.status(200).json({
    success: true,
    partnerList: filteredUsers,
  });
});

// const getPartnerPartnerList = asyncError(async (req, res, next) => {
//   const { userId } = req.params;
//   let { page, limit, sortBy, sortOrder } = req.query;

//   // Convert page and limit to integers and set default values
//   page = parseInt(page) || 1;
//   limit = parseInt(limit) || 10;
//   const skip = (page - 1) * limit;

//   // Default sort (newest first)
//   let sortCriteria = { createdAt: -1 };
//   let needsInMemorySorting = false;

//   // Handle custom sorting
//   if (sortBy) {
//     sortOrder = sortOrder === "desc" ? -1 : 1;

//     switch (sortBy) {
//       case "profit":
//         sortCriteria = { profitPercentage: sortOrder };
//         break;
//       case "recharge":
//         sortCriteria = { rechargePercentage: sortOrder };
//         break;
//       case "walletBalance":
//         // Special handling needed for populated field
//         needsInMemorySorting = true;
//         sortCriteria = { createdAt: -1 }; // Temporary default
//         break;
//       case "userCount":
//         needsInMemorySorting = true;
//         sortCriteria = { createdAt: -1 }; // Temporary default
//         break;
//       case "name":
//         sortCriteria = { name: sortOrder };
//         break;
//       case "createdAt":
//         sortCriteria = { createdAt: sortOrder };
//         break;
//       default:
//         break;
//     }
//   }

//   // Find the partner to get total count
//   const partnerTotal = await PartnerModule.findOne({ userId }).populate({
//     path: "partnerList",
//     populate: {
//       path: "walletTwo",
//     },
//   });

//   if (!partnerTotal) {
//     return next(new ErrorHandler("Partner not found", 404));
//   }

//   const totalPartners = partnerTotal.partnerList.length;

//   let partnerList;
//   if (needsInMemorySorting) {
//     // First get ALL partners with walletTwo populated
//     const partner = await PartnerModule.findOne({ userId }).populate({
//       path: "partnerList",
//       populate: {
//         path: "walletTwo",
//       },
//     });

//     if (!partner) {
//       return next(new ErrorHandler("Partner not found", 404));
//     }

//     // Apply in-memory sorting
//     partner.partnerList.sort((a, b) => {
//       if (sortBy === "walletBalance") {
//         const aBalance = a.walletTwo?.balance || 0;
//         const bBalance = b.walletTwo?.balance || 0;
//         return sortOrder === 1 ? aBalance - bBalance : bBalance - aBalance;
//       } else if (sortBy === "userCount") {
//         const aCount = a.userList?.length || 0;
//         const bCount = b.userList?.length || 0;
//         return sortOrder === 1 ? aCount - bCount : bCount - aCount;
//       }
//       // Default fallback
//       return sortOrder === 1
//         ? a.createdAt - b.createdAt
//         : b.createdAt - a.createdAt;
//     });

//     // Apply pagination after sorting
//     partnerList = partner.partnerList.slice(skip, skip + limit);
//   } else {
//     // For cases where we can sort at database level
//     const partner = await PartnerModule.findOne({ userId }).populate({
//       path: "partnerList",
//       populate: {
//         path: "walletTwo",
//       },
//       options: {
//         sort: sortCriteria,
//         skip: skip,
//         limit: limit,
//       },
//     });

//     if (!partner) {
//       return next(new ErrorHandler("Partner not found", 404));
//     }

//     partnerList = partner.partnerList;
//   }

//   res.status(200).json({
//     success: true,
//     message: "Populated partner list fetched successfully",
//     partnerList,
//     totalPartners,
//     totalPages: Math.ceil(totalPartners / limit),
//     currentPage: page,
//     sortBy,
//     sortOrder: sortOrder === -1 ? "desc" : "asc",
//   });
// });

const getPartnerPartnerList = asyncError(async (req, res, next) => {
  const { userId } = req.params;
  let { page, limit, sortBy, sortOrder } = req.query;

  // Convert page and limit to integers and set default values
  page = parseInt(page) || 1;
  limit = parseInt(limit) || 10;
  const skip = (page - 1) * limit;

  // Default sort (newest first)
  let sortCriteria = { createdAt: -1 };
  let needsInMemorySorting = false;

  // Handle custom sorting
  if (sortBy) {
    sortOrder = sortOrder === "desc" ? -1 : 1;

    switch (sortBy) {
      case "profit":
        sortCriteria = { profitPercentage: sortOrder };
        break;
      case "recharge":
        sortCriteria = { rechargePercentage: sortOrder };
        break;
      case "walletBalance":
        // Special handling needed for populated field
        needsInMemorySorting = true;
        sortCriteria = { createdAt: -1 }; // Temporary default
        break;
      case "userCount":
        needsInMemorySorting = true;
        sortCriteria = { createdAt: -1 }; // Temporary default
        break;
      case "name":
        sortCriteria = { name: sortOrder };
        break;
      case "createdAt":
        sortCriteria = { createdAt: sortOrder };
        break;
      case "partnerStatus":
        sortCriteria = { partnerStatus: sortOrder };
        break;
      case "rechargeStatus":
        sortCriteria = { rechargeStatus: sortOrder };
        break;
      default:
        break;
    }
  }

  // Find the partner to get total count
  const partnerTotal = await PartnerModule.findOne({ userId }).populate({
    path: "partnerList",
    populate: [{ path: "walletTwo" }, { path: "country" }],
  });

  if (!partnerTotal) {
    return next(new ErrorHandler("Partner not found", 404));
  }

  const totalPartners = partnerTotal.partnerList.length;

  let partnerList;
  if (needsInMemorySorting) {
    // First get ALL partners with walletTwo populated
    const partner = await PartnerModule.findOne({ userId }).populate({
      path: "partnerList",
      populate: [{ path: "walletTwo" }, { path: "country" }],
    });

    if (!partner) {
      return next(new ErrorHandler("Partner not found", 404));
    }

    // Apply in-memory sorting
    partner.partnerList.sort((a, b) => {
      if (sortBy === "walletBalance") {
        const aBalance = a.walletTwo?.balance || 0;
        const bBalance = b.walletTwo?.balance || 0;
        return sortOrder === 1 ? aBalance - bBalance : bBalance - aBalance;
      } else if (sortBy === "userCount") {
        const aCount = a.userList?.length || 0;
        const bCount = b.userList?.length || 0;
        return sortOrder === 1 ? aCount - bCount : bCount - aCount;
      }
      // Default fallback
      return sortOrder === 1
        ? a.createdAt - b.createdAt
        : b.createdAt - a.createdAt;
    });

    // Apply pagination after sorting
    partnerList = partner.partnerList.slice(skip, skip + limit);
  } else {
    // For cases where we can sort at database level
    const partner = await PartnerModule.findOne({ userId }).populate({
      path: "partnerList",
      populate: [{ path: "walletTwo" }, { path: "country" }],
      options: {
        sort: sortCriteria,
        skip: skip,
        limit: limit,
      },
    });

    if (!partner) {
      return next(new ErrorHandler("Partner not found", 404));
    }

    partnerList = partner.partnerList;
  }

  res.status(200).json({
    success: true,
    message: "Populated partner list fetched successfully",
    partnerList,
    totalPartners,
    totalPages: Math.ceil(totalPartners / limit),
    currentPage: page,
    sortBy,
    sortOrder: sortOrder === -1 ? "desc" : "asc",
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

  // Find the partner  partnerId
  const partner = await PartnerModule.findOne({ userId: partnerId });
  if (!partner) {
    return next(new ErrorHandler("Partner not found", 404));
  }

  partner.profitPercentage = profitPercentage;
  await partner.save();

  res.status(201).json({
    success: true,
    message: "Profit increase successfully",
  });
});

const increasePartnerRecharge = asyncError(async (req, res, next) => {
  const { partnerId, rechargePercentage } = req.body;

  // Validate required fields
  if (!partnerId || rechargePercentage === undefined) {
    return next(new ErrorHandler("All fields are required", 400));
  }

  // Ensure rechargePercentage is a valid number and positive
  if (typeof rechargePercentage !== "number" || rechargePercentage < 0) {
    return next(
      new ErrorHandler("Recharge percentage must be a positive number", 400)
    );
  }

  // Find the partner using partnerId
  const partner = await PartnerModule.findOne({ userId: partnerId });
  if (!partner) {
    return next(new ErrorHandler("Partner not found", 404));
  }

  partner.rechargePercentage = rechargePercentage;
  await partner.save();

  res.status(201).json({
    success: true,
    message: "Recharge percentage updated successfully",
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

  const newPP =
    partnerUser.profitPercentage - Number.parseInt(profitPercentage);

  // Create the ProfitDeduction entry
  const profitDeduction = await ProfitDeduction.create({
    userId,
    partnerId,
    name: partnerUser.name, // Using partner's name
    profitPercentage,
    reason,
    status: "Pending", // Default status
    oldProfitPercentage: partnerUser.profitPercentage,
    newProfitPercentage: newPP,
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

// const getAllProfitDeductions = asyncError(async (req, res, next) => {
//   try {
//     // Fetch all profit deductions sorted by newest first
//     const profitDeductions = await ProfitDeduction.find().sort({
//       createdAt: -1,
//     });

//     res.status(200).json({
//       success: true,
//       count: profitDeductions.length,
//       profitDeductions,
//     });
//   } catch (error) {
//     next(error);
//   }
// });

const getAllProfitDeductions = asyncError(async (req, res, next) => {
  let { page, limit } = req.query;

  // Convert page and limit to integers and set default values
  page = parseInt(page) || 1;
  limit = parseInt(limit) || 10;
  const skip = (page - 1) * limit;

  try {
    // Fetch all profit deductions with pagination and sort by newest first
    const profitDeductions = await ProfitDeduction.find()
      .sort({ createdAt: -1 }) // Sorting by newest first
      .skip(skip) // Skip based on page number
      .limit(limit); // Limit the number of profit deductions per page

    // Get total number of profit deductions
    const totalProfitDeductions = await ProfitDeduction.countDocuments();

    res.status(200).json({
      success: true,
      count: profitDeductions.length,
      profitDeductions,
      totalProfitDeductions,
      totalPages: Math.ceil(totalProfitDeductions / limit),
      currentPage: page,
    });
  } catch (error) {
    next(error);
  }
});

// const getPartnerProfitDeductions = asyncError(async (req, res, next) => {
//   const { userId } = req.params;

//   // Validate userId
//   if (!userId) {
//     return next(new ErrorHandler("User ID is required", 400));
//   }

//   // Find the partner associated with the given userId
//   const partner = await PartnerModule.findOne({ userId }).populate({
//     path: "profitDeduction",
//     options: { sort: { createdAt: -1 } }, // Sort by newest first
//   });

//   if (!partner) {
//     return next(new ErrorHandler("Partner not found", 404));
//   }

//   res.status(200).json({
//     success: true,
//     profitDeductions: partner.profitDeduction,
//   });
// });
const getPartnerProfitDeductions = asyncError(async (req, res, next) => {
  const { userId } = req.params;
  let { page, limit } = req.query;

  // Validate userId
  if (!userId) {
    return next(new ErrorHandler("User ID is required", 400));
  }

  // Convert page and limit to integers and set default values
  page = parseInt(page) || 1;
  limit = parseInt(limit) || 10;
  const skip = (page - 1) * limit;

  // Find the partner associated with the given userId and populate the profitDeduction with pagination
  const partner = await PartnerModule.findOne({ userId }).populate({
    path: "profitDeduction",
    options: {
      sort: { createdAt: -1 }, // Sort by newest first
      skip: skip, // Skip based on page number
      limit: limit, // Limit the number of profit deductions per page
    },
  });

  if (!partner) {
    return next(new ErrorHandler("Partner not found", 404));
  }

  // Get total number of profit deductions for the partner
  const totalProfitDeductions = await PartnerModule.countDocuments({
    userId,
  });

  res.status(200).json({
    success: true,
    profitDeductions: partner.profitDeduction,
    totalProfitDeductions,
    totalPages: Math.ceil(totalProfitDeductions / limit),
    currentPage: page,
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
    const parentPartner = await PartnerModule.findOne({
      userId: parentPartnerId,
    });

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
      const subPartnerData = await PartnerModule.findById(
        subPartner._id
      ).populate("userList");

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
  partner.userList = partner.userList.filter(
    (userItem) => userItem.toString() !== id.toString()
  );
  await partner.save();

  res.status(200).json({
    success: true,
    message:
      "User removed from partner's userList and hierarchy updated successfully",
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

  if (user.parentPartnerId !== 1000) {
    return next(new ErrorHandler("User already have partner", 404));
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
    message:
      "User added to partner's userList and hierarchy updated successfully",
  });
});

// REMOVE TOP PARTNER

const removeTopPartner = asyncError(async (req, res, next) => {
  const { userId } = req.body;

  if (!userId) {
    return next(new ErrorHandler("User ID is required", 400));
  }

  const user = await User.findOne({ userId });

  if (!user) {
    return next(new ErrorHandler("User not found", 404));
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
  user.partnerType = "user";
  user.partnerStatus = false;
  user.rechargeStatus = false;
  user.rechargePaymentId = 1000;
  user.parentPartnerId = 1000;
  user.parentParentPartnerId = 1000;
  user.topParentId = 1000;

  await user.save();

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

  // Remove the partner from the PartnerModule
  await PartnerModule.findByIdAndDelete(partner._id);

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

    res
      .status(200)
      .json({ message: "Recharge status updated successfully", partner });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// const getAllPendingRechargeCount = asyncError(async (req, res, next) => {
//   // Count all transactions with type "Recharge" and status "Pending"
//   const pendingRechargeCount = await Transaction.countDocuments({
//     transactionType: "Recharge",
//     paymentStatus: "Pending",
//   });

//   res.status(200).json({
//     success: true,
//     pendingRechargeCount,
//   });
// });

const getAllPendingRechargeCount = asyncError(async (req, res, next) => {
  // Count all transactions with type "Recharge", "Deposit", and "Withdraw" that are "Pending"
  const [pendingRechargeCount, pendingDepositCount, pendingWithdrawCount] =
    await Promise.all([
      Transaction.countDocuments({
        transactionType: "Recharge",
        paymentStatus: "Pending",
      }),
      Transaction.countDocuments({
        transactionType: "Deposit",
        paymentStatus: "Pending",
      }),
      Transaction.countDocuments({
        transactionType: "Withdraw",
        paymentStatus: "Pending",
      }),
    ]);

  res.status(200).json({
    success: true,
    pendingRechargeCount,
    pendingDepositCount,
    pendingWithdrawCount,
  });
});

const getAllRecharge = asyncError(async (req, res, next) => {
  let { page, limit } = req.query;

  // Convert page and limit to integers and set default values
  page = parseInt(page) || 1;
  limit = parseInt(limit) || 10;
  const skip = (page - 1) * limit;

  try {
    // Fetch all recharge entries with pagination and sort by newest first
    const rechargeModule = await RechargeModule.find()
      .sort({ createdAt: -1 }) // Sorting by newest first
      .skip(skip) // Skip based on page number
      .limit(limit); // Limit the number of recharge entries per page

    // Get total number of recharge entries
    const totalRecharge = await RechargeModule.countDocuments();

    res.status(200).json({
      success: true,
      count: rechargeModule.length,
      rechargeModule,
      totalRecharge,
      totalPages: Math.ceil(totalRecharge / limit),
      currentPage: page,
    });
  } catch (error) {
    next(error);
  }
});

// const getAllRecharge = asyncError(async (req, res, next) => {
//   try {
//     // Fetch all profit deductions sorted by newest first
//     const rechargeModule = await RechargeModule.find().sort({
//       createdAt: -1,
//     });

//     res.status(200).json({
//       success: true,
//       count: rechargeModule.length,
//       rechargeModule,
//     });
//   } catch (error) {
//     next(error);
//   }
// });

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

// GET PARTNER RECHARGE LIST
// const getSinglePartnerRecharges = asyncError(async (req, res, next) => {
//   const { userId } = req.params;
//   let { page, limit } = req.query;

//   // Convert page and limit to integers and set default values
//   page = parseInt(page) || 1;
//   limit = parseInt(limit) || 10;
//   const skip = (page - 1) * limit;

//   // Step 3: Find the partner using userId
//   const partner = await PartnerModule.findOne({ userId });
//   if (!partner) {
//     return next(new ErrorHandler("Partner not found", 404));
//   }

//   // Step 4: Find the rechargeModule from RechargeModule
//   const rechargeModule = await RechargeModule.findById(
//     partner.rechargeModule
//   ).populate({
//     path: "rechargeList",
//     options: {
//       sort: { createdAt: -1 }, // Sort in descending order
//       skip: skip, // Skip based on page number
//       limit: limit, // Limit the number of recharges per page
//     },
//   });

//   if (!rechargeModule) {
//     return next(new ErrorHandler("Recharge Module not found", 404));
//   }

//   // Get total number of recharges for this partner
//   const totalRecharges = await RechargeModule.countDocuments({
//     _id: partner.rechargeModule,
//   });

//   // Step 5: Return populated rechargeList with pagination data
//   res.status(200).json({
//     success: true,
//     recharges: rechargeModule.rechargeList,
//     totalRecharges,
//     totalPages: Math.ceil(totalRecharges / limit),
//     currentPage: page,
//   });
// });

const getSinglePartnerRecharges = asyncError(async (req, res, next) => {
  const { userId } = req.params;
  let { page, limit } = req.query;

  // Convert page and limit to integers and set default values
  page = parseInt(page) || 1;
  limit = parseInt(limit) || 10;
  const skip = (page - 1) * limit;

  // Step 3: Find the partner using userId
  const partner = await PartnerModule.findOne({ userId });
  if (!partner) {
    return next(new ErrorHandler("Partner not found", 404));
  }

  // Step 4: Find the rechargeModule from RechargeModule and populate rechargeList with currency
  const rechargeModule = await RechargeModule.findById(
    partner.rechargeModule
  ).populate({
    path: "rechargeList",
    populate: {
      path: "currency", // Populate the currency field in rechargeList
      model: "Currency", // Assuming the model name is "Currency"
    },
    options: {
      sort: { createdAt: -1 }, // Sort in descending order
      skip: skip, // Skip based on page number
      limit: limit, // Limit the number of recharges per page
    },
  });

  if (!rechargeModule) {
    return next(new ErrorHandler("Recharge Module not found", 404));
  }

  // Get total number of recharges for this partner
  const totalRecharges = await RechargeModule.countDocuments({
    _id: partner.rechargeModule,
  });

  // Step 5: Return populated rechargeList with pagination data
  res.status(200).json({
    success: true,
    recharges: rechargeModule.rechargeList,
    totalRecharges,
    totalPages: Math.ceil(totalRecharges / limit),
    currentPage: page,
  });
});

// const getPendingRechargesCount = asyncError(async (req, res, next) => {
//   const { userId } = req.params;

//   // Step 1: Find the partner using userId
//   const partner = await PartnerModule.findOne({ userId });
//   if (!partner) {
//     return next(new ErrorHandler("Partner not found", 404));
//   }

//   // Step 2: Use aggregation to count pending recharges directly
//   const result = await RechargeModule.aggregate([
//     {
//       $match: {
//         _id: partner.rechargeModule,
//       },
//     },
//     {
//       $project: {
//         count: {
//           $size: {
//             $filter: {
//               input: "$rechargeList",
//               as: "recharge",
//               cond: { $eq: ["$$recharge.paymentStatus", "Pending"] },
//             },
//           },
//         },
//       },
//     },
//   ]);

//   const pendingCount = result.length > 0 ? result[0].count : 0;

//   res.status(200).json({
//     success: true,
//     pendingRechargesCount: pendingCount,
//     userId,
//     partnerId: partner._id,
//   });
// });

const getPendingRechargesCount = asyncError(async (req, res, next) => {
  const { userId } = req.params;

  // Step 1: Find the partner using userId
  const partner = await PartnerModule.findOne({ userId });
  if (!partner) {
    return next(new ErrorHandler("Partner not found", 404));
  }

  // Step 2: Find the rechargeModule and count pending recharges
  const rechargeModule = await RechargeModule.findById(
    partner.rechargeModule
  ).populate({
    path: "rechargeList",
    match: { paymentStatus: "Pending" }, // Only match pending recharges
    select: "_id", // We only need the count, not the actual documents
  });

  if (!rechargeModule) {
    return next(new ErrorHandler("Recharge Module not found", 404));
  }

  // The count is the length of the filtered rechargeList
  const pendingCount = rechargeModule.rechargeList.length;

  res.status(200).json({
    success: true,
    pendingRechargesCount: pendingCount,
    userId,
    partnerId: partner._id,
  });
});

const getAllRechargeTransactions = asyncError(async (req, res, next) => {
  // Get page and limit from query params or set default values
  const page = parseInt(req.query.page) || 1; // Default page is 1
  const limit = parseInt(req.query.limit) || 20; // Default limit is 10

  // Calculate the number of documents to skip for pagination
  const skip = (page - 1) * limit;

  // Fetch all transactions where transactionType is "Recharge"
  const transactions = await Transaction.find({ transactionType: "Recharge" })
    .populate("currency")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  if (!transactions || transactions.length === 0) {
    return next(new ErrorHandler("No recharge transactions found", 404));
  }

  // Get the total number of documents (for calculating total pages)
  const totalRecharges = await Transaction.countDocuments({
    transactionType: "Recharge",
  });

  res.status(200).json({
    success: true,
    transactions,
    page,
    limit,
    totalPages: Math.ceil(totalRecharges / limit),
    totalDeposits,
  });
});

// POWER BALL GAME

const createPowerBallGame = asyncError(async (req, res, next) => {
  const { name, startRange, endRange, multiplier, winnerPrize } = req.body;

  // Validate required fields
  if (!name) return next(new ErrorHandler("Name is required", 400));
  if (startRange === undefined || endRange === undefined) {
    return next(new ErrorHandler("Start and end range are required", 400));
  }
  if (!winnerPrize) {
    return next(new ErrorHandler("Winner prizes are required", 400));
  }

  // Create new PowerBallGame entry
  const newGame = await PowerBallGame.create({
    name,
    range: { startRange, endRange },
    winnerPrize,
    multiplier: Array.isArray(multiplier) ? multiplier : [], // If no multiplier provided, set empty array
  });

  res.status(201).json({
    success: true,
    message: "PowerBallGame created successfully",
    game: newGame,
  });
});

// ✅ Add Multiplier to the Game
// const addMultiplier = asyncError(async (req, res, next) => {
//   const { gameId } = req.params;
//   const { value } = req.body;

//   if (!value)
//     return next(new ErrorHandler("Multiplier value is required", 400));

//   const game = await PowerBallGame.findById(gameId);
//   if (!game) return next(new ErrorHandler("Game not found", 404));

//   game.multiplier.push({ value });
//   await game.save();

//   res.status(200).json({
//     success: true,
//     message: "Multiplier added successfully",
//     game,
//   });
// });
const addMultiplier = asyncError(async (req, res, next) => {
  const { value } = req.body;

  if (!value) {
    return next(new ErrorHandler("Multiplier value is required", 400));
  }

  // Fetch the latest game (sorted by createdAt in descending order)
  const game = await PowerBallGame.findOne().sort({ createdAt: -1 });

  if (!game) {
    return next(new ErrorHandler("No game found", 404));
  }

  // Add the new multiplier
  game.multiplier.push({ value });

  await game.save();

  res.status(200).json({
    success: true,
    message: "Multiplier added successfully",
    game,
  });
});

// ✅ Remove Multiplier from the Game
// const removeMultiplier = asyncError(async (req, res, next) => {
//   const { gameId } = req.params;
//   const { value } = req.body;

//   if (!value)
//     return next(new ErrorHandler("Multiplier value is required", 400));

//   const game = await PowerBallGame.findById(gameId);
//   if (!game) return next(new ErrorHandler("Game not found", 404));

//   // Filter out the multiplier with the given value
//   game.multiplier = game.multiplier.filter((item) => item.value !== value);
//   await game.save();

//   res.status(200).json({
//     success: true,
//     message: "Multiplier removed successfully",
//     game,
//   });
// });

const removeMultiplier = asyncError(async (req, res, next) => {
  const { value } = req.body;

  if (!value) {
    return next(new ErrorHandler("Multiplier value is required", 400));
  }

  // Fetch the latest game (sorted by createdAt in descending order)
  const game = await PowerBallGame.findOne().sort({ createdAt: -1 });

  if (!game) {
    return next(new ErrorHandler("No game found", 404));
  }

  // Filter out the multiplier with the given value
  game.multiplier = game.multiplier.filter((item) => item.value !== value);

  await game.save();

  res.status(200).json({
    success: true,
    message: "Multiplier removed successfully",
    game,
  });
});

// ✅ Update Name, StartRange, or EndRange
// const updateGameDetails = asyncError(async (req, res, next) => {
//   const { gameId } = req.params;
//   const { name, startRange, endRange } = req.body;

//   const game = await PowerBallGame.findById(gameId);
//   if (!game) return next(new ErrorHandler("Game not found", 404));

//   // Update only if the value is provided
//   if (name !== undefined) game.name = name;
//   if (startRange !== undefined) game.range.startRange = startRange;
//   if (endRange !== undefined) game.range.endRange = endRange;

//   await game.save();

//   res.status(200).json({
//     success: true,
//     message: "Game details updated successfully",
//     game,
//   });
// });
const updateGameDetails = asyncError(async (req, res, next) => {
  const { name, startRange, endRange } = req.body;

  // Fetch the latest game (sorted by createdAt in descending order)
  const game = await PowerBallGame.findOne().sort({ createdAt: -1 });

  if (!game) {
    return next(new ErrorHandler("No game found", 404));
  }

  // Update only if the value is provided
  if (name !== undefined) game.name = name;
  if (startRange !== undefined) game.range.startRange = startRange;
  if (endRange !== undefined) game.range.endRange = endRange;

  await game.save();

  res.status(200).json({
    success: true,
    message: "Game details updated successfully",
    game,
  });
});

// ✅ Get a Single PowerBall Game by ID
const getPowerBallGameById = asyncError(async (req, res, next) => {
  const { gameId } = req.params;

  const game = await PowerBallGame.findById(gameId);
  if (!game) return next(new ErrorHandler("PowerBall game not found", 404));

  res.status(200).json({
    success: true,
    game,
  });
});

// ✅ Get All PowerBall Games
const getAllPowerBallGames = asyncError(async (req, res, next) => {
  const games = await PowerBallGame.find().sort({ createdAt: -1 }); // Sorted by latest
  res.status(200).json({
    success: true,
    count: games.length,
    games,
  });
});

// POWERBALL TIME

// ✅ Create a New PowerTime

const createPowerTime = asyncError(async (req, res, next) => {
  const { powertime } = req.body;

  if (!powertime) {
    return next(new ErrorHandler("Power time is required", 400));
  }

  // 1. Create PowerTime
  const newPowerTime = await PowerTime.create({ powertime });

  // Helper function to process each date
  const processPowerDate = async (dateString) => {
    // 2. Create PowerDate
    const newPowerDate = await PowerDate.create({
      powerdate: dateString,
      powertime: newPowerTime._id,
    });

    // 3. Create PowerballGameTickets
    await PowerballGameTickets.create({
      powerdate: newPowerDate._id,
      powertime: newPowerTime._id,
      alltickets: [],
    });

    // 4. Create PartnerPerformancePowerball if not existing
    let partnerPerformance = await PartnerPerformancePowerball.findOne({
      powertime: newPowerTime._id,
      powerdate: newPowerDate._id,
    });

    if (!partnerPerformance) {
      partnerPerformance = new PartnerPerformancePowerball({
        powertime: newPowerTime._id,
        powerdate: newPowerDate._id,
        performances: [],
      });
      await partnerPerformance.save();
    }
  };

  // Process all three dates
  const datesToProcess = [
    getCurrentDate(), // Today
    getNextDate(), // Tomorrow
    getNextNextDate(), // Day after tomorrow
  ];

  // Process each date
  for (const date of datesToProcess) {
    await processPowerDate(date);
  }

  res.status(201).json({
    success: true,
    message: "PowerTime and all related entries created successfully.",
  });
});

// const createPowerTime = asyncError(async (req, res, next) => {
//   const { powertime } = req.body;

//   if (!powertime) {
//     return next(new ErrorHandler("Power time is required", 400));
//   }

//   // 1. Create PowerTime
//   const newPowerTime = await PowerTime.create({ powertime });

//   // 2. Get current date in 'DD-MM-YYYY' format using IST timezone
//   const powerdate = moment().tz("Asia/Kolkata").format("DD-MM-YYYY");

//   // 3. Create PowerDate
//   const newPowerDate = await PowerDate.create({
//     powerdate,
//     powertime: newPowerTime._id,
//   });

//   // 4. Create PowerballGameTickets
//   const newGameEntry = await PowerballGameTickets.create({
//     powerdate: newPowerDate._id,
//     powertime: newPowerTime._id,
//     alltickets: [],
//   });

//   // 5. Create PartnerPerformancePowerball if not already existing
//   let partnerPerformance = await PartnerPerformancePowerball.findOne({
//     powertime: newPowerTime._id,
//     powerdate: newPowerDate._id,
//   });

//   if (!partnerPerformance) {
//     partnerPerformance = new PartnerPerformancePowerball({
//       powertime: newPowerTime._id,
//       powerdate: newPowerDate._id,
//       performances: [],
//     });
//     await partnerPerformance.save();
//   }

//   res.status(201).json({
//     success: true,
//     message: "PowerTime and all related entries created successfully",
//   });
// });

// ✅ Update PowerTime by ID
const updatePowerTime = asyncError(async (req, res, next) => {
  const { id } = req.params;
  const { powertime } = req.body;

  let powerTime = await PowerTime.findById(id);
  if (!powerTime) {
    return next(new ErrorHandler("PowerTime not found", 404));
  }

  powerTime.powertime = powertime || powerTime.powertime;
  await powerTime.save();

  res.status(200).json({
    success: true,
    message: "PowerTime updated successfully",
    powerTime,
  });
});

// ✅ Delete PowerTime by ID
const deletePowerTime = asyncError(async (req, res, next) => {
  const { id } = req.params;

  const powerTime = await PowerTime.findById(id);
  if (!powerTime) {
    return next(new ErrorHandler("PowerTime not found", 404));
  }

  await powerTime.deleteOne();

  res.status(200).json({
    success: true,
    message: "PowerTime deleted successfully",
  });
});

// ✅ Get a Single PowerTime by ID
const getSinglePowerTime = asyncError(async (req, res, next) => {
  const { id } = req.params;

  const powerTime = await PowerTime.findById(id);
  if (!powerTime) {
    return next(new ErrorHandler("PowerTime not found", 404));
  }

  res.status(200).json({
    success: true,
    powerTime,
  });
});

// ✅ Get All PowerTimes
const getAllPowerTimes = asyncError(async (req, res, next) => {
  const powerTimes = await PowerTime.find().sort({ createdAt: 1 });

  res.status(200).json({
    success: true,
    count: powerTimes.length,
    powerTimes,
  });
});

// POWERBALL DATE

const getCurrentDate = () => {
  return moment.tz("Asia/Kolkata").format("DD-MM-YYYY");
};

const getNextDate = () => {
  return moment.tz("Asia/Kolkata").add(1, "days").format("DD-MM-YYYY");
};

const getNextNextDate = () => {
  return moment.tz("Asia/Kolkata").add(2, "days").format("DD-MM-YYYY");
};

// ✅ Create a New PowerDate

const createPowerDate = asyncError(async (req, res, next) => {
  const { powerdate, powertime } = req.body;

  if (!powerdate || !powertime) {
    return next(
      new ErrorHandler("Power date and power time ID are required", 400)
    );
  }

  // Check if powertime exists
  const timeExists = await PowerTime.findById(powertime);
  if (!timeExists) {
    return next(new ErrorHandler("Invalid power time ID", 404));
  }

  // Create PowerDate
  const newPowerDate = await PowerDate.create({ powerdate, powertime });

  // Create PowerballGameTickets using the newly created PowerDate ID
  const newGameEntry = await PowerballGameTickets.create({
    powerdate: newPowerDate._id, // Use the _id from PowerDate
    powertime,
    alltickets: [], // Initially empty
  });

  // GETTING THE PARTNER PERFORMANCE
  // Check if a PartnerPerformance already exists for the given lotlocation, lottime, and lotdate
  let partnerPerformance = await PartnerPerformancePowerball.findOne({
    powertime,
    powerdate: newPowerDate._id,
  });

  if (!partnerPerformance) {
    partnerPerformance = new PartnerPerformancePowerball({
      powertime,
      powerdate: newPowerDate._id,
      performances: [], // Initially empty
    });
    await partnerPerformance.save();
  }

  res.status(201).json({
    success: true,
    message: "PowerDate and PowerballGameTickets created successfully",
  });
});

// const createPowerDate = asyncError(async (req, res, next) => {
//   const { powerdate, powertime } = req.body;

//   if (!powerdate || !powertime) {
//     return next(
//       new ErrorHandler("Power date and power time ID are required", 400)
//     );
//   }

//   // Check if powertime exists
//   const timeExists = await PowerTime.findById(powertime);
//   if (!timeExists) {
//     return next(new ErrorHandler("Invalid power time ID", 404));
//   }

//   const newPowerDate = await PowerDate.create({ powerdate, powertime });

//   res.status(201).json({
//     success: true,
//     message: "PowerDate created successfully",
//     powerDate: newPowerDate,
//   });
// });

// ✅ Update PowerDate by ID
const updatePowerDate = asyncError(async (req, res, next) => {
  const { id } = req.params;
  const { powerdate, powertime } = req.body;

  let powerDate = await PowerDate.findById(id);
  if (!powerDate) {
    return next(new ErrorHandler("PowerDate not found", 404));
  }

  // If powertime is updated, validate it
  if (powertime) {
    const timeExists = await PowerTime.findById(powertime);
    if (!timeExists) {
      return next(new ErrorHandler("Invalid power time ID", 404));
    }
    powerDate.powertime = powertime;
  }

  powerDate.powerdate = powerdate || powerDate.powerdate;
  await powerDate.save();

  res.status(200).json({
    success: true,
    message: "PowerDate updated successfully",
    powerDate,
  });
});

// ✅ Delete PowerDate by ID
const deletePowerDate = asyncError(async (req, res, next) => {
  const { id } = req.params;

  const powerDate = await PowerDate.findById(id);
  if (!powerDate) {
    return next(new ErrorHandler("PowerDate not found", 404));
  }

  await powerDate.deleteOne();

  res.status(200).json({
    success: true,
    message: "PowerDate deleted successfully",
  });
});

// ✅ Get a Single PowerDate by ID (with populated powertime)
const getSinglePowerDate = asyncError(async (req, res, next) => {
  const { id } = req.params;

  const powerDate = await PowerDate.findById(id).populate("powertime");
  if (!powerDate) {
    return next(new ErrorHandler("PowerDate not found", 404));
  }

  res.status(200).json({
    success: true,
    powerDate,
  });
});

const getPowerDatesByTime = asyncError(async (req, res, next) => {
  const { id } = req.params; // powertime ID
  const { page = 1, limit = 10 } = req.query; // Pagination parameters

  const pageNumber = parseInt(page, 10);
  const limitNumber = parseInt(limit, 10);
  const skip = (pageNumber - 1) * limitNumber;

  // Fetch power dates based on powertime ID with pagination, sorted by newest first
  const powerDates = await PowerDate.find({ powertime: id })
    .populate("powertime")
    .sort({ createdAt: -1 }) // Sorting by newest first
    .skip(skip)
    .limit(limitNumber);

  if (!powerDates.length) {
    return next(
      new ErrorHandler("No PowerDates found for the given powertime ID", 404)
    );
  }

  // Get total count for pagination info
  const total = await PowerDate.countDocuments({ powertime: id });
  const totalPages = Math.ceil(total / limitNumber);

  res.status(200).json({
    success: true,
    page: pageNumber,
    totalPages,
    totalRecords: total,
    powerDates,
  });
});

// ✅ Get All PowerDates (with populated powertime)
// const getAllPowerDates = asyncError(async (req, res, next) => {
//   const powerDates = await PowerDate.find()
//     .populate("powertime")
//     .sort({ createdAt: -1 });

//   res.status(200).json({
//     success: true,
//     count: powerDates.length,
//     powerDates,
//   });
// });

const getAllPowerDates = asyncError(async (req, res, next) => {
  const { page, limit, sortBy, sortOrder } = req.query;

  // Set default values for pagination if not provided
  const currentPage = parseInt(page) || 1;
  const itemsPerPage = parseInt(limit) || 10;
  const skip = (currentPage - 1) * itemsPerPage;

  // Set sorting criteria (default by createdAt)
  const sortField = sortBy || "createdAt";
  const sortDirection = sortOrder === "asc" ? 1 : -1; // Default to descending

  try {
    // Fetch powerDates with pagination and sorting
    const powerDates = await PowerDate.find()
      .skip(skip)
      .limit(itemsPerPage)
      .populate("powertime")
      .sort({ [sortField]: sortDirection });

    // Get total count of powerDates for pagination info
    const totalPowerDates = await PowerDate.countDocuments();

    res.status(200).json({
      success: true,
      powerDates,
      count: powerDates.length,
      totalPowerDates,
      totalPages: Math.ceil(totalPowerDates / itemsPerPage),
      currentPage,
    });
  } catch (error) {
    next(new ErrorHandler(error.message, 500));
  }
});

// ✅ Add Winner Prize to PowerBallGame
// const addWinnerPrize = asyncError(async (req, res, next) => {
//   const { gameId } = req.params;
//   const {
//     firstprize,
//     secondPrize,
//     thirdprize,
//     fourthPrize,
//     fifthprize,
//     sixthPrize,
//   } = req.body;

//   let game = await PowerBallGame.findById(gameId);
//   if (!game) {
//     return next(new ErrorHandler("PowerBallGame not found", 404));
//   }

//   game.winnerPrize = {
//     firstprize: firstprize || game.winnerPrize.firstprize,
//     secondPrize: secondPrize || game.winnerPrize.secondPrize,
//     thirdprize: thirdprize || game.winnerPrize.thirdprize,
//     fourthPrize: fourthPrize || game.winnerPrize.fourthPrize,
//     fifthprize: fifthprize || game.winnerPrize.fifthprize,
//     sixthPrize: sixthPrize || game.winnerPrize.sixthPrize,
//   };

//   await game.save();

//   res.status(200).json({
//     success: true,
//     message: "Winner prize updated successfully",
//     game,
//   });
// });
const addWinnerPrize = asyncError(async (req, res, next) => {
  const {
    firstprize,
    secondPrize,
    thirdprize,
    fourthPrize,
    fifthprize,
    sixthPrize,
  } = req.body;

  // Fetch the latest game (sorted by createdAt in descending order)
  let game = await PowerBallGame.findOne().sort({ createdAt: -1 });

  if (!game) {
    return next(new ErrorHandler("PowerBallGame not found", 404));
  }

  // Update only if values are provided
  game.winnerPrize = {
    firstprize: firstprize ?? game.winnerPrize?.firstprize,
    secondPrize: secondPrize ?? game.winnerPrize?.secondPrize,
    thirdprize: thirdprize ?? game.winnerPrize?.thirdprize,
    fourthPrize: fourthPrize ?? game.winnerPrize?.fourthPrize,
    fifthprize: fifthprize ?? game.winnerPrize?.fifthprize,
    sixthPrize: sixthPrize ?? game.winnerPrize?.sixthPrize,
  };

  await game.save();

  res.status(200).json({
    success: true,
    message: "Winner prize updated successfully",
    game,
  });
});

// TO PLAY POWERBALL GAME

const createPowerballGameTickets = asyncError(async (req, res, next) => {
  const { powerdate, powertime } = req.body;

  // Validate required fields
  if (!powerdate || !powertime) {
    return next(new ErrorHandler("Powerdate and Powertime are required", 400));
  }

  // Create a new PowerballGameTickets entry with an empty alltickets array
  const newEntry = await PowerballGameTickets.create({
    powerdate,
    powertime,
    alltickets: [], // Initially empty
  });

  res.status(201).json({
    success: true,
    message: "PowerballGameTickets entry created successfully",
    data: newEntry,
  });
});

const getAllPowerballGameTickets = asyncError(async (req, res, next) => {
  try {
    const powerTickets = await PowerballGameTickets.find()
      .populate("powerdate")
      .populate("powertime")
      .sort({ createdAt: -1 }); // Sorting by latest created first

    res.status(200).json({
      success: true,
      count: powerTickets.length,
      powerTickets,
    });
  } catch (error) {
    next(new ErrorHandler(error.message, 500));
  }
});

// const getPowerballGameTicketsByDateAndTime = asyncError(
//   async (req, res, next) => {
//     const { powerdateId, powertimeId } = req.params;
//     const { page = 1, limit = 10 } = req.query;

//     try {
//       // Validate IDs
//       if (
//         !mongoose.Types.ObjectId.isValid(powerdateId) ||
//         !mongoose.Types.ObjectId.isValid(powertimeId)
//       ) {
//         return next(new ErrorHandler("Invalid powerdate or powertime ID", 400));
//       }

//       const pageNumber = Math.max(1, parseInt(page, 10));
//       const limitNumber = Math.min(100, Math.max(1, parseInt(limit, 10))); // Limit max 100 per page
//       const skip = (pageNumber - 1) * limitNumber;

//       // PHASE 1: Get total count (optimized)
//       const [totalResult] = await PowerballGameTickets.aggregate([
//         {
//           $match: {
//             powerdate: new mongoose.Types.ObjectId(powerdateId),
//             powertime: new mongoose.Types.ObjectId(powertimeId),
//           },
//         },
//         {
//           $project: {
//             ticketCount: {
//               $size: {
//                 $reduce: {
//                   input: "$alltickets",
//                   initialValue: [],
//                   in: { $concatArrays: ["$$value", "$$this.tickets"] },
//                 },
//               },
//             },
//           },
//         },
//       ]);

//       const total = totalResult?.ticketCount || 0;
//       const totalPages = Math.ceil(total / limitNumber);

//       // PHASE 2: Get paginated data (optimized)
//       const tickets = await PowerballGameTickets.aggregate([
//         {
//           $match: {
//             powerdate: new mongoose.Types.ObjectId(powerdateId),
//             powertime: new mongoose.Types.ObjectId(powertimeId),
//           },
//         },
//         { $unwind: "$alltickets" },
//         { $unwind: "$alltickets.tickets" },
//         { $sort: { "alltickets.tickets.createdAt": -1 } },
//         { $skip: skip },
//         { $limit: limitNumber },
//         {
//           $group: {
//             _id: "$_id",
//             powerdate: { $first: "$powerdate" },
//             powertime: { $first: "$powertime" },
//             alltickets: {
//               $push: {
//                 userId: "$alltickets.userId",
//                 username: "$alltickets.username",
//                 currency: "$alltickets.currency",
//                 tickets: ["$alltickets.tickets"],
//                 createdAt: "$alltickets.createdAt",
//                 updatedAt: "$alltickets.updatedAt",
//               },
//             },
//             createdAt: { $first: "$createdAt" },
//             updatedAt: { $first: "$updatedAt" },
//           },
//         },
//       ]);

//       // Populate references
//       const populatedTickets = await PowerballGameTickets.populate(tickets, [
//         { path: "powerdate" },
//         { path: "powertime" },
//         { path: "alltickets.currency" },
//       ]);

//       res.status(200).json({
//         success: true,
//         page: pageNumber,
//         totalPages,
//         totalRecords: total,
//         tickets: populatedTickets,
//       });
//     } catch (error) {
//       next(new ErrorHandler(error.message, 500));
//     }
//   }
// );

const getPowerballGameTicketsByDateAndTime = asyncError(
  async (req, res, next) => {
    const { powerdateId, powertimeId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    try {
      // Validate IDs
      if (
        !mongoose.Types.ObjectId.isValid(powerdateId) ||
        !mongoose.Types.ObjectId.isValid(powertimeId)
      ) {
        return next(new ErrorHandler("Invalid powerdate or powertime ID", 400));
      }

      const pageNumber = Math.max(1, parseInt(page, 10));
      const limitNumber = Math.min(100, Math.max(1, parseInt(limit, 10))); // Limit max 100 per page
      const skip = (pageNumber - 1) * limitNumber;

      // PHASE 1: Get total count (optimized)
      const [totalResult] = await PowerballGameTickets.aggregate([
        {
          $match: {
            powerdate: new mongoose.Types.ObjectId(powerdateId),
            powertime: new mongoose.Types.ObjectId(powertimeId),
          },
        },
        {
          $project: {
            ticketCount: {
              $size: {
                $reduce: {
                  input: "$alltickets",
                  initialValue: [],
                  in: { $concatArrays: ["$$value", "$$this.tickets"] },
                },
              },
            },
          },
        },
      ]);

      const total = totalResult?.ticketCount || 0;
      const totalPages = Math.ceil(total / limitNumber);

      // PHASE 2: Get paginated data (optimized)
      const tickets = await PowerballGameTickets.aggregate([
        {
          $match: {
            powerdate: new mongoose.Types.ObjectId(powerdateId),
            powertime: new mongoose.Types.ObjectId(powertimeId),
          },
        },
        { $unwind: "$alltickets" },
        { $unwind: "$alltickets.tickets" },
        { $sort: { "alltickets.tickets.createdAt": -1 } },
        { $skip: skip },
        { $limit: limitNumber },
        {
          $group: {
            _id: "$_id",
            powerdate: { $first: "$powerdate" },
            powertime: { $first: "$powertime" },
            alltickets: {
              $push: {
                userId: "$alltickets.userId",
                username: "$alltickets.username",
                currency: "$alltickets.currency",
                tickets: ["$alltickets.tickets"],
                createdAt: "$alltickets.createdAt",
                updatedAt: "$alltickets.updatedAt",
              },
            },
            createdAt: { $first: "$createdAt" },
            updatedAt: { $first: "$updatedAt" },
          },
        },
      ]);

      // Populate references
      const populatedTickets = await PowerballGameTickets.populate(tickets, [
        { path: "powerdate" },
        { path: "powertime" },
        { path: "alltickets.currency" },
      ]);

      // Calculate total amount from all tickets (not just paginated ones)
      const [totalAmountResult] = await PowerballGameTickets.aggregate([
        {
          $match: {
            powerdate: new mongoose.Types.ObjectId(powerdateId),
            powertime: new mongoose.Types.ObjectId(powertimeId),
          },
        },
        { $unwind: "$alltickets" },
        { $unwind: "$alltickets.tickets" },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: "$alltickets.tickets.convertedAmount" },
          },
        },
      ]);

      const totalAmount = totalAmountResult?.totalAmount || 0;

      res.status(200).json({
        success: true,
        page: pageNumber,
        totalPages,
        totalRecords: total,
        totalAmount, // Add the total amount to the response
        tickets: populatedTickets,
      });
    } catch (error) {
      next(new ErrorHandler(error.message, 500));
    }
  }
);

const searchUser = asyncError(async (req, res, next) => {
  const searchTerm = req.query.searchTerm; // This will be the string passed

  try {
    if (!searchTerm) {
      return res.status(400).json({
        success: false,
        message: "Please provide a search term",
      });
    }

    let query = { partnerType: "user" }; // Ensure only users with partnerType "user" are searched

    // Check if the searchTerm is a userId (numeric string like "1000")
    if (/^\d+$/.test(searchTerm)) {
      query.userId = searchTerm;
    } else {
      query.name = { $regex: new RegExp(searchTerm, "i") }; // Case-insensitive search for name
    }

    // Search for the user based on the query and populate the country
    const user = await User.findOne(query).populate("country");

    res.status(200).json({
      success: true,
      users: user ? [user] : [],
    });
  } catch (error) {
    next(new ErrorHandler(error.message, 500));
  }
});

// const searchUser = asyncError(async (req, res, next) => {
//   const searchTerm = req.query.searchTerm; // This will be the string passed

//   try {
//     if (!searchTerm) {
//       return res.status(400).json({
//         success: false,
//         message: "Please provide a search term",
//       });
//     }

//     let query = {};

//     // Check if the searchTerm is a userId (numeric string like "1000")
//     if (/^\d+$/.test(searchTerm)) {
//       // If it's a numeric string, treat it as a userId
//       query.userId = searchTerm;
//     } else {
//       // Otherwise, treat it as a name
//       query.name = { $regex: new RegExp(searchTerm, "i") }; // Case-insensitive search for name
//     }

//     // Search for the user based on the query and populate the country
//     const user = await User.findOne(query).populate("country");

//     res.status(200).json({
//       success: true,
//       users: user ? [user] : [],
//     });
//   } catch (error) {
//     next(new ErrorHandler(error.message, 500));
//   }
// });

const searchPartner = asyncError(async (req, res, next) => {
  const searchTerm = req.query.searchTerm; // This will be the string passed

  try {
    if (!searchTerm) {
      return res.status(400).json({
        success: false,
        message: "Please provide a search term",
      });
    }

    let query = {
      partnerType: "partner", // Filter by partnerType "partner"
    };

    // Check if the searchTerm is a userId (numeric string like "1000")
    if (/^\d+$/.test(searchTerm)) {
      query.userId = searchTerm; // If numeric, search by userId
    } else {
      query.name = { $regex: new RegExp(searchTerm, "i") }; // Case-insensitive search for name
    }

    // Search for the partner based on the query and populate the country
    const user = await PartnerModule.findOne(query)
      .populate("country")
      .populate("walletTwo");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Partner not found",
        partners: [], // Return an empty array when no partner is found
      });
    }

    res.status(200).json({
      success: true,
      partners: [user], // Wrap the user object inside an array
    });
  } catch (error) {
    next(new ErrorHandler(error.message, 500));
  }
});
const searchSubPartner = asyncError(async (req, res, next) => {
  const searchTerm = req.query.searchTerm; // This will be the string passed

  try {
    if (!searchTerm) {
      return res.status(400).json({
        success: false,
        message: "Please provide a search term",
      });
    }

    let query = {
      partnerType: "subpartner", // Filter by partnerType "subpartner"
    };

    // Check if the searchTerm is a userId (numeric string like "1000")
    if (/^\d+$/.test(searchTerm)) {
      query.userId = searchTerm; // If numeric, search by userId
    } else {
      query.name = { $regex: new RegExp(searchTerm, "i") }; // Case-insensitive search for name
    }

    // Search for the partner based on the query and populate the country
    const user = await PartnerModule.findOne(query)
      .populate("country")
      .populate("walletTwo");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Sub-partner not found",
        partners: [], // Return an empty array when no sub-partner is found
      });
    }

    res.status(200).json({
      success: true,
      subpartners: [user], // Wrap the user object inside an array
    });
  } catch (error) {
    next(new ErrorHandler(error.message, 500));
  }
});

// const searchPartner = asyncError(async (req, res, next) => {
//   const searchTerm = req.query.searchTerm; // This will be the string passed

//   try {
//     if (!searchTerm) {
//       return res.status(400).json({
//         success: false,
//         message: "Please provide a search term",
//       });
//     }

//     let query = {
//       partnerType: "partner", // Filter by partnerType "partner"
//     };

//     // Check if the searchTerm is a userId (numeric string like "1000")
//     if (/^\d+$/.test(searchTerm)) {
//       // If it's a numeric string, treat it as a userId
//       query.userId = searchTerm;
//     } else {
//       // Otherwise, treat it as a name
//       query.name = { $regex: new RegExp(searchTerm, "i") }; // Case-insensitive search for name
//     }

//     // Search for the partner based on the query and populate the country
//     const user = await PartnerModule.findOne(query).populate("country");

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: "Partner not found",
//       });
//     }

//     res.status(200).json({
//       success: true,
//       user,
//     });
//   } catch (error) {
//     next(new ErrorHandler(error.message, 500));
//   }
// });

// const searchSubPartner = asyncError(async (req, res, next) => {
//   const searchTerm = req.query.searchTerm; // This will be the string passed

//   try {
//     if (!searchTerm) {
//       return res.status(400).json({
//         success: false,
//         message: "Please provide a search term",
//       });
//     }

//     let query = {
//       partnerType: "subpartner", // Filter by partnerType "partner"
//     };

//     // Check if the searchTerm is a userId (numeric string like "1000")
//     if (/^\d+$/.test(searchTerm)) {
//       // If it's a numeric string, treat it as a userId
//       query.userId = searchTerm;
//     } else {
//       // Otherwise, treat it as a name
//       query.name = { $regex: new RegExp(searchTerm, "i") }; // Case-insensitive search for name
//     }

//     // Search for the partner based on the query and populate the country
//     const user = await PartnerModule.findOne(query).populate("country");

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: "Partner not found",
//       });
//     }

//     res.status(200).json({
//       success: true,
//       user,
//     });
//   } catch (error) {
//     next(new ErrorHandler(error.message, 500));
//   }
// });

// [DEFAULT RECHARGE AND PROFIT VALUE]

// Update settings API (for admin)
const updateSettings = async (req, res) => {
  try {
    const { minProfitPercentage, minRechargePercentage } = req.body;

    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
    }

    if (minProfitPercentage !== undefined) {
      settings.minProfitPercentage = minProfitPercentage;
    }

    if (minRechargePercentage !== undefined) {
      settings.minRechargePercentage = minRechargePercentage;
    }

    await settings.save();

    res.status(200).json({
      success: true,
      message: "Settings updated successfully",
      data: settings,
    });
  } catch (error) {
    console.error("Error updating settings:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// [UPDATE OTHER PAYMENT INPUT NAME]
const updateInputNames = async (req, res) => {
  try {
    const { firstInputName, secondInputName, thirdInputName, fourthInputName } =
      req.body;

    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
    }

    if (firstInputName !== undefined) {
      settings.firstInputName = firstInputName;
    }

    if (secondInputName !== undefined) {
      settings.secondInputName = secondInputName;
    }

    if (thirdInputName !== undefined) {
      settings.thirdInputName = thirdInputName;
    }

    if (fourthInputName !== undefined) {
      settings.fourthInputName = fourthInputName;
    }

    await settings.save();

    res.status(200).json({
      success: true,
      message: "Input names updated successfully",
      data: settings,
    });
  } catch (error) {
    console.error("Error updating input names:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const getSettings = asyncError(async (req, res, next) => {
  // Fetch the settings from the database
  const settings = await Settings.findOne();

  // If no settings found, return default values
  if (!settings) {
    return res.status(200).json({
      success: true,
      message: "Settings not found, returning default values.",
      settings: {
        minProfitPercentage: 5, // Default minimum profit percentage
        minRechargePercentage: 2, // Default minimum recharge percentage
      },
    });
  }

  res.status(200).json({
    success: true,
    message: "Settings retrieved successfully.",
    settings,
  });
});

const getInputNames = async (req, res) => {
  try {
    // Fetch the settings from the database
    const settings = await Settings.findOne();

    // If no settings found, return default values
    if (!settings) {
      return res.status(200).json({
        success: true,
        message: "Settings not found, returning default values.",
        inputNames: {
          firstInputName: null, // Default to null
          secondInputName: null, // Default to null
          thirdInputName: null, // Default to null
          fourthInputName: null, // Default to null
        },
      });
    }

    res.status(200).json({
      success: true,
      message: "Input names retrieved successfully.",
      inputNames: {
        firstInputName: settings.firstInputName || null,
        secondInputName: settings.secondInputName || null,
        thirdInputName: settings.thirdInputName || null,
        fourthInputName: settings.fourthInputName || null,
      },
    });
  } catch (error) {
    console.error("Error retrieving input names:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Get total count for Users and Partners
const getTotalCounts = asyncError(async (req, res, next) => {
  const allUserCount = await User.countDocuments({ role: "user" });

  const partnerCount = await PartnerModule.countDocuments({
    partnerType: "partner",
  });

  const subPartnerCount = await PartnerModule.countDocuments({
    partnerType: "subpartner",
  });

  res.status(200).json({
    success: true,
    allUserCount,
    partnerCount,
    subPartnerCount,
  });
});

module.exports = {
  getTotalCounts,
  getInputNames,
  updateInputNames,
  getSettings,
  updateSettings,
  getPowerballGameTicketsByDateAndTime,
  getAllPowerballGameTickets,
  searchSubPartner,
  searchPartner,
  createPowerballGameTickets,
  addWinnerPrize,
  createPowerDate,
  updatePowerDate,
  deletePowerDate,
  getSinglePowerDate,
  getAllPowerDates,
  createPowerTime,
  updatePowerTime,
  deletePowerTime,
  getSinglePowerTime,
  getAllPowerTimes,
  getPowerBallGameById,
  getAllPowerBallGames,
  updateGameDetails,
  addMultiplier,
  removeMultiplier,
  createPowerBallGame,
  getAllRechargeTransactions,
  getSinglePartnerRecharges,
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
  updateRechargePermission,
  searchUser,
  searchPartnerUserList,
  getPowerDatesByTime,
  searchPartnerPartnerList,
  increasePartnerRecharge,
  getAllRechargeAdmin,
  getAllPendingRechargeCount,
  getPendingRechargesCount,
};
