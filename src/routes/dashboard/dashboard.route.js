const express = require("express");
const validate = require("../../middlewares/validate");
const auth = require("../../middlewares/auth");
const dashboardValidation = require("./dashboard.validation");
const dashboardController = require("./dashboard.controller");

const router = express.Router();



router.get(
  "/",
  auth(),
  dashboardController.getDashboardDetails
);

router.get("/routechart", auth(), dashboardController.getChartDetails)

router.get("/userschart", auth(),  dashboardController.getUserChartDetails)

router.get("/userroutedetails", auth(), validate(dashboardValidation.getUserRouteDetails), dashboardController.getUserRouteDetails)

router.get("/getbannerdisplay", auth(), dashboardController.getBannerDisplayDetails);

router.get("/getuserlist", auth(), validate(dashboardValidation.getUserList), dashboardController.getUserList);

module.exports = router;
