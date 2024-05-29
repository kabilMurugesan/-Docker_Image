const httpStatus = require("http-status");
const ApiError = require("../../../utils/ApiError");
const catchAsync = require("../../../utils/catchAsync");
const inviteesService = require("./invitees.service");

const createInvitees = catchAsync(async (req, res) => {
  const response = await inviteesService.createInvitees(req);
  res.status(httpStatus.OK).send({ response });
});




module.exports = {
  createInvitees
};
