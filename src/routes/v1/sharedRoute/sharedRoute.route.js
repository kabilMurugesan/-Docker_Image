const express = require("express");
const validate = require("../../../middlewares/validate");
const router = express.Router();
const sharedRouteController = require("./sharedRoute.controller");
const sharedRouteValidation = require("./sharedRoute.validation");
const auth = require("../../../middlewares/auth");

router.get("/detailsbyfromuserid", auth(), validate(sharedRouteValidation.sharedRoutesByFromUserId), sharedRouteController.sharedRoutesByFromUserId);
router.get("/detailsbytouserid", auth(),validate(sharedRouteValidation.sharedRoutesByToUserId), sharedRouteController.sharedRoutesByToUserId);
// router.get("/listall", auth(),sharedRouteController.getAllSharedRoute);
router.post("/create", auth() ,validate(sharedRouteValidation.createSharedRoute), sharedRouteController.createSharedRoute);
router.get("/sharedroutedetailsbyid", auth(), validate(sharedRouteValidation.sharedRouteDetailsById), sharedRouteController.sharedRouteDetailsById);
router.post("/editsharedroute", auth(),validate(sharedRouteValidation.editSharedRoute), sharedRouteController.editSharedRoute);
router.post("/updatestatus",auth(),validate(sharedRouteValidation.updateRouteStatus), sharedRouteController.updateRouteStatus);
router.post("/sharesharedroute", auth(), validate(sharedRouteValidation.shareSharedRoute), sharedRouteController.shareSharedRoute);
router.post("/removestop", auth(),  validate(sharedRouteValidation.removeStop), sharedRouteController.removeStop);
router.post("/updatestopstatus", auth(), validate(sharedRouteValidation.updateStopStatus), sharedRouteController.updateStopStatus);
router.post("/deleteroute", auth(), validate(sharedRouteValidation.deleteSharedRoute), sharedRouteController.deleteSharedRoute);
router.get("/editstartdate",auth(),validate(sharedRouteValidation.editStartDate),sharedRouteController.editStartDate)

module.exports = router;