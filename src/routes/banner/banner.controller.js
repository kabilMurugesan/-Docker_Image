const httpStatus = require("http-status");
const ApiError = require("../../utils/ApiError");
const catchAsync = require("../../utils/catchAsync");
const bannerService = require("./banner.service");

const createBanner = catchAsync(async (req, res) => {
  const response = await bannerService.createBanner(req);
  res.status(httpStatus.OK).send({ response });
});


const editBanner = catchAsync(async (req, res) => {
  const response = await bannerService.editBanner(req);
  res.status(httpStatus.OK).send({ response });
});

const getAllBanner = catchAsync(async (req, res) => {
  const response = await bannerService.getAllBanner(req);
  res.status(httpStatus.OK).send({ response });
});

const getBannerById = catchAsync(async (req, res) => {
  const response = await bannerService.getBannerById(req);
  res.status(httpStatus.OK).send({ response });
});

// const getBannerDisplayDetails = catchAsync(async (req, res) => {
//   const response = await bannerService.getBannerDisplayDetails(req);
//   res.status(httpStatus.OK).send({ response });
// });

const createCompany = catchAsync(async (req, res) => {
  const response = await bannerService.createCompany(req);
  res.status(httpStatus.OK).send({ response });
});

const editCompany = catchAsync(async (req, res) => {
  const response = await bannerService.editCompany(req);
  res.status(httpStatus.OK).send({ response });
});

const getAllCompany = catchAsync(async (req, res) => {
  const response = await bannerService.getAllCompany(req);
  res.status(httpStatus.OK).send({ response });
});

const getCompanyById = catchAsync(async (req, res) => {
  const response = await bannerService.getCompanyById(req);
  res.status(httpStatus.OK).send({ response });
});

const getAllCompanyId = catchAsync(async (req, res) => {
  const response = await bannerService.getAllCompanyId(req);
  res.status(httpStatus.OK).send({ response });
});

module.exports = {
  createBanner,
  editBanner,
  getAllBanner,
  getBannerById,
  // getBannerDisplayDetails,
  createCompany,
  getAllCompany,
  editCompany,
  getCompanyById,
  getAllCompanyId
};
