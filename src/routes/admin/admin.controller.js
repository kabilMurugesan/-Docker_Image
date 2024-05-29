const httpStatus = require("http-status");
const ApiError = require("../../utils/ApiError");
const catchAsync = require("../../utils/catchAsync");
const adminService = require("./admin.service")
const tokenService = require("../../services/token.service");


const adminLogin = catchAsync(async (req, res) => {
    const {
        email,
        password
    } = req.body;
    const user = await adminService.adminLogin(
        email,
        password
    );
    if (user.message === "Incorrect Email" || user.message === "Incorrect Password") {
        res.status(httpStatus.OK).send( user )
    } else {
        const tokens = await tokenService.generateAdminAuthTokens(user);
        res
            .status(httpStatus.OK)
            .send({ message: "Logging in successfully", user, tokens });
    }
});


const adminRefreshTokens = catchAsync(async (req, res) => {
    const tokens = await adminService.adminRefreshAuth(req.body.refreshToken);
    res.status(httpStatus.OK).send({ ...tokens });
});

const adminLogOut = catchAsync(async (req, res) => {
    const response = await adminService.adminLogOut(req.body.refreshToken);
    res.status(httpStatus.OK).send({ response });
});

const userDetails = catchAsync(async (req, res) => {
    const response = await adminService.userDetails(req.query.user_id);
    res.status(httpStatus.OK).send({ response });
});

const routeDetailsById = catchAsync(async (req, res) => {
    const response = await adminService.routeDetailsById(req.query.route_id);
    res.status(httpStatus.OK).send({ response });
});


const userRouteDetails = catchAsync(async (req, res) => {
    const response = await adminService.userRouteDetails(req)
    res.status(httpStatus.OK).send({response})

})

const resetPassword = catchAsync(async (req, res) => {
    const response = await adminService.resetPassword(req);
    res.status(httpStatus.OK).send({ response });
  });


module.exports = {
    adminLogin,
    adminLogOut,
    adminRefreshTokens,
    userDetails,
    routeDetailsById,
    userRouteDetails,
    resetPassword
};
