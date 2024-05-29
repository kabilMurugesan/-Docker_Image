const express = require("express");
const validate = require("../../../middlewares/validate");
const inviteesController = require("./invitees.controller");
const inviteesValidation = require("./invitees.validation");
const auth = require("../../../middlewares/auth");
const router = express.Router();



router.post("/create",
  auth(), 
  validate(inviteesValidation.createInvitees),
  inviteesController.createInvitees
);





module.exports = router;
