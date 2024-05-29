const httpStatus = require("http-status");
const ApiError = require("../../utils/ApiError");
const catchAsync = require("../../utils/catchAsync");
const dashboardService = require("./dashboard.service");

const getDashboardDetails = catchAsync(async (req, res) => {
  const response = await dashboardService.getDashboardDetails(req);
  res.status(httpStatus.OK).send(response);
});


const getChartDetails = catchAsync(async (req, res) => {
  const response = await dashboardService.getChartDetails(req);
  res.status(httpStatus.OK).send(response);
});


const getUserChartDetails = catchAsync(async (req, res) => {
  const response = await dashboardService.getUserChartDetails(req);
  res.status(httpStatus.OK).send(response);
});

const getUserRouteDetails = catchAsync(async (req, res) => {
  const response = await dashboardService.getUserRouteDetails(req);
  res.status(httpStatus.OK).send(response);
});

const getBannerDisplayDetails = catchAsync(async (req, res) => {
  const response = await dashboardService.getBannerDisplayDetails(req);
  res.status(httpStatus.OK).send({ response });
});

const getUserList = catchAsync(async (req, res) => {
  const response = await dashboardService.getUserList(req);
  res.status(httpStatus.OK).send({ response });
});



module.exports = {
  getDashboardDetails,
  getChartDetails,
  getUserChartDetails,
  getUserRouteDetails,
  getBannerDisplayDetails,
  getUserList
};
