const express = require("express");
const auth = require("../../../middlewares/auth");
const validate = require("../../../middlewares/validate");
const routeController = require("./userRoute.controller");
const routeValidation = require("./userRoute.validation");
const router = express.Router();

router.post("/removestop", auth(), validate(routeValidation.removeStop), routeController.removeStop); 
router.post("/editroute", auth(), validate(routeValidation.editRoute), routeController.editRoute);
router.post("/createroute", auth(), validate(routeValidation.createRoute), routeController.createRoute);
router.get("/routelist", auth(), validate(routeValidation.userRouteById), routeController.userRouteById);
router.post("/addstop", auth(), validate(routeValidation.addRouteStop), routeController.addRouteStop);
router.get("/routedetails", auth(), validate(routeValidation.routeDetailsById), routeController.routeDetailsById);
router.get("/routestops", auth(), validate(routeValidation.getStopsByRouteId), routeController.getStopsByRouteId);
router.post("/updatestatus", auth(), validate(routeValidation.updateRouteStatus), routeController.updateRouteStatus);
router.post("/optimizeroute", auth(), validate(routeValidation.optimizeRoute), routeController.optimizeRoute);
router.post("/deleteroute", auth(), validate(routeValidation.deleteRoute), routeController.deleteRoute);
router.post("/updatestops", auth(), validate(routeValidation.updateStopStatus), routeController.updateStopStatus);
router.post("/deletestop", auth(), validate(routeValidation.deleteStop), routeController.deleteStop);
router.get("/routenamecheck", auth(),validate(routeValidation.checkRouteName), routeController.checkRouteName);
router.get("/allroutes", auth(), validate(routeValidation.homeScreen), routeController.homeScreen)
router.get("/recentroutes", auth(), validate(routeValidation.recentRoutes), routeController.recentRoutes)
router.get("/keeproute",auth(),validate(routeValidation.keepUserRoute),routeController.keepUserRoute)

module.exports = router;