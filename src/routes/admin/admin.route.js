const express = require("express");
const validate = require("../../middlewares/validate");
const auth = require("../../middlewares/auth");
const adminValidation = require("./admin.validation")
const adminController=require("./admin.controller")
const router = express.Router();


router.post("/login", validate(adminValidation.adminLogin), adminController.adminLogin);

router.post("/logout", validate(adminValidation.adminLogout), adminController.adminLogOut)

router.post(
    "/refreshtoken",
    validate(adminValidation.adminRefreshTokens),
    adminController.adminRefreshTokens
);

router.get(
    "/userdetails",
    auth(),
    validate(adminValidation.userDetails),
    adminController.userDetails
);

router.post(
    "/reset-password",
    auth(),
    validate(adminValidation.resetPassword),
    adminController.resetPassword
  );

router.get("/routedetails", auth(), validate(adminValidation.routeDetailsById), adminController.routeDetailsById);

router.get("/userroutedetails",auth(),validate(adminValidation.userRouteDetails),adminController.userRouteDetails)

module.exports = router;