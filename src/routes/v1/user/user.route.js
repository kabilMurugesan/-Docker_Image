const express = require("express");
const validate = require("../../../middlewares/validate");
const auth = require("../../../middlewares/auth");
const userController = require("./user.controller");
const userValidation = require("./user.validation");
const router = express.Router();

router.post("/addaddress",validate(userValidation.createAddress),userController.createAddress);
router.post("/updateaddress",validate(userValidation.updateAddress),userController.updateAddress);
router.get("/getaddress", validate(userValidation.getAddress),userController.getAddress);
router.get("/getcontactlist", validate(userValidation.getContactList),userController.getContactList);
router.get("/getuserlist", userController.getUserList);
router.post("/updateuserprofile",validate(userValidation.updateUserprofile),userController.updateUserProfile);
router.get(
    "/userdetails",
     validate(userValidation.userDetails),
    userController.userDetails
);
router.get("/userroutedetails",validate(userValidation.userRouteDetails), userController.userRouteDetails);
router.post("/deleteuseraccount", validate(userValidation.deleteUserAccount), userController.deleteUserAccount)
router.post("/activateuseraccount", validate(userValidation.activateuseraccount), userController.activateuseraccount)
module.exports = router;