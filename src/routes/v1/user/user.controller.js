const httpStatus = require("http-status");
const ApiError = require("../../../utils/ApiError");
const catchAsync = require("../../../utils/catchAsync");
const userService = require("./user.service");

const createAddress = catchAsync(async (req, res) => {
  const response = await userService.createAddress(req);
  res.status(httpStatus.OK).send({ response });
});

const updateAddress = catchAsync(async (req, res) => {
  const response = await userService.updateAddress(req);
  res.status(httpStatus.OK).send({ response });
});

const getAddress = catchAsync(async (req, res) => {
  const response = await userService.getAddress(req);
  res.status(httpStatus.OK).send({ response });
});

const getContactList = catchAsync(async (req, res) => {
  const response = await userService.getContactList(req);
  res.status(httpStatus.OK).send({ response });
});

const getUserList = catchAsync(async (req, res) => {
  const response = await userService.getUserList(req);
  res.status(httpStatus.OK).send({ response });
});

const updateUserProfile = catchAsync(async (req, res) => {
  const response = await userService.updateUserProfile(req);
  res.status(httpStatus.OK).send({ response });
});

const userDetails = catchAsync(async (req, res) => {
  const response = await userService.userDetails(req.query.user_id);
  res.status(httpStatus.OK).send({ response });
});

const userRouteDetails = catchAsync(async (req, res) => {
  const response = await userService.userRouteDetails(req);
  res.status(httpStatus.OK).send({ response });
});

const deleteUserAccount = catchAsync(async (req, res) => {
  const response = await userService.deleteUserAccount(req);
  res.status(httpStatus.OK).send({ response });
});

const activateuseraccount=catchAsync(async (req, res) => {
  const response = await userService.activateuseraccount(req);
  res.status(httpStatus.OK).send({ response });
})

module.exports = {
  createAddress,
  updateAddress,
  getAddress,
  getContactList,
  getUserList,
  updateUserProfile,
  userDetails,
  userRouteDetails,
  deleteUserAccount,
  activateuseraccount
};
