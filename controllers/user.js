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

const register = asyncError(async (req, res, next) => {
  const { name, email, password, devicetoken, role, country } = req.body;

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

  if (user) return next(new ErrorHandler("User Already exist", 400));

  const contact = userId;

  user = await User.create({
    name,
    email: normalizedEmail,
    password,
    userId, // Add userId to the user object
    contact,
    devicetoken,
    role,
    country, // Add country to the user object
  });

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
  const user = await User.findById(req.params.id)
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
    const { balance, walletName, visibility } = req.body;

    // Validate input
    if (!balance || isNaN(balance)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid balance value" });
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
    const { balance, walletName, visibility } = req.body;

    // Validate input
    if (!balance || isNaN(balance)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid balance value" });
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
      expires: new Date(Date.now()),
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

const deleteNotification = asyncError(async (req, res, next) => {
  const { id } = req.params;
  // Find the promotion by ID and delete it
  const deletedNotification = await Notification.findByIdAndDelete(id);

  if (!deletedNotification) {
    return res.status(404).json({
      success: false,
      message: "Notification not found",
    });
  }

  res.status(200).json({
    success: true,
    message: "Successfully Deleted",
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

const sendNotificationToAllUser = asyncError(async (req, res, next) => {
  try {
    // Fetch users with non-null devicetoken
    const users = await User.find({ devicetoken: { $ne: null } })
      .populate("walletOne")
      .populate("walletTwo")
      .sort({ createdAt: -1 });

    const { title, description } = req.body;

    console.log("Noti title :: " + title);
    console.log("Noti Description :: " + description);

    if (!title) return next(new ErrorHandler("Enter Notification title", 400));
    if (!description)
      return next(new ErrorHandler("Enter Notification Description", 400));

    const tokens = users.map((user) => user.devicetoken).filter(Boolean);

    console.log("tokens.length :: " + tokens.length);
    console.log("tokens :: " + JSON.stringify(tokens));

    if (tokens.length === 0)
      return next(
        new ErrorHandler("No user found with valid device token", 400)
      );

    const failedTokens = [];

    for (const token of tokens) {
      try {
        await firebase.messaging().send({
          token,
          notification: {
            title: title,
            body: description,
          },
        });
      } catch (error) {
        if (error.code === "messaging/registration-token-not-registered") {
          // Handle unregistered token error
          console.log("Unregistered token:", error.errorInfo.message);
          // Capture the token that caused the error
          const unregisteredToken = error.errorInfo.message.split(" ")[0];
          // Remove the unregistered token from your database
          await removeUnregisteredToken(unregisteredToken);
        } else {
          console.log("Error sending notification to token:", token);
          console.error(error);
          failedTokens.push(token);
        }
      }
    }

    if (failedTokens.length === tokens.length) {
      // If all tokens failed to receive notification
      return next(
        new ErrorHandler("Failed to send notification to all users", 500)
      );
    }

    // Save notification to database
    const notification = new Notification({
      title: title,
      description: description,
    });
    await notification.save();

    console.log("Notifications sent to all users successfully");
    res.status(200).json({
      success: true,
      message: "Notification sent successfully",
    });
  } catch (error) {
    console.error(error);
    next(new ErrorHandler("Internal server error", 500));
  }
});

const sendNotificationToSingleUser = asyncError(async (req, res, next) => {
  const users = await User.find({})
    .populate("walletOne")
    .populate("walletTwo")
    .sort({ createdAt: -1 });
  const { title, description, devicetoken, userId } = req.body;

  console.log("Noti title :: " + title);
  console.log("Noti Descrtipton :: " + description);

  if (!title) return next(new ErrorHandler("Enter Notification title", 400));
  if (!description)
    return next(new ErrorHandler("Enter Notification Description", 400));
  if (!devicetoken)
    return next(new ErrorHandler("Device token not found", 400));
  // if (!userId) return next(new ErrorHandler("User not found", 400));

  // djqkwjYdTMGpY1C_vj8cey:APA91bEtG5Zg9YRvWPn2bru3tkGbywzFDr2rtl_HUMQw15ONDG1HdP7cr1NtpwxCCR0I_PE1jCeFKciKX7IP55h4umYlGRVXmRwfV6-E601HKFQDsoZaMVtdZ9WVDALWUU7EDo3w4DA8

  try {
    await firebase.messaging().send({
      token: devicetoken,
      notification: {
        // Notification content goes here
        title: title,
        body: description,
      },
    });

    // // Create a notification record in the database
    // const notification = new Notification({
    //   userId: userId, // Assuming req.user contains the admin's information
    //   title: title,
    //   description: description,
    // });
    // await notification.save();

    // Update notifications array for each user
    //  const notificationData = {
    //   title: title,
    //   description: description
    // };
    // await Promise.all(users.map(async user => {
    //   user.notifications.push(notificationData);
    //   await user.save();
    // }));

    console.log("Notification sent and saved");
  } catch (error) {
    console.log(error);
    next(new ErrorHandler(error, 400));
  }

  res.status(200).json({
    success: true,
    message: "Notification sent successfully",
  });
});

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

// const transferAmountFromWalletOneToWalletTwo = asyncError(async (req, res, next) => {
//   try {
//     const { userid, amount } = req.body;

//     // Validate input
//     if (!amount || isNaN(amount) || amount <= 0) {
//       return res.status(400).json({ success: false, message: "Invalid amount value" });
//     }

//     // Find the user
//     const user = await User.findById(userid).populate('walletOne').populate('walletTwo');
//     if (!user) {
//       return res.status(404).json({ success: false, message: "User not found" });
//     }

//     const walletOne = user.walletOne;
//     const walletTwo = user.walletTwo;

//     // Check if walletOne has sufficient balance
//     if (walletOne.balance < amount) {
//       return res.status(400).json({ success: false, message: "Insufficient balance in walletOne" });
//     }

//     // Perform the transfer
//     walletOne.balance -= amount;
//     walletTwo.balance += amount;

//     // Save the updated wallets
//     await walletOne.save();
//     await walletTwo.save();

//     res.status(200).json({
//       success: true,
//       message: "Transfer successful",
//       walletOne: { balance: walletOne.balance },
//       walletTwo: { balance: walletTwo.balance },
//     });
//   } catch (error) {
//     console.error("Error transferring amount:", error);
//     res.status(500).json({ success: false, message: "Internal server error" });
//   }
// });

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

      // Perform the transfer, ensuring balance is treated as a number
      walletOne.balance = Number(walletOne.balance) - parseFloat(amount);
      walletTwo.balance = Number(walletTwo.balance) + parseFloat(amount);

      // // Save the updated wallets
      // await walletOne.save();
      // await walletTwo.save();

      // FOR BALANCE SHEET

      // Create AppBalanceSheet entry
      // Calculate gameBalance as the total sum of all walletTwo balances  + totalAmount

      // const walletTwoBalances = await WalletTwo.find({});
      // const gameBalance =
      //   walletTwoBalances.reduce((sum, wallet) => sum + wallet.balance, 0) +
      //   amount;
      const walletTwoBalances = await WalletTwo.find({});
      const gameBalance =
        walletTwoBalances.reduce(
          (sum, wallet) => sum + parseFloat(wallet.balance),
          0
        ) + parseFloat(amount);

      // Calculate walletOneBalances as the total sum of all walletOne balances - totalAmount
      const walletOneBalances = await WalletOne.find({});
      const withdrawalBalance =
        walletOneBalances.reduce((sum, wallet) => sum + wallet.balance, 0) -
        amount;

      // Calculate totalbalance as the total sum of walletOne and walletTwo balances add totalAmount
      const totalBalance =
        parseFloat(withdrawalBalance) + parseFloat(gameBalance);

      // Create a new AppBalanceSheet document
      const appBalanceSheet = new AppBalanceSheet({
        amount: amount,
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

  const user = await User.findOne({ contact: userid });
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

  const transaction = await Transaction.create({
    amount,
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

//   const transactions = await Transaction.find({ userId: userid });

//   // if (!transactions || transactions.length === 0) {
//   //   return next(new ErrorHandler("No transactions found for this user", 404));
//   // }

//   res.status(200).json({
//     success: true,
//     transactions,
//   });
// });

// // Get All Deposits and Withdrawals of a Single User
const getUserTransactions = asyncError(async (req, res, next) => {
  const { userid } = req.query;

  const transactions = await Transaction.find({ userId: userid }).sort({
    createdAt: -1,
  });

  // if (!transactions || transactions.length === 0) {
  //   return next(new ErrorHandler("No transactions found for this user", 404));
  // }

  res.status(200).json({
    success: true,
    transactions,
  });
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
  const deposits = await Transaction.find({ transactionType: "Deposit" })
    .populate("currency")
    .sort({
      createdAt: -1,
    });

  res.status(200).json({
    success: true,
    deposits,
  });
});

// UPDATE PAYMENT STATUS
const updateDepositStatus = asyncError(async (req, res, next) => {
  const { transactionId, paymentStatus } = req.body;

  // Validate required fields
  if (!transactionId) {
    return next(new ErrorHandler("Transaction ID missing", 400));
  }
  if (!paymentStatus) {
    return next(new ErrorHandler("Payment status missing", 400));
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
    const amount = parseInt(transaction.amount);

    const user = await User.findOne({ userId });

    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }

    // FOR DEPOSITING MONEY IN USER WALLET ONE
    console.log("Deposit request of user :: " + user);

    const walletId = user.walletOne._id;
    console.log("wallet one id :: " + walletId);

    const wallet = await WalletOne.findById(walletId);

    console.log("Wallet one ::  " + wallet);
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
    const currency = await Currency.findById(user.country._id);
    if (!currency) {
      return next(new ErrorHandler("Currency not found", 404));
    }

    const currencyconverter = parseFloat(currency.countrycurrencyvaluecomparedtoinr);

    // FOR BALANCE SHEET

    // Create AppBalanceSheet entry
    // Calculate gameBalance as the total sum of all walletTwo balances

    const walletTwoBalances = await WalletTwo.find({});
    const gameBalance = walletTwoBalances.reduce(
      (sum, wallet) => sum + wallet.balance,
      0
    );

    // Calculate walletOneBalances as the total sum of all walletOne balances add totalAmount
    const walletOneBalances = await WalletOne.find({});
    const withdrawalBalance =
      walletOneBalances.reduce((sum, wallet) => sum + wallet.balance, 0) +
      parseFloat(amount * currencyconverter);

    // Calculate totalbalance as the total sum of walletOne and walletTwo balances add totalAmount
    const totalBalance = withdrawalBalance + gameBalance;

    // Update wallet
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
      activityType: "Deposit",
      userId: userId,
      transactionId: transaction._id,
      paymentProcessType: "Credit",
    });

    // Save the AppBalanceSheet document
    await appBalanceSheet.save();
    console.log("AppBalanceSheet Created Successfully");

    // END BALANCE SHEET
  }

  // FOR PAYMENT COMPLETED FOR WITHDRAW
  if (
    paymentStatus === "Completed" &&
    transaction.transactionType === "Withdraw"
  ) {
    const userId = transaction.userId;
    const amount = parseInt(transaction.amount);

    const user = await User.findOne({ userId });

    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }

    // FOR DEPOSITING MONEY IN USER WALLET ONE
    console.log("Deposit request of user :: " + user);

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

    const currency = await Currency.findById(user.country._id);
    if (!currency) {
      return next(new ErrorHandler("Currency not found", 404));
    }

    const currencyconverter = parseFloat(currency.countrycurrencyvaluecomparedtoinr);

    // Create AppBalanceSheet entry
    // Calculate gameBalance as the total sum of all walletTwo balances

    const walletTwoBalances = await WalletTwo.find({});
    const gameBalance = walletTwoBalances.reduce(
      (sum, wallet) => sum + wallet.balance,
      0
    );

    // Calculate walletOneBalances as the total sum of all walletOne balances add totalAmount
    const walletOneBalances = await WalletOne.find({});
    const withdrawalBalance =
      walletOneBalances.reduce((sum, wallet) => sum + wallet.balance, 0) -
      parseFloat(amount * currencyconverter);

    // Calculate totalbalance as the total sum of walletOne and walletTwo balances add totalAmount
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
    });

    // Save the AppBalanceSheet document
    await appBalanceSheet.save();
    console.log("AppBalanceSheet Created Successfully");

    // END BALANCE SHEET
  }

  if (paymentStatus) transaction.paymentStatus = paymentStatus;

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
  } = req.body;

  const user = await User.findOne({ contact: userid });
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  if (!amount) return next(new ErrorHandler("Amount missing", 400));
  if (!paymenttype) return next(new ErrorHandler("Payment type missing", 400));
  if (!username) return next(new ErrorHandler("Username missing", 400));

  const transaction = await Transaction.create({
    amount,
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
const getAllWithdrawals = asyncError(async (req, res, next) => {
  const withdrawals = await Transaction.find({
    transactionType: "Withdraw",
  })
    .populate("currency")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    withdrawals,
  });
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
};

// const { asyncError } = require("../middlewares/error.js");
// const LotAppAbout = require("../models/lotappabout.js");
// const Promotion = require("../models/promotion.js");
// const User = require("../models/user.js");
// const ErrorHandler = require("../utils/error.js");
// const { getDataUri, sendEmail, sendToken } = require("../utils/features.js");
// const fs = require("fs");
// const pathModule = require("path");
// const WalletOne = require("../models/walletone.js");
// const WalletTwo = require("../models/wallettwo.js");
// const { firebase } = require("../firebase/index.js");
// const Notification = require("../models/Notification.js");
// const { userInfo } = require("os");

// // const login = asyncError(async (req, res, next) => {
// //   const { email, password } = req.body;

// //   if (!password) return next(new ErrorHandler("Please enter password", 400));
// //   if (!email) return next(new ErrorHandler("Please enter email", 400));

// //   const user = await User.findOne({ email }).select("+password");

// //   if (!user) return next(new ErrorHandler("Not Registered", 400));

// //   const isMatched = await user.comparePassword(password);

// //   if (!isMatched) {
// //     return next(new ErrorHandler("Incorrect Email or Password", 400));
// //   }

// //   sendToken(user, res, `Welcome Back, ${user.name}`, 200);
// // });

// // const register = asyncError(async (req, res, next) => {
// //   const { name, email, password, devicetoken, role } = req.body;

// //   let userCount = await User.countDocuments();

// //   let userId = 1000 + userCount;
// //   let userExists = true;

// //   // Loop until a unique userId is found
// //   while (userExists) {
// //     let user = await User.findOne({ contact: userId });
// //     if (!user) {
// //       userExists = false;
// //     } else {
// //       userId++; // Increment userId
// //     }
// //   }

// //   let user = await User.findOne({ email });

// //   if (user) return next(new ErrorHandler("User Already exist", 400));

// //   const contact = userId;

// //   user = await User.create({
// //     name,
// //     email,
// //     password,
// //     userId, // Add userId to the user object
// //     contact,
// //     devicetoken,
// //     role
// //   });

// //   // sendToken(user, res, `Registered Successfully`, 201);

// //   res.status(201).json({
// //     success: true,
// //     message: 'Registered Successfully',
// // });

// // });

// // // this one is the first one which was already commented
// // // const register = asyncError(async (req, res, next) => {
// // //   const { name, email, password, devicetoken } = req.body;

// // //   // Count existing users whose role is not admin
// // //   let userCount = await User.countDocuments({ role: { $ne: "admin" } });

// // //   // Generate userId starting from 1000
// // //   const userId = 1000 + userCount;

// // //   let user = await User.findOne({ email });

// // //   if (user) return next(new ErrorHandler("User Already exist", 400));

// // //   const contact = userId;

// // //   // const devicetoken = devicetoken;

// // //   // add cloudinary here

// // //   user = await User.create({
// // //     name,
// // //     email,
// // //     password,
// // //     userId, // Add userId to the user object
// // //     contact,
// // //     devicetoken,
// // //   });

// // //   sendToken(user, res, `Registered Successfully`, 201);
// // // });

// // // const getMyProfile = asyncError(async (req, res, next) => {

// // //   console.log("Mine Request")

// // //   const op = req.user;

// // //   console.log("Request :: "+JSON.stringify(op))

// // //   const user = await User.findById(req.user._id)
// // //     .populate("walletOne")
// // //     .populate("walletTwo");

// // //   res.status(200).json({
// // //     success: true,
// // //     user,
// // //   });
// // // });

// // const getMyProfile = asyncError(async (req, res, next) => {
// //   console.log("Request received for fetching user profile.");

// //   // Check if req.user is populated correctly
// //   console.log("information :", req.token);
// //   console.log("User information from token:", req.user);

// //   // Ensure req.user is available and has _id
// //   if (!req.user || !req.user._id) {
// //     console.error("User information is missing or incomplete.");
// //     return res.status(401).json({ success: false, message: "Unauthorized" });
// //   }

// //   try {
// //     // Fetch user profile from the database using user id
// //     const user = await User.findById(req.user._id)
// //       .populate("walletOne")
// //       .populate("walletTwo");

// //     if (!user) {
// //       console.error("User not found in the database.");
// //       return res.status(404).json({ success: false, message: "User not found" });
// //     }

// //     console.log("User profile retrieved successfully:", user);

// //     // Return the user profile
// //     res.status(200).json({ success: true, user });
// //   } catch (error) {
// //     console.error("Error fetching user profile:", error);
// //     res.status(500).json({ success: false, message: "Internal server error" });
// //   }
// // });

// const login = asyncError(async (req, res, next) => {
//   const { email, password } = req.body;

//   if (!password) return next(new ErrorHandler("Please enter password", 400));
//   if (!email) return next(new ErrorHandler("Please enter email", 400));

//   const user = await User.findOne({ email }).select("+password");

//   if (!user) return next(new ErrorHandler("Not Registered, create an account", 400));

//   const isMatched = await user.comparePassword(password);

//   if (!isMatched) {
//     return next(new ErrorHandler("Incorrect Email or Password", 400));
//   }

//   sendToken(user, res, `Welcome Back, ${user.name}`, 200);

// });

// const register = asyncError(async (req, res, next) => {
//   const { name, email, password, devicetoken, role } = req.body;

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

//   let user = await User.findOne({ email });

//   if (user) return next(new ErrorHandler("User Already exist", 400));

//   const contact = userId;

//   user = await User.create({
//     name,
//     email,
//     password,
//     userId, // Add userId to the user object
//     contact,
//     devicetoken,
//     role
//   });

//   // sendToken(user, res, `Registered Successfully`, 201);

//   res.status(201).json({
//     success: true,
//     message: 'Registered Successfully',
// });

// });

// const getMyProfile = asyncError(async (req, res, next) => {
//   const user = await User.findById(req.user._id)
//     .populate("walletOne")
//     .populate("walletTwo");

//   res.status(200).json({
//     success: true,
//     user,
//   });
// });

// const getUserDetails = asyncError(async (req, res, next) => {
//   const user = await User.findById(req.params.id)
//     .populate("walletOne")
//     .populate("walletTwo");

//   if (!user) return next(new ErrorHandler("User not found", 404));

//   res.status(200).json({
//     success: true,
//     user,
//   });
// });

// // Update Wallet One
// const updateWalletOne = asyncError(async (req, res, next) => {
//   try {
//     const { walletId } = req.params;
//     const { balance, walletName, visibility } = req.body;

//     // Validate input
//     if (!balance || isNaN(balance)) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Invalid balance value" });
//     }

//     // Update wallet
//     const updatedWallet = await WalletOne.findByIdAndUpdate(
//       walletId,
//       { balance, walletName, visibility },
//       { new: true }
//     );

//     if (!updatedWallet) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Wallet not found" });
//     }

//     res.status(200).json({ success: true, updatedWallet });
//   } catch (error) {
//     console.error("Error updating wallet:", error);
//     res.status(500).json({ success: false, message: "Internal server error" });
//   }
// });

// // Update Wallet Two
// const updateWalletTwo = asyncError(async (req, res, next) => {
//   try {
//     const { walletId } = req.params;
//     const { balance, walletName, visibility } = req.body;

//     // Validate input
//     if (!balance || isNaN(balance)) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Invalid balance value" });
//     }

//     // Update wallet
//     const updatedWallet = await WalletTwo.findByIdAndUpdate(
//       walletId,
//       { balance, walletName, visibility },
//       { new: true }
//     );

//     if (!updatedWallet) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Wallet not found" });
//     }

//     res.status(200).json({ success: true, updatedWallet });
//   } catch (error) {
//     console.error("Error updating wallet:", error);
//     res.status(500).json({ success: false, message: "Internal server error" });
//   }
// });

// const logout = asyncError(async (req, res, next) => {
//   res.status(200).json({
//     success: true,
//     message: "Logout successfully",
//   });
// });

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

// const changePassword = asyncError(async (req, res, next) => {
//   const user = await User.findById(req.user._id).select("+password");

//   const { oldPassword, newPassword } = req.body;

//   // Checking the user have enter old and new password
//   if (!oldPassword && !newPassword)
//     return next(new ErrorHandler("Please enter old and new password", 400));

//   const isMatched = await user.comparePassword(oldPassword);

//   if (!isMatched) {
//     return next(new ErrorHandler("Incorrect Old Password", 400));
//   }

//   user.password = newPassword;

//   await user.save();

//   res.status(200).json({
//     success: true,
//     message: "Password Changed Successfully",
//   });
// });

// // Upload Profile pic work is not completed i have to research something because i dont want to use cloundinay
// const updatePic = asyncError(async (req, res, next) => {
//   const user = await User.findById(req.user._id);

//   // req.file
//   const file = getDataUri();

//   // add cloundinary

//   res.status(200).json({
//     success: true,
//     user,
//   });
// });

// const forgetPassword = asyncError(async (req, res, next) => {
//   const { email } = req.body;
//   const user = await User.findOne({ email });

//   if (!user) return next(new ErrorHandler("Incorrect email", 404));

//   // Generating 6 digit otp
//   // max,min 2000,10000
//   // math.random()*(max-min)+min

//   const randomSixDitgitNumber = Math.random() * (999999 - 100000) + 100000;
//   const otp = Math.floor(randomSixDitgitNumber);
//   const otp_expire = 15 * 60 * 1000;

//   // Adding to the user otp
//   user.otp = otp;
//   user.otp_expire = new Date(Date.now() + otp_expire);

//   // console.log("OTP CODE :: " + otp);

//   await user.save();

//   // After Saving the otp we have to send a email
//   // sendEmail()

//   const message = `Your OTP For Reseting Password is ${otp}\nPlease ignore if you haven't requested this`;

//   try {
//     await sendEmail("OTP for resetting password", user.email, message);
//   } catch (error) {
//     user.otp = null;
//     user.otp_expire = null;

//     await user.save();
//     return next(error);
//   }

//   res.status(200).json({
//     success: true,
//     message: `Verification code has been sent to ${user.email}`,
//   });
// });

// const resetPassword = asyncError(async (req, res, next) => {
//   const { otp, password } = req.body;

//   const user = await User.findOne({
//     otp,
//     otp_expire: {
//       $gt: Date.now(),
//     },
//   });

//   if (!user)
//     return next(new ErrorHandler("Incorrect OTP or OTP has been expired", 400));

//   if (!password)
//     return next(new ErrorHandler("Please enter new password ", 400));

//   user.password = password;
//   user.otp = undefined;
//   user.otp_expire = undefined;

//   await user.save();

//   res.status(200).json({
//     success: true,
//     message: "Password changed successfully , you can login now",
//   });
// });

// // For uploading profile pic
// // const updateProfilePic = asyncError(async (req, res, next) => {
// //   const user = await User.findById(req.user._id);

// //   // Check if a file is provided in the request
// //   if (!req.file) {
// //     return res.status(400).json({
// //       success: false,
// //       message: "No file uploaded",
// //     });
// //   }

// //   const { filename } = req.file;

// //   // Get the directory name of the current module using import.meta.url
// //   const currentDir = pathModule.dirname(new URL(import.meta.url).pathname);

// //   // If user already has an avatar, delete the previous image
// //   if (user.avatar && user.avatar.url) {
// //     // Construct the path to the previous image
// //     const previousImagePath = pathModule.join(
// //       currentDir,
// //       "..",
// //       "public",
// //       "uploads",
// //       user.avatar.url
// //     );
// //     try {
// //       // Delete the previous image from the server
// //       fs.unlinkSync(previousImagePath);
// //     } catch (err) {
// //       console.error("Error deleting previous image:", err);
// //     }
// //   }

// //   console.log(req.file);

// //   const file = getDataUri(req.file);

// //   user.avatar = {
// //     public_id: req.user._id,
// //     url: filename,
// //   };

// //   await user.save();

// //   res.status(200).json({
// //     success: true,
// //     message: "Profile Pic Updated Successfully",
// //   });
// // });

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

//   // Get the directory name of the current module using __dirname
//   const currentDir = pathModule.dirname(__filename); // Use __filename instead of import.meta.url

//   // If user already has an avatar, delete the previous image
//   if (user.avatar && user.avatar.url) {
//     // Construct the path to the previous image
//     const previousImagePath = pathModule.join(
//       currentDir,
//       "..",
//       "public",
//       "uploads",
//       user.avatar.url
//     );
//     try {
//       // Delete the previous image from the server
//       fs.unlinkSync(previousImagePath);
//     } catch (err) {
//       console.error("Error deleting previous image:", err);
//     }
//   }

//   console.log(req.file);

//   const file = getDataUri(req.file);

//   user.avatar = {
//     public_id: req.user._id,
//     url: filename,
//   };

//   await user.save();

//   res.status(200).json({
//     success: true,
//     message: "Profile Pic Updated Successfully",
//   });
// });

// // For uploading profile pic
// const getProfilePic = asyncError(async (req, res, next) => {
//   // await User.findById(req.user._id);
//   const users = await User.find();

//   res.status(200).json({
//     success: true,
//     message: users,
//   });
// });

// const addPromotion = asyncError(async (req, res, next) => {
//   console.log(req.file);

//   const { filename, path, mimetype } = req.file;

//   // const uniqueFilename = `${Date.now()}${filename}`;

//   // Assuming you want to save public_id and url of the image in the database
//   const promotionData = {
//     url: filename,
//     // visibility: req.body.visibility, // Assuming you're passing visibility in the request body
//   };

//   // Create a new promotion record in the database
//   await Promotion.create(promotionData);

//   res.status(200).json({
//     success: true,
//     message: "Promotions Added Successfully",
//   });
// });

// const getAllPromotions = asyncError(async (req, res, next) => {
//   const promotions = await Promotion.find({});
//   res.status(200).json({
//     success: true,
//     promotions,
//   });
// });

// const deletePromotion = asyncError(async (req, res, next) => {
//   const { id } = req.params;

//   // Find the promotion by ID and delete it
//   const deletedPromotion = await Promotion.findByIdAndDelete(id);

//   if (!deletedPromotion) {
//     return res.status(404).json({
//       success: false,
//       message: "Promotion not found",
//     });
//   }

//   res.status(200).json({
//     success: true,
//     message: "Promotion deleted successfully",
//     deletedPromotion,
//   });
// });

// const updatePromotion = asyncError(async (req, res, next) => {
//   const { visibility } = req.body;

//   const promotion = await Promotion.findById(req.params.id);

//   if (!promotion) return next(new ErrorHandler("Promotion not found", 404));

//   console.log("Existing visibility:", promotion.visibility);
//   console.log("New visibility:", visibility);

//   promotion.visibility = visibility;

//   await promotion.save();

//   res.status(200).json({
//     success: true,
//     message: "Promotion Updated Successfully",
//     promotion,
//   });
// });

// const updateAnyUserUserId = asyncError(async (req, res, next) => {
//   try {
//     const userId = req.params.userId;
//     const newUserId = req.body.newUserId;

//     if (!userId) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Invalid user id" });
//     }

//     if (!newUserId) {
//       return res
//         .status(400)
//         .json({ success: false, message: "New userid missing" });
//     }

//     // Check if the new userId is unique and not used by any other user
//     const existingUser = await User.findOne({ userId: newUserId });
//     if (existingUser) {
//       return res
//         .status(400)
//         .json({ success: false, message: "New userId is already taken." });
//     }

//     // Find the user by the provided userId
//     const user = await User.findOne({ userId: userId });
//     if (!user) {
//       return res
//         .status(404)
//         .json({ success: false, message: "User not found." });
//     }

//     // Update the userId of the user
//     user.userId = newUserId;
//     await user.save();

//     return res
//       .status(200)
//       .json({ success: true, message: "User userId updated successfully." });
//   } catch (error) {
//     console.error(error);
//     return res
//       .status(500)
//       .json({ success: false, message: "Internal Server Error" });
//   }
// });

// // For Admin

// // ####################
// // ALL USER
// // ####################

// const getAllNotification = asyncError(async (req, res, next) => {
//   const notifications = await Notification.find({}).sort({ createdAt: -1 });

//   res.status(200).json({
//     success: true,
//     notifications,
//   });
// });

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

// const getAllUser = asyncError(async (req, res, next) => {
//   const users = await User.find({})
//     .populate("walletOne")
//     .populate("walletTwo")
//     .sort({ createdAt: -1 });

//   res.status(200).json({
//     success: true,
//     users,
//   });
// });

// // Get Single User Notification
// const singleUserNotification = asyncError(async (req, res, next) => {
//   try {
//     const userId = req.params.userId;

//     const notification = await Notification.findById(userId);

//     if (!notification)
//       return next(new ErrorHandler("Notification not found", 404));

//     res.status(200).json({
//       success: true,
//       notification,
//     });
//   } catch (error) {
//     console.error(error);
//     return res
//       .status(500)
//       .json({ success: false, message: "Internal Server Error" });
//   }
// });

// // Send notification to all user

// async function removeUnregisteredToken(token) {
//   try {
//     // Find the user with the given token and remove it from the database
//     const result = await User.deleteOne({ devicetoken: token });
//     if (result.deletedCount > 0) {
//       console.log(`Removed unregistered token from the database`);
//     } else {
//       console.log(`User with token "${token}" not found in the database.`);
//     }
//   } catch (error) {
//     console.error("Error removing unregistered token:", error);
//     // You can choose to handle the error further if needed
//   }
// }

// // Your notification sending function
// // const sendNotificationToAllUser = asyncError(async (req, res, next) => {
// //   const users = await User.find({})
// //     .populate("walletOne")
// //     .populate("walletTwo")
// //     .sort({ createdAt: -1 });
// //   const { title, description } = req.body;

// //   console.log("Noti title :: " + title);
// //   console.log("Noti Description :: " + description);

// //   if (!title) return next(new ErrorHandler("Enter Notification title", 400));
// //   if (!description)
// //     return next(new ErrorHandler("Enter Notification Description", 400));

// //   const tokens = [];

// //   console.log("before tokens.length :: " + tokens.length);
// //   console.log("users.length :: " + users.length);

// //   for (const user of users) {
// //     if (user.devicetoken) {
// //       console.log(JSON.stringify(user));
// //       tokens.push(user.devicetoken);
// //     }
// //   }

// //   console.log("tokens.length :: " + tokens.length);
// //   console.log("tokens :: " + JSON.stringify(tokens));

// //   if (tokens.length === 0) return next(new ErrorHandler("No user found", 400));

// //   try {
// //     for (const token of tokens) {
// //       await firebase.messaging().send({
// //         token,
// //         notification: {
// //           title: title,
// //           body: description,
// //         },
// //       });
// //     }

// //     const notification = new Notification({
// //       title: title,
// //       description: description,
// //     });
// //     await notification.save();

// //     console.log("Notifications sent to all users");
// //     res.status(200).json({
// //       success: true,
// //       message: "Notification sent successfully",
// //     });
// //   } catch (error) {
// //     if (error.code === "messaging/registration-token-not-registered") {
// //       // Handle unregistered token error
// //       console.log("Unregistered token:", error.errorInfo.message);
// //       // Capture the token that caused the error
// //       const unregisteredToken = error.errorInfo.message.split(" ")[0];
// //       // Remove the unregistered token from your database
// //       await removeUnregisteredToken(unregisteredToken);
// //     } else {
// //       console.log(error);
// //       next(new ErrorHandler(error, 400));
// //     }
// //   }
// // });

// const sendNotificationToAllUser = asyncError(async (req, res, next) => {
//   try {
//     // Fetch users with non-null devicetoken
//     const users = await User.find({ devicetoken: { $ne: null } })
//       .populate("walletOne")
//       .populate("walletTwo")
//       .sort({ createdAt: -1 });

//     const { title, description } = req.body;

//     console.log("Noti title :: " + title);
//     console.log("Noti Description :: " + description);

//     if (!title) return next(new ErrorHandler("Enter Notification title", 400));
//     if (!description) return next(new ErrorHandler("Enter Notification Description", 400));

//     const tokens = users.map(user => user.devicetoken).filter(Boolean);

//     console.log("tokens.length :: " + tokens.length);
//     console.log("tokens :: " + JSON.stringify(tokens));

//     if (tokens.length === 0) return next(new ErrorHandler("No user found with valid device token", 400));

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

//     if (failedTokens.length === tokens.length) {
//       // If all tokens failed to receive notification
//       return next(new ErrorHandler("Failed to send notification to all users", 500));
//     }

//     // Save notification to database
//     const notification = new Notification({
//       title: title,
//       description: description,
//     });
//     await notification.save();

//     console.log("Notifications sent to all users successfully");
//     res.status(200).json({
//       success: true,
//       message: "Notification sent successfully",
//     });
//   } catch (error) {
//     console.error(error);
//     next(new ErrorHandler("Internal server error", 500));
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
//   // if (!userId) return next(new ErrorHandler("User not found", 400));

//   // djqkwjYdTMGpY1C_vj8cey:APA91bEtG5Zg9YRvWPn2bru3tkGbywzFDr2rtl_HUMQw15ONDG1HdP7cr1NtpwxCCR0I_PE1jCeFKciKX7IP55h4umYlGRVXmRwfV6-E601HKFQDsoZaMVtdZ9WVDALWUU7EDo3w4DA8

//   try {
//     await firebase.messaging().send({
//       token: devicetoken,
//       notification: {
//         // Notification content goes here
//         title: title,
//         body: description,
//       },
//     });

//     // // Create a notification record in the database
//     // const notification = new Notification({
//     //   userId: userId, // Assuming req.user contains the admin's information
//     //   title: title,
//     //   description: description,
//     // });
//     // await notification.save();

//      // Update notifications array for each user
//     //  const notificationData = {
//     //   title: title,
//     //   description: description
//     // };
//     // await Promise.all(users.map(async user => {
//     //   user.notifications.push(notificationData);
//     //   await user.save();
//     // }));

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

// // All user who have register in last 24 hour

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
//     .sort({ createdAt: -1 });

//   res.status(200).json({
//     success: true,
//     users,
//   });
// });

// // #############################
// //  About us Section
// // #############################

// // About us update

// const updateAbout = asyncError(async (req, res, next) => {
//   const about = await LotAppAbout.findById(req.params.id);

//   if (!about) return next(new ErrorHandler("about not found", 404));

//   const { aboutTitle, aboutDescription } = req.body;

//   if (aboutTitle) about.aboutTitle = aboutTitle;
//   if (aboutDescription) about.aboutDescription = aboutDescription;

//   await about.save();

//   res.status(200).json({
//     success: true,
//     message: "Updated Successfully",
//   });
// });

// // Create Abuut app content
// const createAbout = asyncError(async (req, res, next) => {
//   const { aboutTitle, aboutDescription } = req.body;
//   // if (!result) return next(new ErrorHandler("Result not found", 404))
//   await LotAppAbout.create({ aboutTitle, aboutDescription });

//   res.status(200).json({
//     success: true,
//     message: "Successfully added about us",
//   });
// });

// const deleteAbout = asyncError(async (req, res, next) => {
//   const { id } = req.params;

//   // Find the promotion by ID and delete it
//   const deletedAbout = await LotAppAbout.findByIdAndDelete(id);

//   if (!deletedAbout) {
//     return res.status(404).json({
//       success: false,
//       message: "About not found",
//     });
//   }

//   res.status(200).json({
//     success: true,
//     message: "Successfully Deleted",
//     deleteAbout,
//   });
// });

// // Get all About Us
// const getAllAbout = asyncError(async (req, res, next) => {
//   const aboutus = await LotAppAbout.find({});

//   res.status(200).json({
//     success: true,
//     aboutus,
//   });
// });

// // Get All WalletOne
// const getAllWalletOne = asyncError(async (req, res, next) => {
//   const wallets = await WalletOne.find({});

//   res.status(200).json({
//     success: true,
//     wallets,
//   });
// });

// // Get All WalletTwo
// const getAllWalletTwo = asyncError(async (req, res, next) => {
//   const wallets = await WalletTwo.find({});

//   res.status(200).json({
//     success: true,
//     wallets,
//   });
// });

// // Update Wallet name
// // Controller function to update wallet names in all data
// const updateAllWalletNameOne = asyncError(async (req, res, next) => {
//   const walletName = req.body.walletName; // Assuming you pass new wallet name in the request body

//   // Update wallet names in all data
//   await WalletOne.updateMany({}, { $set: { walletName: walletName } });

//   res.status(200).json({
//     success: true,
//     message: "Wallet names updated successfully in all data.",
//   });
// });

// // Update Wallet name
// // Controller function to update wallet names in all data
// const updateAllWalletNameTwo = asyncError(async (req, res, next) => {
//   const walletName = req.body.walletName; // Assuming you pass new wallet name in the request body

//   // Update wallet names in all data
//   await WalletTwo.updateMany({}, { $set: { walletName: walletName } });

//   res.status(200).json({
//     success: true,
//     message: "Wallet names updated successfully in all data.",
//   });
// });

// module.exports = {
//   login,
//   register,
//   getMyProfile,
//   getUserDetails,
//   updateWalletOne,
//   updateWalletTwo,
//   logout,
//   updateProfile,
//   changePassword,
//   updatePic,
//   resetPassword,
//   forgetPassword,
//   updateProfilePic,
//   getProfilePic,
//   addPromotion,
//   getAllPromotions,
//   deletePromotion,
//   updatePromotion,
//   updateAnyUserUserId,
//   getAllUser,
//   getAllUserRegisterInLastOneDay,
//   updateAbout,
//   createAbout,
//   getAllAbout,
//   getAllWalletOne,
//   getAllWalletTwo,
//   updateAllWalletNameOne,
//   updateAllWalletNameTwo,
//   deleteAbout,
//   sendNotificationToAllUser,
//   sendNotificationToSingleUser,
//   singleUserNotification,
//   getAllNotification,
//   deleteNotification
// };
