const httpStatus = require("http-status");
const bcrypt = require("bcryptjs");
const Sequelize = require("sequelize");
const crypto = require("crypto");
const { Op } = Sequelize;
const config = require("../../config/config");
const { tokenTypes } = require("../../config/tokens");
const { tokenService } = require("../../services");
const db = require("../../models");
const ApiError = require("../../utils/ApiError");
const { getSignedURL } = require("../../utils/s3");
const User = db.user;
const Token = db.token;
const UserRoute = db.userRoute;
const RouteStops = db.routeStops;
const SharedRoute = db.sharedRoute;
const SharedRoutePermission = db.sharedRoutePermission;
const UserDevice = db.userDevice;
const UserRoutes = db.userRoute;
const paginate = require("../../utils/paginate");
const moment = require("moment");

const { sendOtpEmail } = require("../../services/email.service");
//validating password
const checkPassword = async (actualPassword, payloadPassword) => {
  const isCorrectPassword = await bcrypt.compare(payloadPassword, actualPassword);
  return isCorrectPassword;
};
//admin login
const adminLogin = async (email, password) => {
  if (email === "admin@urlane.com") {
    const user = await User.findOne({
      where: { email: "admin@urlane.com" },
    });
    if (user && !(await checkPassword(user.password, password))) {
      return {
        status: "success",
        message: "Incorrect Password",
      };
    }
    delete user.password;
    return user;
  } else {
    return {
      status: "success",
      message: "Incorrect Email",
    };
  }
};

//Finding user id
const getById = async (id) => {
  const user = await User.findByPk(id);
  if (!user) throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  return user.dataValues;
};
//validating refresh token and generating new admin and auth token
const adminRefreshAuth = async (refreshToken) => {
  try {
    const refreshTokenDoc = await tokenService.verifyToken(refreshToken, tokenTypes.REFRESH);
    const user = await getById(refreshTokenDoc.user_id);
    if (!user) {
      throw new Error();
    }
    if (refreshTokenDoc.token === refreshToken) {
      await Token.destroy({
        where: {
          type: refreshTokenDoc.type,
          user_id: refreshTokenDoc.user_id,
        },
      });
      return tokenService.generateAdminAuthTokens(user);
    }
    throw new Error();
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Refresh Token is Expired");
  }
};

//admin logout and destroying refresh token in db
const adminLogOut = async (refreshToken) => {
  try {
    const refreshTokenDoc = await tokenService.verifyToken(refreshToken, tokenTypes.REFRESH);
    const user = await getById(refreshTokenDoc.user_id);
    if (!user) {
      throw new Error();
    }
    if (refreshTokenDoc.token === refreshToken) {
      let logout = await Token.destroy({
        where: {
          type: refreshTokenDoc.type,
          user_id: refreshTokenDoc.user_id,
        },
        truncate: false,
      });
      if (logout == 1) {
        return { status: "success", message: "user logged out successfully" };
      }
    }
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Please authenticate" + error);
  }
};

