const httpStatus = require("http-status");
const ApiError = require("../../../utils/ApiError");
const catchAsync = require("../../../utils/catchAsync");
const userRouteService = require("./userRoute.service");

const editRoute = catchAsync(async (req, res) => {
  const response = await userRouteService.editRoute(req);
  res.status(httpStatus.OK).send(response);
});

const createRoute = catchAsync(async (req, res) => {
  const response = await userRouteService.createRoute(req);
  res.status(httpStatus.OK).send(response);
});

const userRouteById = catchAsync(async (req, res) => {
  const response = await userRouteService.userRouteById(req);
  res.status(httpStatus.OK).send({response});
});

const addRouteStop = catchAsync(async (req, res) => {
  const response = await userRouteService.addRouteStop(req);
  res.status(httpStatus.OK).send(response);
});

const routeDetailsById = catchAsync(async (req, res) => {
  const response = await userRouteService.routeDetailsById(req.query.route_id);
  res.status(httpStatus.OK).send({ response });
});
const getAllUsers = catchAsync(async (req, res) => {
  const response = await userRouteService.getAllUsers(req);
  res.status(httpStatus.OK).send({ response });
});

const getStopsByRouteId = catchAsync(async (req, res) => {
  const response = await userRouteService.getStopsByRouteId(req);
  res.status(httpStatus.OK).send({ response });
});

const optimizeRoute = catchAsync(async (req, res) => {
  const response = await userRouteService.optimizeRoute(req);
  res.status(httpStatus.OK).send({ response });
});

const updateRouteStatus = catchAsync(async (req, res) => {
  const response = await userRouteService.updateRouteStatus(req);
  res.status(httpStatus.OK).send({ response });
});

const removeStop = catchAsync(async (req, res) => {
  const response = await userRouteService.removeStop(req);
  res.status(httpStatus.OK).send({ response });
});

const deleteRoute = catchAsync(async (req, res) => {
  const response = await userRouteService.deleteRoute(req);
  res.status(httpStatus.OK).send({ response });
});

const updateStopStatus = catchAsync(async (req, res) => {
  const response = await userRouteService.updateStopStatus(req);
  res.status(httpStatus.OK).send({ response });
});

const deleteStop = catchAsync(async (req, res) => {
  const response = await userRouteService.deleteStop(req);
  res.status(httpStatus.OK).send({ response });
});

const checkRouteName = catchAsync(async (req, res) => {
  const response = await userRouteService.checkRouteName(req);
  res.status(httpStatus.OK).send({ response });
});

const homeScreen = catchAsync(async (req, res) => {
  const response = await userRouteService.homeScreen(req);
  res.status(httpStatus.OK).send({ response });
});
const recentRoutes = catchAsync(async (req, res) => {
  const response = await userRouteService.recentRoutes(req);
  res.status(httpStatus.OK).send({ response });
});

const keepUserRoute=catchAsync(async(req,res)=>{
  const response=await userRouteService.keepUserRoute(req)
  res.status(httpStatus.OK).send({response})
})

module.exports = {
  createRoute,
  editRoute,
  userRouteById,
  addRouteStop,
  routeDetailsById,
  getAllUsers,
  getStopsByRouteId,
  updateRouteStatus,
  removeStop,
  deleteRoute,
  updateStopStatus,
  deleteStop,
  checkRouteName,
  homeScreen,
  recentRoutes,
  optimizeRoute,
  keepUserRoute
};
