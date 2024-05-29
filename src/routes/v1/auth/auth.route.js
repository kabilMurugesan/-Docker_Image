const express = require("express");
const validate = require("../../../middlewares/validate");
const auth = require("../../../middlewares/auth");
const authValidation = require("./auth.validation");
const authController = require("./auth.controller");

const router = express.Router();

router.post("/login", validate(authValidation.login), authController.login);
router.post(
  "/refreshtoken",
  validate(authValidation.refreshTokens),
  authController.refreshTokens
);
router.post("/signup", validate(authValidation.signup), authController.signup);
router.post(
  "/forgot-password",
  validate(authValidation.forgotPassword),
  authController.forgotPassword
);
router.get(
  "/verify-code",
  validate(authValidation.verifyCode),
  authController.verifyCode
);
router.post(
  "/reset-password",
  validate(authValidation.resetPassword),
  authController.resetPassword
);
router.post("/logout",auth(), validate(authValidation.logout), authController.logOut);
router.post(
  "/resend-code",
  validate(authValidation.resendCode),
  authController.resendCode
);
module.exports = router;