//getting user details by passing user id
const userDetails = async (user_id) => {
  let image_Url = "";
  picture = await User.findOne({
    where: { user_id: user_id },
  });

  if (picture && picture.profile_pic != "") {
    image_Url = await getSignedURL(picture.profile_pic, "GET"); //getting profile pic for an user
  } else {
    image_Url = "";
  }
  const userDetail = await User.findOne({
    where: {
      user_id: {
        [Op.eq]: `${user_id}`,
      },
    },
    attributes: ["user_id", "first_name", "last_name", "phone_number", "email", "createdAt", "updatedAt"],

    include: [
      {
        model: UserDevice,
        as: "user_devices",
        where: { user_id: { [Op.eq]: `${user_id}` } },
      },
    ],
    order: [[UserDevice, "last_login", "DESC"]],
  });
  if (!userDetail || userDetail == "") {
    throw new ApiError(httpStatus.BAD_REQUEST, "No Record Found");
  }
  return {
    userDetail: userDetail,
    image_Url,
  };
};
//getting particular route details
const routeDetailsById = async (route_id) => {
  let userRouteDetails = {};
  const userRoute = await UserRoute.findOne({
    where: { route_id: { [Op.eq]: `${route_id}` } },
    attributes: [
      "route_id",
      "route_name",
      "start_latitude",
      "start_longitude",
      "start_address",
      "end_latitude",
      "end_longitude",
      "end_address",
      "distance",
      "start_date",
      "started_date",
      // "start_time",
      "distance",
      "started_date",
      "end_date",
      //"route_status",
      "created_by",
      "updated_by",
      [
        Sequelize.literal(
          'CASE WHEN route_status = 1 THEN "Not Started" WHEN route_status = 2 THEN "In Progress" WHEN route_status = 2 THEN "Completed" WHEN route_status = 0 THEN "Deleted" END'
        ),
        "route_status",
      ],
    ],
    include: [
      {
        model: RouteStops,
        attributes: [
          "route_stop_id",
          "stop_user_id",
          "latitude",
          "longitude",
          "address",
          "sequence_number",
          "contact_name",
          "phone_number",
          [
            Sequelize.literal(
              'CASE WHEN status = 1 THEN "Not Started" WHEN status = 2  THEN "Completed" WHEN status = 0 THEN "Deleted" END'
            ),
            "status",
          ],
        ],
        where: { status: { [Op.ne]: 0 } },
        as: "route_stops",
        required: false,
      },
      {
        model: SharedRoute,
        attributes: ["user_id"],
        where: { parent_route_id: route_id, route_status: { [Op.ne]: 0 } },
        required: false,
        include: [
          {
            model: User,
            attributes: ["first_name", "last_name", "phone_number"],
            required: false,
          },
        ],
      },
      {
        model: SharedRoutePermission,
        where: { route_id: route_id },
        required: false,
      },
    ],
  });
  if (!userRoute || userRoute == "") {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid RouteId");
  }
  userRouteDetails.route_id = userRoute.route_id;
  userRouteDetails.route_name = userRoute.route_name;
  userRouteDetails.start_latitude = userRoute.start_latitude;
  userRouteDetails.start_longitude = userRoute.start_longitude;
  userRouteDetails.start_address = userRoute.start_address;
  userRouteDetails.end_latitude = userRoute.end_latitude;
  userRouteDetails.end_longitude = userRoute.end_longitude;
  userRouteDetails.end_address = userRoute.end_address;
  userRouteDetails.distance = userRoute.distance;
  userRouteDetails.start_date = userRoute.start_date;
  userRouteDetails.started_date = userRoute.started_date;
  userRouteDetails.end_date = userRoute.end_date;
  userRouteDetails.route_id = userRoute.route_id;
  userRouteDetails.route_status = userRoute.route_status;
  userRouteDetails.created_by = userRoute.created_by;
  userRouteDetails.updated_by = userRoute.updated_by;
  userRouteDetails.shared_route_permissions = userRoute.shared_route_permissions[0];
  userRouteDetails.shared_routes = [];
  userRouteDetails.route_stops = userRoute.route_stops;

  if (userRoute.shared_routes && userRoute.shared_routes != "") {
    userRoute.shared_routes.forEach((share) => {
      if (share.to_user_id != "" && share.user) {
        let user = {};
        user.user_id = share.user_id;
        user.phone_number = share.user.phone_number;
        user.full_name = share.user.first_name + " " + share.user.last_name;
        userRouteDetails.shared_routes.push(user);
      }
    });
  }
  return {
    route_details: userRouteDetails,
  };
};

//getting user details for admin page
const userRouteDetails = async (req) => {
  const user = await User.findOne({
    attributes: ["user_id", "first_name", "last_name"],
    where: { user_id: req.query.user_id },
  });
  if (!user || user == "") {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid UserId");
  }
  let conditions = { created_by: req.query.user_id };
  conditions.route_status = { [Op.ne]: 0 };
  if (req.query) {
    conditions.created_by = req.query.user_id;
    if (req.query.route_status) {
      switch (req.query.route_status) {
        case "Not Started":
          conditions.route_status = 1;
          break;
        case "Inprogress":
          conditions.route_status = 2;
          break;
        case "Completed":
          conditions.route_status = 3;
          break;
        case "Deleted":
          conditions.route_status = 0;
          break;
      }
    }
    if (req.query.name) {
      conditions.route_name = { [Op.like]: `%${req.query.name}%` };
    }
  }
  let search = {
    where: conditions,
    attributes: [
      "route_id",
      "route_name",
      "start_latitude",
      "start_longitude",
      "start_address",
      "end_latitude",
      "end_longitude",
      "end_address",
      "distance",
      "start_date",
      "started_date",
      // "start_time",
      "started_date",
      "end_date",
      "route_status",
      "created_by",
      "updated_by",
      [
        Sequelize.literal(
          'CASE WHEN route_status = 1 THEN "Not Started" WHEN route_status = 2 THEN "In-Progress" WHEN route_status = 3 THEN "Completed" WHEN route_status = 0 THEN "Deleted" END'
        ),
        "route_status",
      ],
      [Sequelize.literal('case when distance is not null then (truncate(distance ,3)) else " "  end'), `distance`],
    ],
  };
  const userRoutedetails = await paginate(UserRoutes, req.query, search);
  return {
    status: "success",
    user,
    userRoutedetails,
  };
};
//resetting admin password
const resetPassword = async (req) => {
  let user = "";
  if (req.body.email === "admin@urlane.com") {
    user = await User.findOne({
      where: { email: { [Op.eq]: `${req.body.email}` } },
    });
  }
  if (!user) throw new ApiError(httpStatus.UNAUTHORIZED, "Incorrect email");
  if (req.body.newPassword !== req.body.confirmNewPassword) {
    throw new ApiError(httpStatus.BAD_REQUEST, "New password and confirm password does not match");
  }
  const passwordCheck = await bcrypt.compare(req.body.newPassword, user.password);
  if (passwordCheck) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Old password and New Password cannot be same");
  }
  await user.update({ password: req.body.newPassword });
  return {
    status: "success",
    message: "Password has been reset successfully",
  };
};
module.exports = {
  adminLogin,
  adminLogOut,
  adminRefreshAuth,
  userDetails,
  routeDetailsById,
  userRouteDetails,
  resetPassword,
};
