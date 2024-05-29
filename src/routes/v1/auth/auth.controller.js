const httpStatus = require("http-status");
const ApiError = require("../../../utils/ApiError");
const catchAsync = require("../../../utils/catchAsync");
const authService = require("./auth.service");
const tokenService = require("../../../services/token.service");
const userDeviceService = require("../../../services/userDevice.service");

const login = catchAsync(async (req, res) => {
  // eslint-disable-next-line camelcase
  const {
    email,
    password,
    user_type,
    deviceId,
    deviceType,
    deviceOs,
    installDate,
    uninstallDate,
    appVersion
  } = req.body;
  //logging with user email and password
  const user = await authService.loginUserWithEmailAndPassword(
    email,
    password,
    user_type
  );
  if (user) {
    //generating authentication tokens
    const tokens = await tokenService.generateAuthTokens(user,deviceType,deviceId);
    //updating user device details in the db
    await userDeviceService.updateUserDeviceDetails(
      user.user_id,
      deviceId,
      deviceType,
      deviceOs,
      installDate,
      uninstallDate,
      appVersion
     
    );
    res
      .status(httpStatus.OK)
      .send({ message: "Logging in successfully", user, tokens });
  } else {
    throw new ApiError(httpStatus.UNAUTHORIZED, "User not found");
  }
});

const refreshTokens = catchAsync(async (req, res) => {
  const tokens = await authService.refreshAuth(req.body.refreshToken);
  res.status(httpStatus.OK).send({ ...tokens });
});

const resetPassword = catchAsync(async (req, res) => {
  const response = await authService.resetPassword(req);
  res.status(httpStatus.OK).send({ response });
});
const forgotPassword = catchAsync(async (req, res) => {
  const response = await authService.forgotPassword(req.body);
  res.status(httpStatus.OK).send({ response });
});
const verifyCode = catchAsync(async (req, res) => {
  const response = await authService.verifyCode(req.query);
  res.status(httpStatus.OK).send({ response });
});
const signup = catchAsync(async (req, res) => {
  const response = await authService.signup(req.body,res);
  res.status(httpStatus.OK).send({ response });
});
const logOut = catchAsync(async (req, res) => {
  const response = await authService.logOut(req);
  res.status(httpStatus.OK).send({ response });
});
const resendCode = catchAsync(async (req, res) => {
  const response = await authService.signupCode(req);
  res.status(httpStatus.OK).send({ response });
});
module.exports = {
  login,
  refreshTokens,
  resetPassword,
  signup,
  forgotPassword,
  verifyCode,
  logOut,
  resendCode
};
