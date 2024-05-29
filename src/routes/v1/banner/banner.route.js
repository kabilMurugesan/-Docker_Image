const express = require("express");
const auth = require("../../../middlewares/auth");
const bannerController = require("./banner.controller");
const router = express.Router();

router.get("/getbannerdisplay",bannerController.getBannerDisplayDetails);



module.exports = router;
