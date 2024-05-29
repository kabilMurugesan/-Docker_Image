const Joi = require("joi");

const password = (value, helpers) => {
  if (value.length < 8) {
    return helpers.message("password must be at least 8 characters");
  }
  if (!value.match(/\d/) || !value.match(/[a-zA-Z]/)) {
    return helpers.message(
      "password must contain at least 1 letter and 1 number"
    );
  }
  return value;
};

const login = {
  body: Joi.object().keys({
    email: Joi.string().required(),
    password: Joi.string().required(),
    deviceId: Joi.string().required(),
    deviceType: Joi.string().required(),
    deviceOs: Joi.string().required(),
    appVersion:Joi.string().required()
  }),
};

const refreshTokens = {
  body: Joi.object().keys({
    refreshToken: Joi.string().required(),
  }),
};

const logout = {
  body: Joi.object().keys({
    refreshToken: Joi.string().required(),
    deviceId: Joi.string().required(),
    deviceType: Joi.string().required()
  }),
};

const changePassword = {
  body: Joi.object().keys({
    oldPassword: Joi.string().required(),
    newPassword: Joi.string().required().custom(password),
    confirmNewPassword: Joi.string().required().custom(password),
  }),
};

const forgotPassword = {
  body: Joi.object().keys({
    email: Joi.string().email().required(),
  }),
};

const resetPassword = {
  body: Joi.object().keys({
    email: Joi.string().email().required(),
    newPassword: Joi.string().required().custom(password),
    confirmNewPassword: Joi.string().required().custom(password),
  }),
};
const verifyCode = {
  query: Joi.object().keys({
    email: Joi.string().email().required(),
    auth_code: Joi.string().required(),
    type: Joi.string().required(),
  }),
};

const signup = {
  body: Joi.object().keys({
    FirstName: Joi.string().required(),
    LastName: Joi.string().required(),
    Email: Joi.string().email().required(),
    Password: Joi.string().required().custom(password),
    PhoneNumber: Joi.string().required(),
    deviceId: Joi.string().required(),
    deviceType: Joi.string().required(),
    deviceOs: Joi.string().required(),
    appVersion: Joi.string().required()
  }),
};
const resendCode = {
  query: Joi.object().keys({
    email: Joi.string().email().required(),
    type: Joi.string().required().valid("signup", "forget_password"),
  }),
};
module.exports = {
  login,
  refreshTokens,
  logout,
  changePassword,
  forgotPassword,
  resetPassword,
  signup,
  verifyCode,
  resendCode,
};
