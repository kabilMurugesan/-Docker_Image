const httpStatus = require("http-status");
const ApiError = require("../../../utils/ApiError");
const catchAsync = require("../../../utils/catchAsync");
const bannerService = require("./banner.service");



const getBannerDisplayDetails = catchAsync(async (req, res) => {
  const response = await bannerService.getBannerDisplayDetails(req);
  res.status(httpStatus.OK).send({ response });
});


module.exports = {
  getBannerDisplayDetails
  
};
