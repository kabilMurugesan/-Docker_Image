const httpStatus = require("http-status");
const ApiError = require("../../../utils/ApiError");
const catchAsync = require("../../../utils/catchAsync");
const sharedRouteService = require("./sharedRoute.service");
const sharedRoutesByFromUserId = catchAsync(async (req, res) => {
  const response = await sharedRouteService.sharedRoutesByFromUserId(req);
  res.status(httpStatus.OK).send({ response });
});
const sharedRoutesByToUserId = catchAsync(async (req, res) => {
  const response = await sharedRouteService.sharedRoutesByToUserId(req.query.ToUserId);
  res.status(httpStatus.OK).send({ response });
});
// const getAllSharedRoute = catchAsync(async (req, res) => {
//   const response = await sharedRouteService.getAllSharedRoute();
//   res.status(httpStatus.OK).send({ response });
// });
const createSharedRoute = catchAsync(async (req, res) => {
  const response = await sharedRouteService.createSharedRoute(req.body.RouteId,req.body.UserId,req.body.share_route);
  res.status(httpStatus.OK).send({ response });
});
const sharedRouteDetailsById = catchAsync(async (req, res) => {
  const response = await sharedRouteService.sharedRouteDetailsById(req.query.shared_route_id);
  res.status(httpStatus.OK).send({ response });
});
const editSharedRoute = catchAsync(async (req, res) => {
  const response = await sharedRouteService.editSharedRoute(req);
  res.status(httpStatus.OK).send({ response });
});
const updateRouteStatus = catchAsync(async (req, res) => {
  const response = await sharedRouteService.updateRouteStatus(req);
  res.status(httpStatus.OK).send({ response });
});
const shareSharedRoute = catchAsync(async (req, res) => {
  const response = await sharedRouteService.shareSharedRoute(req);
  res.status(httpStatus.OK).send({ response });
});

const removeStop = catchAsync(async (req, res) => {
  const response = await sharedRouteService.removeStop(req);
  res.status(httpStatus.OK).send({ response });
});

const deleteSharedRoute = catchAsync(async (req, res) => {
  const response = await sharedRouteService.deleteSharedRoute(req);
  res.status(httpStatus.OK).send({ response });
});

const updateStopStatus = catchAsync(async (req, res) => {
  const response = await sharedRouteService.updateStopStatus(req);
  res.status(httpStatus.OK).send({ response });
});

const editStartDate=catchAsync(async(req,res)=>{
  const response=await sharedRouteService.editStartDate(req)
  res.status(httpStatus.OK).send({response})
})

module.exports = {
  sharedRoutesByFromUserId,
  sharedRoutesByToUserId,
  // getAllSharedRoute,
  createSharedRoute,
  sharedRouteDetailsById,
  editSharedRoute,
  updateRouteStatus,
  shareSharedRoute,
  removeStop,
  updateStopStatus,
  deleteSharedRoute,
  editStartDate
};
