const { StatusCodes } = require("http-status-codes");
const validator = require("validator");
const User = require("../models/User");
const CustomError = require("../errors");
const {
  createJWT,
  createTokenUser,
  validateIndianMobileNumber,
  attach_ResTOCookie,
  validatePin,
} = require("../utils");

const register = async (req, res) => {
  const { name, shopName, address, phone } = req.body;
  const pin = req.body.pin ?? req.body.password;

  if (!phone || !pin) {
    throw new CustomError.BadRequestError(
      "Please provide phone number and PIN."
    );
  }

  if (!validatePin(pin)) {
    throw new CustomError.BadRequestError("PIN must be exactly 6 digits.");
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
    password: pin,
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

const LOCK_MAX_ATTEMPTS = 10;
const LOCK_WINDOW_MS = 5 * 60 * 1000;

const logIn = async (req, res) => {
  const { identifier } = req.body;
  const credential = req.body.pin ?? req.body.password;
  if (!identifier || !credential) {
    throw new CustomError.BadRequestError(
      "Please provide phone/email and PIN"
    );
  }

  const isEmail = validator.isEmail(identifier);
  const user = isEmail
    ? await User.findOne({ email: identifier })
    : await User.findOne({ phone: identifier });

  if (!user) {
    throw new CustomError.UnauthenticatedError("Invalid Credential");
  }

  // Locked out?
  if (user.lockUntil && user.lockUntil.getTime() > Date.now()) {
    const mins = Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000);
    throw new CustomError.UnauthenticatedError(
      `Too many attempts. Try again in ${mins} minute(s).`
    );
  }

  const isCorrect = await user.comparePassword(credential);
  if (!isCorrect) {
    user.failedPinAttempts = (user.failedPinAttempts || 0) + 1;
    if (user.failedPinAttempts >= LOCK_MAX_ATTEMPTS) {
      user.lockUntil = new Date(Date.now() + LOCK_WINDOW_MS);
      user.failedPinAttempts = 0;
    }
    await user.save();
    throw new CustomError.UnauthenticatedError("Invalid PIN");
  }

  // success — clear any lock state
  if (user.failedPinAttempts !== 0 || user.lockUntil !== null) {
    user.failedPinAttempts = 0;
    user.lockUntil = null;
    await user.save();
  }

  const userToken = createTokenUser(user);
  const token = createJWT({ payload: userToken });
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
