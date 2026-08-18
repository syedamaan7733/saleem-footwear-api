const User = require("../models/User");
const { StatusCodes } = require("http-status-codes");
const CustomError = require("../errors");
const { checkPermission } = require("../utils");

const getAllUsers = async (req, res) => {
  const users = await User.find({ role: "user" }).select("-password");
  res.status(StatusCodes.OK).json({ users });
};

const getSingleUser = async (req, res) => {
  const user = await User.findOne({ _id: req.params.id }).select("-password");
  if (!user) {
    throw new CustomError.NotFoundError(
      `No users exist with id: ${req.params.id} `
    );
  }
  checkPermission(req.user, user._id);
  res.status(StatusCodes.OK).json({ user });
};

const getCurrentUser = async (req, res) => {
  const user = await User.findOne({ _id: req.user.userId }).select("-password");
  if (!user) {
    throw new CustomError.NotFoundError("No user found for this token");
  }
  res.status(StatusCodes.OK).json({ user });
};

const updateCurrentUser = async (req, res) => {
  const { name, shopName, address, deliveryAddress, pincode, landmark } =
    req.body;
  const user = await User.findOne({ _id: req.user.userId });
  if (!user) {
    throw new CustomError.NotFoundError("No user found for this token");
  }

  if (name !== undefined) {
    const trimmed = String(name).trim();
    if (trimmed.length < 3) {
      throw new CustomError.BadRequestError(
        "Name must be at least 3 characters."
      );
    }
    user.name = trimmed;
  }
  if (shopName !== undefined) {
    user.shopName = String(shopName).trim();
  }
  if (address !== undefined) {
    user.address = String(address).trim();
  }
  if (deliveryAddress !== undefined) {
    user.deliveryAddress = String(deliveryAddress).trim();
  }
  if (pincode !== undefined) {
    user.pincode = String(pincode).trim();
  }
  if (landmark !== undefined) {
    user.landmark = String(landmark).trim();
  }

  await user.save();
  const safe = await User.findOne({ _id: user._id }).select("-password");
  res.status(StatusCodes.OK).json({ user: safe, msg: "Profile updated." });
};

const resetUserPin = async (req, res) => {
  const user = await User.findOne({ _id: req.params.id });
  if (!user) {
    throw new CustomError.NotFoundError("User not found.");
  }
  user.password = "966900"; // temp pin, pre-save hook hashes it
  user.failedPinAttempts = 0;
  user.lockUntil = null;
  await user.save();
  res.status(StatusCodes.OK).json({ msg: "PIN reset to temporary 966900." });
};

module.exports = {
  getAllUsers,
  getSingleUser,
  getCurrentUser,
  updateCurrentUser,
  resetUserPin,
};
