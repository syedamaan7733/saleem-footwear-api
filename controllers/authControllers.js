const { StatusCodes } = require("http-status-codes");
const validator = require("validator");
const User = require("../models/User");
const CustomError = require("../errors");
const {
  createJWT,
  createTokenUser,
  validateIndianMobileNumber,
  attach_ResTOCookie,
} = require("../utils");

const register = async (req, res) => {
  const { name, shopName, password, address, phone } = req.body;

  if (!phone || !password) {
    throw new CustomError.BadRequestError(
      "Please provide phone number and password."
    );
  }

  const isValidNum = validateIndianMobileNumber(phone);

  if (!isValidNum) {
    throw new CustomError.BadRequestError("Your nubmer is invalid.");
  }
  // checking if email already in Database or not
  if (phone) {
    const isPhoneAlreadyExists = await User.findOne({ phone });
    // console.log(isEmailAlreadyExists);
    if (isPhoneAlreadyExists) {
      throw new CustomError.BadRequestError("Phone Alerady Exist.");
    }
  }

  // first registerd User is Always an Admin
  const isFistAdmin = (await User.countDocuments({})) === 0;
  const role = isFistAdmin ? "admin" : "user";

  const displayName =
    typeof name === "string" && name.trim().length >= 3
      ? name.trim()
      : `Dealer ${String(phone).slice(-4)}`;

  const user = await User.create({
    name: displayName,
    phone,
    shopName: typeof shopName === "string" ? shopName.trim() : "",
    password,
    role,
    address: typeof address === "string" ? address.trim() : "",
  });

  // extracting user data and createing cookie for forwarding as response
  const tokenUser = createTokenUser(user);

  // ALhumdulillah
  res
    .status(StatusCodes.CREATED)
    .json({ tokenUser, msg: "You have been registered. Please login!" });
};

const logIn = async (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) {
    throw new CustomError.BadRequestError(
      "Please provide Credentials and password"
    );
  }
  const isEmail = validator.isEmail(identifier);
  // console.log(isEmail);
  let user;
  if (isEmail) {
    user = await User.findOne({ email: identifier });
  } else {
    user = await User.findOne({ phone: identifier });
  }
  if (!user) {
    throw new CustomError.UnauthenticatedError("Invalid Credential");
  }
  // checking the password
  const isPasswordCorrect = await user.comparePassword(password);
  if (!isPasswordCorrect) {
    throw new CustomError.UnauthenticatedError("Invalid Password");
  }

  const userToken = createTokenUser(user);
  const token = createJWT({ payload: userToken });
  // res.cookie("token", "logout", {
  //   httpOnly: true,
  //   secure: process.env.NODEE_ENV === "production",
  //   expires: new Date.now() + 1000 * 60 * 60 * 24 * 300,
  // });
  res.status(StatusCodes.OK).json({ token, userToken });
};

const logout = async (req, res) => {
  res.cookie("token", "logout", {
    httpOnly: true,
    expires: new Date(Date.now()),
  });
  res.status(StatusCodes.OK).json({ msg: "user logged out!" });
};

module.exports = { register, logIn, logout };
