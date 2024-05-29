const express = require("express");
const validate = require("../../middlewares/validate");
const bannerController = require("./banner.controller");
const bannerValidation = require("./banner.validation");
const router = express.Router();
const auth = require("../../middlewares/auth");
router.post(
  "/create",
  auth(),
  validate(bannerValidation.createBanner),
  bannerController.createBanner
);

router.post(
  "/edit", 
  auth(),
  validate(bannerValidation.editBanner),
  bannerController.editBanner
);

router.get("/list", 
  auth(),
validate(bannerValidation.getAllBanner),
bannerController.getAllBanner);

router.get(
  "/getbannerbyid",
  auth(),
  validate(bannerValidation.getBannerById),
  bannerController.getBannerById
);

// router.get("/getbannerdisplay", bannerController.getBannerDisplayDetails);

router.post(
  "/createcompany",
  auth(),
  validate(bannerValidation.createCompany),
  bannerController.createCompany
);

router.post(
  "/editcompany",
  auth(),
  validate(bannerValidation.editCompany),
  bannerController.editCompany
);

router.get("/getallcompany", auth(), validate(bannerValidation.getAllCompany),bannerController.getAllCompany);

router.get(
  "/getcompanybyid",
  auth(),
  validate(bannerValidation.getCompanyById),
  bannerController.getCompanyById
);

router.get("/getallcompanyid", auth(), bannerController.getAllCompanyId);

module.exports = router;
