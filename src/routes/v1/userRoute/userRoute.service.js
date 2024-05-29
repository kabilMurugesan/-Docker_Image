const httpStatus = require("http-status");
const Sequelize = require("sequelize");
const config = require("../../../config/config");
const moment = require("moment");
const { Op } = Sequelize;
const db = require("../../../models");
const User = db.user;
const UserRoute = db.userRoute;
const RouteStops = db.routeStops;
const UserRouteLog = db.userRoutesLog;
const RouteStopsLog = db.userRouteStopsLog;
const SharedRoute = db.sharedRoute;
const TempSharedRoute = db.tempSharedRoute;
const SharedRoutePermission = db.sharedRoutePermission;
const UserDevice = db.userDevice;
const UserAddress = db.userAddress;
const userRouteStopsLog = db.userRouteStopsLog;
const Template = db.pushNotificationTemplates;
const sharedService = require("../sharedRoute/sharedRoute.service");
const ApiError = require("../../../utils/ApiError");
const { sequelize, user, userAddress } = require("../../../models");
const { now } = require("moment");
const distanceService = require("../../../services/map.service");
const userService = require("../user/user.service");
const { sendPushNotification } = require("../../../services/push_notification.service");
const { date } = require("joi");
const { createInvitees, shareInvitees } = require("../invitees/invitees.service");

const createRoute = async (req) => {
  // const transaction = await sequelize.transaction(); // start a transaction
  try {
    // await checkRouteName(req)
    let route = {};
    //future use
    // let optimizedDist = await distanceService.calcDistance(req.body, req.body.route_stops);
    // if(!optimizedDist.distance && optimizedDist.distance === undefined){
    //   throw new ApiError(
    //     httpStatus.INTERNAL_SERVER_ERROR,
    //     "One or more address is invalid"
    //   );
    // }
    //checking the user is active or not
    await userService.checkActiveUser(req.body.user_id);
    const userRoute = {
      route_name: req.body.route_name,
      start_latitude: req.body.start_latitude,
      start_longitude: req.body.start_longitude,
      start_address: req.body.start_address,
      end_latitude: req.body.end_latitude,
      end_longitude: req.body.end_longitude,
      end_address: req.body.end_address,
      start_date: req.body.start_date ? req.body.start_date : null,
      expires_on: req.body.start_date
        ? moment(new Date(req.body.start_date)).utc().add(config.setexpirydate, "days").format("YYYY-MM-DD HH:mm:ss")
        : moment(new Date()).utc().add(config.setexpirydate, "days").format("YYYY-MM-DD HH:mm:ss"),
      // start_time: req.body.start_time,
      end_time: req.body.end_time,
      // distance: distance,
      created_by: req.body.user_id,
      updated_by: req.body.user_id,
      route_status: 1,
      route_started_count: 0,
    };
    //creating a new user route
    route.route_details = await UserRoute.create(userRoute);
    if (route.route_details) {
      if (req.body.route_stops && req.body.route_stops != "") {
        let placeId = "";
        for (const item of req.body.route_stops) {
          // req.body.route_stops.forEach(async (item,i) => {
          let latitude = item.latitude;
          let longitude = item.longitude;

          if (item.latitude !== undefined && item.latitude !== "" && item.longitude !== undefined && item.longitude !== "") {
            placeId = await distanceService.getPlaceIdFromLatLong(item.latitude, item.longitude);
          }
          else if (item.address && item.address != "") {
            placeId = await distanceService.getPlaceId(item.address)
          }
          if (!latitude || !longitude) {
            const location = await distanceService.getLatLong(item.address);
            if (!location || location == "" || location == null || location.isOperational == true) {
              // await transaction.rollback();
              throw new ApiError(httpStatus.BAD_REQUEST, "Invalid Address");
            }
            latitude = location.length > 0 && location[0].latitude ? location[0].latitude : "";
            longitude = location.length > 0 && location[0].longitude ? location[0].longitude : "";
          }
          //creating stops in route stops database
          let routeStops = await RouteStops.create({
            latitude: latitude,
            longitude: longitude,
            address: item.address,
            sequence_number: item.sequence_number,
            stop_user_id: item.stop_user_id ? item.stop_user_id : null,
            contact_name: item.contact_name ? item.contact_name : null,
            phone_number: item.phone_number ? item.phone_number : null,
            route_id: route.route_details.route_id,
            status: 1,
            created_by: req.body.user_id,
            updated_by: req.body.user_id,
            placeId: placeId
          });
          if (!routeStops) {
            throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Something went wrong");
          }
        }
        // )
      }
      // await transaction.commit();
      // await SharedRoutePermission.create({
      //   allow_edit: (req.body.share_permissions && req.body.share_permissions.allow_edit) ? req.body.share_permissions.allow_edit : false,
      //   allow_share: (req.body.share_permissions && req.body.share_permissions.allow_share) ? req.body.share_permissions.allow_share : false,
      //   share_indefinitely: (req.body.share_permissions && req.body.share_permissions.share_indefinitely) ? req.body.share_permissions.share_indefinitely : false,
      //   share_endofday: (req.body.share_permissions && req.body.share_permissions.share_endofday) ? req.body.share_permissions.share_endofday : false,
      //   share_onehour: (req.body.share_permissions && req.body.share_permissions.share_onehour) ? req.body.share_permissions.share_onehour : false,
      //   route_id: route.route_details.route_id,
      //   user_id: req.body.user_id,
      // });
    } else {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Something went wrong");
    }
    // if (req.body.shared_routes) {
    //   const sharedRoute = await sharedService.createSharedRoute(req, route.route_details.route_id);
    //   if (sharedRoute.status != 'success') {
    //     throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Something went wrong");
    //   }
    // }
    return {
      status: "success",
      message: "Route created successfully",
    };
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
  }
};

const editRoute = async (req) => {
  try {
    let route = {};
    route.route_details = await UserRoute.findOne({
      where: {
        route_id: req.body.route_id,
      },
    });
    let existinguser = []; //getting existing user
    let nonexistinguser = []; //getting non existing user phonenumber
    let nonexistinguserdetails = []; //getting non existing userdetails
    let ph_number = []; //storing phone number
    let details = []; //incoming request
    if (req.body.shared_routes && req.body.shared_routes.length > 0) {
      //  if(req.body.start_date==null||!req.body.start_date){
      //      throw new ApiError(httpStatus.BAD_REQUEST,"start Date is required");
      //  }
      //  await Promise.all(req.body.shared_routes.map(async (route) => {

      await Promise.all(
        //mapping the incoming request
        req.body.shared_routes.map(async (shared_route) => {
          //checking phone number
          const phNoCheck = await User.findOne({
            where: {
              phone_number: shared_route.phone_number,
              is_email_verified: 1,
              is_active: 1,
            },
          });
          if (phNoCheck) {
            existinguser.push(phNoCheck.user_id);
            ph_number.push(phNoCheck.phone_number);
            details.push(phNoCheck);
          } else {
            nonexistinguser.push(shared_route);
            nonexistinguserdetails.push(shared_route);
            ph_number.push(shared_route.phone_number);
            details.push(shared_route);
          }
        })
      );
      //non existing user means sending invite through number and email
      await shareInvitees(req, nonexistinguser);
      for (const item of existinguser) {
        const user = await userService.checkActiveUser(item);
        if (user != true) {
          throw new ApiError(httpStatus.BAD_REQUEST, "Invalid userId");
        }
      }
      //  }}
    }
    if (route.route_details) {
      // await checkRouteName(req)
      // let optimizedDist = await distanceService.calcDistance(req.body, req.body.route_stops);
      // if (!optimizedDist.distance && optimizedDist.distance === undefined) {
      //   throw new ApiError(
      //     httpStatus.INTERNAL_SERVER_ERROR,
      //     "One or more address is invalid"
      //   );
      // }
      //updating user route
      const userUpdatedRoute = {
        route_name: req.body.route_name,
        start_latitude: req.body.start_latitude,
        start_longitude: req.body.start_longitude,
        start_address: req.body.start_address,
        end_latitude: req.body.end_latitude,
        end_longitude: req.body.end_longitude,
        end_address: req.body.end_address,
        // distance: optimizedDist.distance,
        start_date: req.body.start_date ? req.body.start_date : null,
        // start_time : req.body.start_time,
        updated_by: req.body.user_id,
      };
      if (req.body.start_date) {
        userUpdatedRoute.expires_on = moment(req.body.start_date)
          .add(config.setexpirydate, "days")
          .format("YYYY-MM-DD HH:mm:ss");
      }

      await UserRoute.update(userUpdatedRoute, {
        where: {
          route_id: req.body.route_id,
        },
      });
      const { count } = await RouteStops.findAndCountAll({
        where: {
          route_id: {
            [Op.eq]: req.body.route_id,
          },
          status: {
            [Op.eq]: "1",
          },
        },
      });
      //deleting route stops and storing it in db
      await RouteStops.destroy({
        where: {
          route_id: {
            [Op.eq]: req.body.route_id,
          },
        },
        truncate: false,
      });
      let items = false;
      // req.body.route_stops.forEach(async (item,i) => {
      for (const item of req.body.route_stops) {
        let placeId = "";
        let latitude = item.latitude;
        let longitude = item.longitude;
        if (item.latitude !== undefined && item.latitude !== "" && item.longitude !== undefined && item.longitude !== "") {
          placeId = await distanceService.getPlaceIdFromLatLong(item.latitude, item.longitude);
        }
        else if (item.address && item.address != "") {
          placeId = await distanceService.getPlaceId(item.address)
        }
        if (!latitude || !longitude) {
          const location = await distanceService.getLatLong(item.address);
          if (!location || location == "" || location == null || location.isOperational == true) {
            throw new ApiError(httpStatus.BAD_REQUEST, "Invalid Address");
          }
          latitude = location.length > 0 && location[0].latitude ? location[0].latitude : "";
          longitude = location.length > 0 && location[0].longitude ? location[0].longitude : "";
        }
        await RouteStops.create({
          latitude: latitude,
          longitude: longitude,
          address: item.address,
          sequence_number: item.sequence_number,
          stop_user_id: item.stop_user_id ? item.stop_user_id : null,
          contact_name: item.contact_name ? item.contact_name : null,
          phone_number: item.phone_number ? item.phone_number : null,
          route_id: req.body.route_id,
          status: 1,
          created_by: req.body.user_id,
          updated_by: req.body.user_id,
          placeId: placeId
        });
      }
      // );
      if (req.body.shared_routes && req.body.shared_routes?.length == 0) {
        const shares = await sequelize.query(
          `select distinct user_id,route_status,shared_route_id from shared_routes where parent_route_id='${req.body.route_id}' and route_id is null and route_status!=0`,
          { type: Sequelize.QueryTypes.SELECT }
        );
        let updatesharedroutes = [];
        if (shares.length > 0) {
          await shares.forEach(async (item) => {
            updatesharedroutes.push(item.shared_route_id);
          });
          await SharedRoute.update(
            {
              route_status: 0,
              updated_by: req.body.user_id,
              updatedAt: now(),
            },
            {
              where: {
                shared_route_id: { [Op.in]: updatesharedroutes },
              },
            }
          );
        }
      }
      if (req.body.shared_routes && req.body.shared_routes?.length > 0) {
        let sharedPermissions = await SharedRoutePermission.findOne({
          where: { route_id: req.body.route_id, user_id: req.body.user_id },
        });
        if (sharedPermissions) {
          await SharedRoutePermission.update(
            {
              allow_edit: req.body.share_permissions.allow_edit ? req.body.share_permissions.allow_edit : false,
              allow_share: req.body.share_permissions.allow_share ? req.body.share_permissions.allow_share : false,
              share_endofday: req.body.share_permissions.share_endofday
                ? req.body.share_permissions.share_endofday
                : false,
              share_onehour: req.body.share_permissions.share_onehour
                ? req.body.share_permissions.share_onehour
                : false,
              share_indefinitely: req.body.share_permissions.share_indefinitely
                ? req.body.share_permissions.share_indefinitely
                : false,
              edit_startdate: req.body.share_permissions.edit_startdate
                ? req.body.share_permissions.edit_startdate
                : false,
            },
            {
              where: {
                route_id: req.body.route_id,
                user_id: req.body.user_id,
              },
            }
          );
        } else {
          await SharedRoutePermission.create({
            allow_edit:
              req.body.share_permissions && req.body.share_permissions.allow_edit
                ? req.body.share_permissions.allow_edit
                : false,
            allow_share:
              req.body.share_permissions && req.body.share_permissions.allow_share
                ? req.body.share_permissions.allow_share
                : false,
            share_indefinitely:
              req.body.share_permissions && req.body.share_permissions.share_indefinitely
                ? req.body.share_permissions.share_indefinitely
                : false,
            share_endofday:
              req.body.share_permissions && req.body.share_permissions.share_endofday
                ? req.body.share_permissions.share_endofday
                : false,
            share_onehour:
              req.body.share_permissions && req.body.share_permissions.share_onehour
                ? req.body.share_permissions.share_onehour
                : false,
            edit_startdate: req.body.share_permissions.edit_startdate
              ? req.body.share_permissions.edit_startdate
              : false,
            route_id: route.route_details.route_id,
            user_id: req.body.user_id,
          });
        }
        if (req.body.shared_routes) {
          const sharedRoute = await sharedService.createSharedRoute(
            req,
            req.body.route_id,
            existinguser,
            nonexistinguser,
            nonexistinguserdetails,
            ph_number,
            details
          );
        }
      }
    } else {
      throw new ApiError(httpStatus.NOT_FOUND, "RouteId does not exsit");
    }
    return {
      status: "success",
      message: "Route updated successfully",
    };
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
  }
};

const userRouteById = async (req) => {
  const date = moment().utc().subtract(config.routeexpiration, "days").format("YYYY-MM-DD 00:00:00");
  conditions = {};
  if (req.query.route_status && req.body.route_status != "") {
    switch (req.query.route_status) {
      case "Inprogress":
        conditions = {
          route_status: 2,
          created_by: req.query.user_id,
        };
        break;
      case "Upcoming":
        conditions = {
          end_date: {
            [Op.or]: {
              [Op.gte]: `${date}`,
              [Op.eq]: null,
            },
          },
          created_by: req.query.user_id,
          route_status: 1,
        };
        break;
      case "Completed":
        conditions = {
          end_date: {
            [Op.and]: {
              [Op.lte]: `${date}`,
              [Op.ne]: null,
            },
          },
          created_by: req.query.user_id,
          route_status: { [Op.ne]: 0 },
          started_date: { [Op.ne]: null },
        };
        break;
    }
  }
  if (req.query.route_name) {
    conditions.route_name = {
      [Op.like]: `%${req.query.route_name}%`,
    };
  }

  let sharedResults = [];
  let sharedFrom = [];
  let alluserRoute = [];
  if (req.query.route_status === "Inprogress") {
    const sharedroute = await SharedRoute.findAll({
      attributes: ["route_name", "distance", "route_id", "parent_route_id"],
      where: conditions,
      group: ["route_name", "distance", "route_id", "parent_route_id"],
    });

    await sharedroute.forEach(async (item) => {
      let details = {};
      details.route_name = item.route_name;
      details.distance = item.distance;
      details.parent_route_id = item.parent_route_id;
      details.route_id = item.route_id;

      const userDetails = await SharedRoute.findAll({
        attributes: ["shared_route_id"],
        include: [
          {
            model: User,
            attributes: ["user_id", "first_name", "last_name"],
            required: false,
          },
        ],
        where: { parent_route_id: item.parent_route_id, route_id: item.route_id, route_status: 2 },
      });
      details.users = [];
      await userDetails.forEach(async (u) => {
        let userDetails = {};
        userDetails.shared_route_id = u.shared_route_id;
        userDetails.user_id = u.user.user_id;
        userDetails.user_name = u.user.first_name + " " + u.user.last_name;
        details.users.push(userDetails);
      });
      await sharedResults.push(details);
    });

    let sharedfromroutes = await sharedService.sharedRoutesByToUserId(
      req.query.user_id,
      "Inprogress",
      req.query.route_name
    );
    await sharedFrom.push(sharedfromroutes.sharedTo);
  }

  if (req.query.route_status != "Inprogress") {
    userRoute = await UserRoute.findAll({
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
        "distance",
        "started_date",
        "end_date",
        //"route_status",
        "created_by",
        "updated_by",
        [
          Sequelize.literal(
            'CASE WHEN route_status = 1 THEN "Not Started" WHEN route_status = 2 THEN "In-Progress" WHEN route_status = 3 THEN "Completed" WHEN route_status = 0 THEN "Deleted" END'
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
          include: [
            {
              model: User,
              attributes: ["first_name", "last_name", "phone_number"],
              required: false,
            },
          ],
        },
      ],
    });
    alluserRoute = [...userRoute];
  }

  if (req.query.route_status != "Completed") {
    let whereConditions = {
      route_status: 2,
      created_by: req.query.user_id,
    };
    if (req.query.route_name) {
      whereConditions.route_name = {
        [Op.like]: `%${req.query.route_name}%`,
      };
    }
    userInprogressRoute = await UserRouteLog.findOne({
      attributes: [
        "user_route_log_id",
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
        "distance",
        "started_date",
        "end_date",
        "created_by",
        "updated_by",
        [
          Sequelize.literal(
            'CASE WHEN route_status = 1 THEN "Not Started" WHEN route_status = 2 THEN "In-Progress" WHEN route_status = 3 THEN "Completed" WHEN route_status = 0 THEN "Deleted" END'
          ),
          "route_status",
        ],
      ],
      where: whereConditions,
      include: [
        {
          model: RouteStopsLog,
          attributes: [
            "user_route_log_id",
            "route_stop_id",
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
          required: false,
        },
      ],
    });

    if (userInprogressRoute && userInprogressRoute != "") alluserRoute.push(userInprogressRoute);
  }

  let userRouteDetailsWithShare = [];

  if (alluserRoute && alluserRoute.length > 0) {
    for (const item of alluserRoute) {
      let userRouteDetails = {};
      if (item.route_status == "In-Progress") {
        userRouteDetails.user_route_log_id = item.user_route_log_id;
      }

      userRouteDetails.route_id = item.route_id;
      userRouteDetails.route_name = item.route_name;
      userRouteDetails.start_latitude = item.start_latitude;
      userRouteDetails.start_longitude = item.start_longitude;
      userRouteDetails.start_address = item.start_address;
      userRouteDetails.end_latitude = item.end_latitude;
      userRouteDetails.end_longitude = item.end_longitude;
      userRouteDetails.end_address = item.end_address;
      userRouteDetails.distance = item.distance;
      userRouteDetails.start_date = item.start_date;
      userRouteDetails.started_date = item.started_date;
      userRouteDetails.end_date = item.end_date;
      userRouteDetails.route_id = item.route_id;
      userRouteDetails.route_status = item.route_status;
      userRouteDetails.created_by = item.created_by;
      userRouteDetails.updated_by = item.updated_by;
      userRouteDetails.route_stops = item.route_status == "In-Progress" ? item.user_route_stops_logs : item.route_stops;
      userRouteDetails.share_routes = [];

      userRouteDetails.share_routes = await sequelize.query(
        `select sr.shared_route_id,sr.expires_on,sr.user_id,
    concat(u.first_name," ",u.last_name) as full_name,u.phone_number,
    CASE WHEN sr.route_status = 1 THEN "Not Started" WHEN sr.route_status = 2  THEN "Completed" WHEN sr.route_status = 0 THEN "Deleted" END as status
    from shared_routes sr
    inner join users u on u.user_id=sr.user_id
    where sr.parent_route_id = ${item.route_id} and sr.route_id is null
    and sr.created_by = ${item.created_by}
    and route_status != 0 and u.is_active=1`,
        { type: Sequelize.QueryTypes.SELECT }
      );
      await userRouteDetailsWithShare.push(userRouteDetails);
    }
  }

  if (req.query.route_status === "Inprogress") {
    return {
      user_routes: userRouteDetailsWithShare,
      shared_route: sharedResults,
      shared_from: sharedFrom[0],
    };
  }
  if (!alluserRoute || alluserRoute == "") {
    return {
      status: "Success",
      message: "No Record Found",
    };
  }
  return {
    user_routes: userRouteDetailsWithShare,
  };
};

const addRouteStop = async (req) => {
  try {
    let routestops = {};
    routestops = req.body.route_stops;
    if (routestops.length > 0) {
      routestops.forEach(async (item) => {
        const validation = await RouteStops.findOne({
          where: {
            route_id: {
              [Op.eq]: req.body.route_id,
            },
            latitude: {
              [Op.eq]: item.latitude,
            },
            longitude: {
              [Op.eq]: item.longitude,
            },
            address: {
              [Op.eq]: item.address,
            },
          },
        });
        let userAddress = {};
        userAddress.latitude = item.longitude;
        userAddress.longitude = item.longitude;
        userAddress.address = item.address;
        if (!userAddress.latitude && !userAddress.longitude && !userAddress.address) {
          userAddress = await UserAddress.findOne({ where: { user_id: item.stop_user_id } });
          userAddress.address =
            userAddress.address + " " + userAddress.city + " " + userAddress.state + " " + userAddress.zipcode;
        }
        if (!validation) {
          await RouteStops.create({
            user_name: item.user_name,
            email: item.email,
            phone_number: item.phone_number,
            latitude: item.latitude,
            longitude: item.longitude,
            address: item.address,
            sequence_number: item.sequence_number,
            contact_name: item.contact_name,
            phone_number: item.phone_number,
            stop_user_id: item.stop_user_id,
            route_id: req.body.route_id,
            status: 1,
            created_by: req.body.user_id,
            createdAt: now(),
          });
        }
      });
      await UserRoute.update(
        {
          updatedAt: now(),
          distance: req.body.distance,
        },
        { where: { route_id: req.body.route_id } }
      );
      return { message: "Stops added successfully" };
    } else {
      throw new ApiError(httpStatus.NOT_FOUND, "Route stop empty");
    }
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
  }
};

const routeDetailsById = async (route_id) => {
  // let route_id= req.query.route_id;
  let userRouteDetails = {};
  const checkStatus = await UserRoute.findOne({ attributes: ["route_status"], where: { route_id: route_id } });
  if (!checkStatus || checkStatus == "") {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid RouteId");
  }
  if (checkStatus.dataValues.route_status != 2) {
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
        "expires_on",
        [
          Sequelize.literal(
            'CASE WHEN route_status = 1 THEN "Not Started" WHEN route_status = 2 THEN "In-Progress" WHEN route_status = 3 THEN "Completed" WHEN route_status = 0 THEN "Deleted" END'
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
            "placeId",
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
          where: { parent_route_id: route_id, route_status: { [Op.ne]: 0 }, is_expired: { [Op.ne]: 1 } },
          attributes: [
            "user_id",
            "user_name",
            "phone_number",
            "email",
            [
              Sequelize.literal(
                'CASE WHEN shared_routes.route_status = 1 THEN "Not Started" WHEN shared_routes.route_status = 2 THEN "In-Progress" WHEN shared_routes.route_status = 3 THEN "Completed" END'
              ),
              "route_status",
            ],
            "shared_route_id",
          ],
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
      ], order: [
        [RouteStops, 'sequence_number', 'ASC'], // Sorting by sequence_number in ascending order
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
    userRouteDetails.expires_on = userRoute.expires_on;
    userRouteDetails.expiry_days = "";
    userRouteDetails.shared_route_permissions =
      userRoute.shared_route_permissions.length > 0 ? userRoute.shared_route_permissions[0] : {};
    userRouteDetails.shared_routes = [];
    userRouteDetails.route_stops = userRoute.route_stops;
    userRouteDetails.enable_keep_route = false;
    // Enable Keep route option
    const currentDate = moment().utc().startOf("day");
    const expiry = moment.utc(userRoute.expires_on, "YYYY-MM-DD").startOf("day");
    const datediff = expiry.diff(currentDate, "days");
    if (datediff >= 0 && datediff <= 2) {
      userRouteDetails.expiry_days = datediff;
      userRouteDetails.enable_keep_route = true;
    }
    if (userRoute.shared_routes && userRoute.shared_routes != "") {
      userRoute.shared_routes.forEach((share) => {
        if (share.to_user_id != "" && share.user) {
          let user = {};
          user.shared_route_id = share.shared_route_id;
          user.user_id = share.user_id;
          user.route_status = share?.route_status;
          user.phone_number = share.user.phone_number;
          user.full_name = share.user.first_name + " " + share.user.last_name;
          userRouteDetails.shared_routes.push(user);
        } else {
          let user = {};
          user.shared_route_id = share.shared_route_id;
          user.route_status = share?.route_status;
          user.phone_number = share.phone_number;
          user.full_name = share.user_name;
          userRouteDetails.shared_routes.push(user);
        }
      });
    }
    let userRouteDetail = Object.assign({}, userRoute.toJSON(), userRouteDetails);
    return {
      route_details: userRouteDetail,
    };
  } else {
    return await inprogressUserRouteDetails(route_id);
  }
};

const getAllUsers = async (req) => {
  const deviceDetails = await UserDevice.findAll({
    include: [
      {
        model: User,
        as: "users",
        attributes: ["user_id", "first_name", "last_name", "email", "phone_number"],
      },
      {
        model: UserRoute,
        required: false,
        order: [["createdAt", "ASC"]],
        attributes: ["route_id", "createdAt"],
        limit: 1,
      },
    ],
  });
  if (!deviceDetails || deviceDetails == "") {
    throw new ApiError(httpStatus.BAD_REQUEST, "No Record Found");
  }
  return {
    users: deviceDetails,
  };
};

const getStopsByRouteId = async (req) => {
  const routeStops = await RouteStops.findAll({
    where: { route_id: { [Op.eq]: `${req.query.route_id}` } },
  });
  if (routeStops == "") {
    throw new ApiError(httpStatus.BAD_REQUEST, "No Record Found");
  }
  return {
    message: "Stops Fetched Successfully",
    stops: routeStops,
  };
};

const updateRouteStatus = async (req) => {
  const {
    route_id,
    user_id,
    is_optimize,
    route_status,
    start_latitude,
    start_longitude,
    end_latitude,
    end_longitude,
    route_stops,
    user_route_log_id,
    isRoundTrip
  } = req.body;
  const userRoute = await UserRoute.findOne({
    where: { route_id, created_by: user_id },
  });
  if (!userRoute) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid RouteId");
  }
  if (route_status == "Started") {
    if (userRoute.route_status == 0) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Route deleted.");
    }
    if (userRoute.route_status == 2) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Route already in-progress.");
    }
    const activeRoutes = await checkActiveRoutes(user_id);
    if (activeRoutes) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Route cannot be started. Another route in-progress");
    }
    const { distance } = await distanceService.calcDistance(req.body, route_stops, is_optimize);
    await RouteStops.destroy({
      where: {
        route_id,
      },
      truncate: false,
    });
    const promises = route_stops.map(async (stop) => {
      delete stop.route_stop_id;
      delete stop.user_id;
      let placeId = "";
      if (stop.latitude !== undefined && stop.latitude !== "" && stop.longitude !== undefined && stop.longitude !== "") {
        placeId = await distanceService.getPlaceIdFromLatLong(stop.latitude, stop.longitude);
      }
      else if (stop.address && stop.address != "") {
        placeId = await distanceService.getPlaceId(stop.address)
      }
      await RouteStops.create({
        ...stop,
        route_id,
        status: 1,
        created_by: user_id,
        updated_by: user_id,
        placeId: placeId
      });
    });
    await Promise.all(promises);
    let startPlaceId = "";
    let endPlaceId = ""
    if (start_latitude !== undefined && start_longitude !== "" && end_latitude !== undefined && end_longitude !== "") {
      startPlaceId = await distanceService.getPlaceIdFromLatLong(start_latitude, start_longitude);
      endPlaceId = await distanceService.getPlaceIdFromLatLong(end_latitude, end_longitude);
    }
    const updateRoute = await UserRoute.update(
      {
        route_status: 2,
        start_latitude,
        start_longitude,
        end_latitude,
        end_longitude,
        is_optimize: is_optimize ? 1 : 0,
        distance,
        route_started_count: userRoute.route_started_count + 1,
        start_place_id: startPlaceId,
        end_place_id: endPlaceId,
        updatedAt: now(),
        updated_by: user_id,
        isRoundTrip: isRoundTrip
      },
      {
        where: {
          route_id,
        },
      }
    );
    if (updateRoute[0] == 1) {
      const routeLog = await sequelize.query(
        `INSERT INTO user_route_logs (route_id, start_date, started_date, start_latitude, start_longitude, end_latitude, end_longitude, route_name, start_address, end_address, distance, route_status, expires_on,created_by, updated_by, createdAt, updatedAt,start_place_id,end_place_id,isRoundTrip) 
  (select route_id, start_date, now(), start_latitude, start_longitude, end_latitude, end_longitude, route_name, start_address, end_address, distance, route_status, expires_on,created_by, updated_by,now(),now(),start_place_id,end_place_id,isRoundTrip from user_routes where route_id='${req.body.route_id}')`
      );
      await sequelize.query(
        `INSERT INTO user_route_stops_logs (user_route_log_id,route_stop_id,user_route_id,latitude,longitude,address,sequence_number,contact_name,phone_number,status,created_by,updated_by, createdAt, updatedAt,placeId)  
  (select '${routeLog[0]}',route_stop_id,route_id,latitude,longitude,address,sequence_number,contact_name,phone_number,status,created_by,updated_by,now(),now(),placeId from route_stops where route_id=${req.body.route_id} and status!=0)`
      );
    }
    const routeDetails = await routeDetailsById(req.body.route_id);
    return {
      routeDetails: routeDetails.route_details,
    };
  }

  if (route_status == "Completed") {
    if (!user_route_log_id) {
      throw new ApiError(httpStatus.BAD_REQUEST, "user_route_log_id is required.");
    }
    const routeLogs = await UserRouteLog.findOne({
      where: {
        route_id,
        user_route_log_id,
        route_status: 2,
      },
    });
    if (!routeLogs) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Invalid user_route_log_id");
    }
    await UserRoute.update(
      {
        route_status: 1,
        started_date: routeLogs.started_date,
        end_date: now(),
        updatedAt: now(),
        updated_by: user_id,
        isRoundTrip: false
      },
      {
        where: {
          route_id,
        },
      }
    );
    await UserRouteLog.update(
      {
        route_status: 3,
        end_date: now(),
        updatedAt: now(),
        updated_by: user_id,
        isRoundTrip: false
      },
      {
        where: {
          route_id,
          user_route_log_id,
        },
      }
    );
  }
  return {
    status: "success",
    message: "Route updated successfully",
  };
};
//optimizing the route before starting the route
const optimizeRoute = async (req) => {
  const { shared_route_id, route_id, user_id } = req.body;
  //optimizing the shared route before starting the route
  if (shared_route_id) {
    return await sharedService.optimizeRoute(req);
  }
  const userRoute = await UserRoute.findOne({
    where: { route_id, created_by: user_id },
  });
  if (!userRoute) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid RouteId");
  }
  if (userRoute.route_status === 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Route deleted.");
  }
  if (userRoute.route_status === 2) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Route already in-progress.");
  }
  const allStops = await RouteStops.findAll({ where: { route_id, created_by: user_id, status: { [Op.ne]: 0 } } });
  if (!allStops) {
    throw new ApiError(httpStatus.BAD_REQUEST, "No stops found to optimize");
  }
  const is_optimze = req.body.is_optimize
  const { stops: optimizedStops } = await distanceService.calcDistance(req.body, allStops, is_optimze);
  for (let i = 0; i < optimizedStops.length; i++) {
    delete optimizedStops[i].dataValues.route_id;
    delete optimizedStops[i].dataValues.status;
    delete optimizedStops[i].dataValues.created_by;
    delete optimizedStops[i].dataValues.updated_by;
    delete optimizedStops[i].dataValues.createdAt;
    delete optimizedStops[i].dataValues.updatedAt;
    optimizedStops[i].sequence_number = i + 1;
  }
  return {
    status: "success",
    message: "Route optimized successfully",
    optimizedStops,
  };
};
const removeStop = async (req) => {
  const stops = await RouteStops.findAll({
    attributes: ["route_stop_id", "status"],
    where: {
      route_stop_id: req.body.route_stop_id,
      route_id: req.body.user_route_id,
      status: { [Op.ne]: 0 },
    },
  });
  if (stops == "" || !stops) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid RouteId or StopId");
  }

  const stopUpdate = await RouteStops.update(
    {
      status: 0,
      updatedAt: now(),
      updated_by: req.body.updated_by,
    },
    {
      where: {
        route_stop_id: req.body.route_stop_id,
      },
    }
  );
  // const stopsDistance = await RouteStops.findAll({
  //   where: {
  //     route_id: req.body.user_route_id,
  //     status: { [Op.ne]: 0 }
  //   },
  // });
  const userRoute = await UserRoute.findOne({
    where: { route_id: req.body.user_route_id },
  });
  // let distance = await distanceService.calcDistance(userRoute, stopsDistance);
  await UserRoute.update(
    {
      updatedAt: now(),
      updated_by: userRoute.created_by,
      // distance: distance
    },
    {
      where: {
        route_id: req.body.user_route_id,
      },
    }
  );

  if (!stopUpdate) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Stops not deleted. Please contact admin.");
  }
  return {
    status: "Success",
    message: "Stop Has Been Removed From Route Sucessfully",
  };
};

// const updateStopStatus = async (req) => {
//   const routeStops = await RouteStops.findOne({
//     where: {
//       route_id: { [Op.eq]: `${req.body.route_id}` },
//       route_stop_id: req.body.route_stop_id
//     },
//   });
//   if (!routeStops || routeStops == "") {
//     throw new ApiError(httpStatus.BAD_REQUEST, "Incorrect RouteId and RouteStopId");
//   }
//   update = {};
//   if (req.body.stop_status && req.body.stop_status != "") {
//     switch (req.body.stop_status) {
//       case "Inprogress":
//         update.stop_status = 1;
//         break;
//       case "Reached":
//         update.stop_status = 2;
//         break;
//       case "Deleted":
//         update.stop_status = 0;
//         break;
//     }
//   }
//   await RouteStops.update(
//     {
//       status: update.stop_status,
//       updated_by: req.body.user_id,
//       updatedAt: now(),
//     },
//     {
//       where: {
//         route_stop_id: req.body.route_stop_id,
//       },
//     }
//   );
//   return {
//     status: "success",
//     message: "Stop updated successfully",
//   };
// };
//delete user route api
const deleteRoute = async (req) => {
  try {
    const route = req.body.user_route;
    var length1 = route.length;
    const userroutes = await UserRoute.findAll({
      where: { route_id: { [Op.in]: route } },
    });
    const length2 = userroutes.length;
    if (length1 !== length2) {
      return {
        status: "Failed",
        message: "One or More route_id is Invalid",
      };
    } else {
      const routestatus = await UserRoute.findAll({
        where: {
          [Op.and]: [{ route_id: { [Op.in]: route } }, { route_status: { [Op.eq]: 2 } }],
        },
      });
      const statuslength = routestatus.length;
      if (statuslength > 0) {
        return {
          status: "Failed",
          message: "Routes Inprogress Cannot Be Deleted",
        };
      } else {
        UserRoute.update(
          {
            route_status: 0,
            updated_by: req.body.user_id,
          },
          { where: { route_id: req.body.user_route } }
        );
        return {
          status: "Success",
          message: "Routes Updated successfully",
        };
      }
    }
  } catch (e) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Route cannot be deleted. Contact Admin. " + e);
  }
};
//checking if there is any active routes for the users
const checkActiveRoutes = async (user_id) => {
  const currenttime = moment(new Date()).format("YYYY-MM-DD 00:00:00");
  const inprogressRoutes = await UserRoute.findAndCountAll({ where: { [Op.or]: [{ expires_on: null }, { expires_on: { [Op.ne]: null }, expires_on: { [Op.gte]: `${currenttime}` } }], created_by: user_id, route_status: 2 } });
  const inprogressSharedRoutes = await SharedRoute.findAndCountAll({ where: { [Op.or]: [{ expires_on: null }, { expires_on: { [Op.ne]: null }, expires_on: { [Op.gte]: `${currenttime}` } }], user_id: user_id, route_status: 2 } });
  if (inprogressRoutes.count >= 1 || inprogressSharedRoutes.count >= 1) {
    return true;
  } else return false;
};

// const deleteStop = async (req) => {

//   const routes = await UserRoute.findOne({ where: {route_id:req.body.user_route_id }});

//   if(!routes) {
//     throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid route_id')
//   }

//   if(routes.dataValues.route_status != 2){
//     return await removeStop(req)
//   } else {
//     if ((!req.body.route_stop_id && route_stop_id == "")) {
//       throw new ApiError(httpStatus.BAD_REQUEST, 'route_id is required')
//     }

//     const routeStopsLog = await userRouteStopsLog.findOne({
//       where: { route_stops_log_id: req.body.route_stop_id, user_route_id: req.body.user_route_id, status: { [Op.ne]: 0 } },
//       order: [["createdAt", "DESC"]],
//       limit: 1,
//     });

//     if (routeStopsLog) {
//       await userRouteStopsLog.update(
//         {
//           status: 0,
//         },
//         {
//           where: {
//             route_stops_log_id: routeStopsLog.dataValues.route_stops_log_id, user_route_id: req.body.user_route_id
//           },
//         }
//       );
//       await RouteStops.update(
//         {
//           status: 0,
//         },
//         {
//           where: {
//             route_stop_id: req.body.route_stop_id, route_id: req.body.user_route_id
//           },
//         }
//       );

//       return {
//         status: "success",
//         message: "Stop updated successfully",
//       };
//     } else {
//       throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid route_stop_id')
//     }
//   }
// };

/**
 * @description Delete stop for inprogress and not started routes
 */
const deleteStop = async (req) => {
  const { user_route_id, route_stop_id, route_stops_log_id } = req.body;

  const userRoute = await UserRoute.findOne({
    where: { route_id: user_route_id },
  });
  if (!userRoute) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid route id");
  }
  //route_status = 1 Not Started ,2 - In-Progress, 3 - Completed, 0 - Deleted
  if (userRoute.route_status === 3) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Route is completed.");
  }
  if (userRoute.route_status === 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Route is deleted.");
  }
  if (userRoute.route_status === 1 || userRoute.route_status === 2) {
    const allStops = await RouteStops.findAll({
      where: {
        route_id: user_route_id,
        status: { [Op.ne]: 0 },
      },
    });
    if (!allStops) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No routes found");
    }
    if (allStops.length === 1) {
      throw new ApiError(httpStatus.BAD_REQUEST, "This route has only one stop, cannot be deleted");
    }
    const userroutestopCheck = await RouteStops.findAll({
      where: { route_id: user_route_id, route_stop_id: route_stop_id },
    });
    if (userRoute.route_status === 1 && !route_stops_log_id) {
      if (
        userroutestopCheck[0].dataValues.sequence_number > 0 &&
        userroutestopCheck[0].dataValues.status != 0 &&
        userroutestopCheck[0].dataValues.status != 2
      ) {
        allStops.forEach(async (element) => {
          if (element.sequence_number > userroutestopCheck[0].dataValues.sequence_number) element.sequence_number -= 1;
        });
      }
      await Promise.all(
        allStops.map(async (route) => {
          await RouteStops.update(
            { sequence_number: route.sequence_number },
            {
              where: {
                route_stop_id: route.route_stop_id,
                route_id: route.route_id,
              },
            }
          );
        })
      );
    }
    await RouteStops.update({ status: 0 }, { where: { route_stop_id: route_stop_id, route_id: user_route_id } });
    // delete stop from user route logs if in progress
    if (userRoute.route_status === 2 && route_stops_log_id) {
      const stopCheck = await userRouteStopsLog.findAll({
        where: { route_stops_log_id: route_stops_log_id, user_route_id: user_route_id, route_stop_id: route_stop_id },
      });
      await userRouteStopsLog.update(
        { status: 0 },
        {
          where: { route_stops_log_id: route_stops_log_id, user_route_id: user_route_id, route_stop_id: route_stop_id },
        }
      );
      // update user route distance if in progress
      const allStops = await RouteStops.findAll({
        where: {
          route_id: user_route_id,
          status: { [Op.ne]: 0 },
        },
      });
      if (
        stopCheck[0].dataValues.sequence_number > 0 &&
        stopCheck[0].dataValues.status != 0 &&
        stopCheck[0].dataValues.status != 2
      ) {
        allStops.forEach(async (element) => {
          if (element.sequence_number > stopCheck[0].dataValues.sequence_number) element.sequence_number -= 1;
        });
      }
      await Promise.all(
        allStops.map(async (route) => {
          await RouteStops.update(
            { sequence_number: route.sequence_number },
            {
              where: {
                route_stop_id: route.route_stop_id,
                route_id: route.route_id,
              },
            }
          );
          await userRouteStopsLog.update(
            { sequence_number: route.sequence_number },
            {
              where: {
                route_stop_id: route.route_stop_id,
                user_route_id: route.route_id,
              },
            }
          );
        })
      );
      const { distance } = await distanceService.calcDistance(userRoute, allStops);
      await UserRoute.update(
        {
          updatedAt: now(),
          updated_by: userRoute.created_by,
          distance,
        },
        {
          where: {
            route_id: user_route_id,
          },
        }
      );
      const routeStopsLog = await userRouteStopsLog.findOne({
        where: { route_stops_log_id: route_stops_log_id },
      });
      //keeping same distance
      await UserRouteLog.update(
        {
          updatedAt: now(),
          updated_by: userRoute.created_by,
          distance,
        },
        {
          where: {
            user_route_log_id: routeStopsLog.user_route_log_id,
          },
        }
      );
    }
    const routeDetails = await routeDetailsById(user_route_id);
    return {
      status: "success",
      message: "Stop deleted successfully",
      ...routeDetails,
    };
  }
};
//getting inprogress route details
const inprogressUserRouteDetails = async (route_id) => {
  let route_details = {};

  const userRoutes = await UserRouteLog.findOne({
    where: {
      route_id: { [Op.eq]: `${route_id}` },
      route_status: 2,
    },
    attributes: [
      "user_route_log_id",
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
      "end_date",
      // "route_status",
      "created_by",
      "updated_by",
      "expires_on",
      "start_place_id",
      "end_place_id",
      "isRoundTrip",
      [
        Sequelize.literal(
          'CASE WHEN route_status = 1 THEN "Not Started" WHEN route_status = 2 THEN "In-Progress" WHEN route_status = 3 THEN "Completed" WHEN route_status = 0 THEN "Deleted" END'
        ),
        "route_status",
      ],
    ],
  });

  const sharedRoute = await SharedRoute.findAll({
    where: { parent_route_id: route_id, route_status: { [Op.ne]: 0 }, is_expired: { [Op.ne]: 1 } },
    attributes: [
      "user_id",
      "user_name",
      "phone_number",
      "email",
      [
        Sequelize.literal(
          'CASE WHEN shared_route.route_status = 1 THEN "Not Started" WHEN shared_route.route_status = 2 THEN "In-Progress" WHEN shared_route.route_status = 3 THEN "Completed" END'
        ),
        "route_status",
      ],
      "shared_route_id",
    ],
    include: [
      {
        model: User,
        attributes: ["first_name", "last_name", "phone_number"],
        required: false,
      },
    ],
  });
  const sharedRoutePermissions = await SharedRoutePermission.findAll({ where: { route_id: route_id } });
  const userRouteStops = await userRouteStopsLog.findAll({
    attributes: [
      "user_route_log_id",
      "route_stops_log_id",
      "route_stop_id",
      "user_route_id",
      "latitude",
      "longitude",
      "address",
      "sequence_number",
      "placeId",
      [
        Sequelize.literal(
          'CASE WHEN status = 1 THEN "Not Started" WHEN status = 2  THEN "Completed" WHEN status = 0 THEN "Deleted" END'
        ),
        "status",
      ],
    ],
    where: { status: { [Op.ne]: 0 }, user_route_log_id: userRoutes.dataValues.user_route_log_id },
    as: "route_stops",
    required: false,
    // order: [["createdAt", "DESC"]],
    order: [
      ['sequence_number', 'ASC'], // Sorting by sequence_number in ascending order
    ],
  });
  function inProgressRouteDetails(item, userRouteStops) {
    if (item.route_status == "In-Progress" && item.isRoundTrip == false) {
      return ({
        route_stops: userRouteStops,
        route_stops_v2: userRouteStops
      })
    }

    if (item.route_status === "In-Progress" && item.isRoundTrip === true) {
      let object = {
        placeId: item.end_place_id,
        latitude: item.end_latitude,
        longitude: item.end_longitude,
        status: "Not Started"
      };
      let route_stops = userRouteStops
      let route_stops_v2 = [...userRouteStops, object]
      return ({
        route_stops,
        route_stops_v2
      })
    }

    return userRouteDetails;
  }

  if (!userRoutes || userRoutes == "") {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid RouteId");
  }
  route_details.user_route_log_id = userRoutes.dataValues.user_route_log_id;
  route_details.route_id = userRoutes.dataValues.route_id;
  route_details.route_name = userRoutes.dataValues.route_name;
  route_details.start_latitude = userRoutes.dataValues.start_latitude;
  route_details.start_longitude = userRoutes.dataValues.start_longitude;
  route_details.start_address = userRoutes.dataValues.start_address;
  route_details.end_latitude = userRoutes.dataValues.end_latitude;
  route_details.end_longitude = userRoutes.dataValues.end_longitude;
  route_details.end_address = userRoutes.dataValues.end_address;
  route_details.distance = userRoutes.dataValues.distance;
  route_details.start_date = userRoutes.dataValues.start_date;
  route_details.started_date = userRoutes.dataValues.started_date;
  route_details.end_date = userRoutes.dataValues.end_date;
  route_details.route_status = userRoutes.dataValues.route_status;
  route_details.created_by = userRoutes.dataValues.created_by;
  route_details.updated_by = userRoutes.dataValues.updated_by;
  route_details.enable_keep_route = false;
  route_details.expires_on = userRoutes.expires_on;
  route_details.shared_routes = [];
  route_details.isRoundTrip = userRoutes.dataValues.isRoundTrip;
  route_details.expiry_days = "";
  let stopDetails = await inProgressRouteDetails(userRoutes.dataValues, userRouteStops)
  route_details.route_stops = stopDetails.route_stops;
  route_details.route_stops_v2 = stopDetails.route_stops_v2;
  route_details.shared_route_permissions = sharedRoutePermissions[0];

  // Keep route option enable from 28days to 30days
  const currentDate = moment().utc().startOf("day");
  const expiry = moment.utc(userRoutes.expires_on, "YYYY-MM-DD").startOf("day");
  const datediff = expiry.diff(currentDate, "days");
  if (datediff >= 0 && datediff <= 2) {
    route_details.expiry_days = datediff;
    route_details.enable_keep_route = true;
  }

  if (sharedRoute && sharedRoute != "") {
    sharedRoute.forEach((share) => {
      if (share.to_user_id != "" && share.user) {
        let user = {};
        user.shared_route_id = share.shared_route_id;
        user.user_id = share.user_id;
        user.phone_number = share.user.phone_number;
        user.full_name = share.user.first_name + " " + share.user.last_name;
        user.route_status = share?.route_status;
        route_details.shared_routes.push(user);
      } else {
        let user = {};
        user.shared_route_id = share.shared_route_id;
        user.route_status = share?.route_status;
        user.phone_number = share.phone_number;
        user.full_name = share.user_name;
        route_details.shared_routes.push(user);
      }
    });
  }
  let userRouteDetail = Object.assign({}, userRoutes.toJSON(), route_details);
  return {
    route_details: userRouteDetail,
  };
};
//updating stop status api
const updateStopStatus = async (req) => {
  const routeStopsLog = await userRouteStopsLog.findAll({
    where: {
      [Op.and]: [
        { route_stops_log_id: { [Op.in]: req.body.route_stops_log_id } },
        { user_route_id: req.body.route_id },
      ],
    },
  });
  if (!routeStopsLog || routeStopsLog == "") {
    throw new ApiError(httpStatus.BAD_REQUEST, "Incorrect route_stops_log_id and route_stop_id");
  }
  let updatestops = [];
  await routeStopsLog.forEach(async (item) => {
    if (item.status == 1) updatestops.push(item.route_stops_log_id);
  });
  update = {};
  if (req.body.stop_status && req.body.stop_status != "") {
    switch (req.body.stop_status) {
      case "Inprogress":
        update.stop_status = 1;
        break;
      case "Reached":
        update.stop_status = 2;
        break;
      case "Deleted":
        update.stop_status = 0;
        break;
    }
  }
  if (updatestops.length > 0) {
    await userRouteStopsLog.update(
      {
        status: update.stop_status,
        updated_by: req.body.user_id,
        updatedAt: now(),
      },
      {
        where: {
          [Op.and]: [{ route_stops_log_id: { [Op.in]: updatestops } }, { user_route_id: req.body.route_id }],
        },
      }
    );
  }
  const route_details = await inprogressUserRouteDetails(req.body.route_id);
  return {
    status: "success",
    message: "Stop updated successfully",
    route_details
  };
};
//checking the route name for the particular user created routes
const checkRouteName = async (req) => {
  const currenttime = moment(new Date()).format("YYYY-MM-DD 00:00:00");
  const routeNameCheck = await UserRoute.findOne({
    where: {
      created_by: req.query.user_id,
      route_name: req.query.route_name,
      route_status: { [Op.ne]: 0 },
      [Op.or]: [{ expires_on: null }, { expires_on: { [Op.ne]: null }, expires_on: { [Op.gte]: `${currenttime}` } }],
    },
  });
  if (!routeNameCheck) {
    return true;
  } else {
    throw new ApiError(httpStatus.BAD_REQUEST, "Route name exists. Rename route");
  }
};
//pagination for the home screen api
const paginateArray = async (array, offset, limit, sortBy, sortType) => {
  const finaloutput = sortBy
    ? array.sort((a, b) => {
      if (a[sortBy] < b[sortBy]) {
        return sortType === "asc" ? -1 : 1;
      }
      if (a[sortBy] > b[sortBy]) {
        return sortType === "asc" ? 1 : -1;
      }
      return 0;
    })
    : array;
  const startIndex = offset * limit;
  const endIndex = startIndex + limit;
  const items = finaloutput.slice(startIndex, endIndex);
  return {
    items,
    currentPage: offset + 1,
    totalPages: Math.ceil(finaloutput.length / limit),
    totalCount: finaloutput.length,
  };
};
//home screen api
const homeScreen = async (req) => {
  const sortBy = req.query.sortBy != null && req.query.sortBy != "" ? req.query.sortBy : "";
  const sortType = req.query.sortType != null && req.query.sortType != "" ? req.query.sortType : "";
  let alluserRoute = [];
  const currenttime = moment(new Date()).format("YYYY-MM-DD 00:00:00");
  conditions = {
    [Op.or]: [{ expires_on: null }, { expires_on: { [Op.ne]: null }, expires_on: { [Op.gte]: `${currenttime}` } }],
    created_by: req.query.user_id,
    route_status: 1,
  };
  if (req.query.route_name) {
    conditions.route_name = {
      [Op.like]: `%${req.query.route_name}%`,
    };
  }
  const userRoutes = await UserRoute.findAll({
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
      "distance",
      "started_date",
      "end_date",
      //"route_status",
      "created_by",
      "updated_by",
      "createdAt",
      "expires_on",
      "isRoundTrip",
      [
        Sequelize.literal(
          'CASE WHEN route_status = 1 THEN "Not Started" WHEN route_status = 2 THEN "In-Progress" WHEN route_status = 3 THEN "Completed" WHEN route_status = 0 THEN "Deleted" END'
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
          "placeId",
          "contact_name",
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
        // include: [
        //   {
        //     model: User,
        //     attributes: ["first_name", "last_name", "phone_number"],
        //     required: false,
        //   },
        // ],
      },
    ],
    order: [
      [RouteStops, 'sequence_number', 'ASC'], // Sorting by sequence_number in ascending order
    ],
  });
  alluserRoute = [...userRoutes];

  let whereConditions = {
    route_status: 2,
    created_by: req.query.user_id,
  };
  if (req.query.route_name) {
    whereConditions.route_name = {
      [Op.like]: `%${req.query.route_name}%`,
    };
  }
  //getting inprogress route details
  let userInprogressRoute = await UserRouteLog.findOne({
    attributes: [
      "user_route_log_id",
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
      "distance",
      "started_date",
      "end_date",
      "created_by",
      "updated_by",
      "expires_on",
      "start_place_id",
      "end_place_id",
      "isRoundTrip",
      [
        Sequelize.literal(
          'CASE WHEN route_status = 1 THEN "Not Started" WHEN route_status = 2 THEN "In-Progress" WHEN route_status = 3 THEN "Completed" WHEN route_status = 0 THEN "Deleted" END'
        ),
        "route_status",
      ],
    ],
    where: whereConditions,
    include: [
      {
        model: RouteStopsLog,
        attributes: [
          "user_route_log_id",
          "route_stops_log_id",
          "route_stop_id",
          "latitude",
          "longitude",
          "address",
          "sequence_number",
          "placeId",
          "contact_name",
          [
            Sequelize.literal(
              'CASE WHEN status = 1 THEN "Not Started" WHEN status = 2  THEN "Completed" WHEN status = 0 THEN "Deleted" END'
            ),
            "status",
          ],
        ],
        where: { status: { [Op.ne]: 0 } },
        required: false,
      },
    ], order: [
      [RouteStopsLog, 'sequence_number', 'ASC'], // Sorting by sequence_number in ascending order
    ],
  });
  if (userInprogressRoute && userInprogressRoute != "") {
    alluserRoute.push(userInprogressRoute);
  }
  let userRouteDetailsWithShare = [];
  //getting shared by other route to the user
  let sharedfromroutes = await sharedService.sharedRoutesByToUserId(req.query.user_id, "", req.query.route_name);
  userRouteDetailsWithShare = [...sharedfromroutes.sharedTo];

  function processRouteDetails(item) {
    if (item.route_status != "In-Progress") {
      return ({
        route_stops: item.route_stops,
        route_stops_v2: item.route_stops
      })
    }
    if (item.route_status == "In-Progress" && item.isRoundTrip == false) {
      return ({
        route_stops: item.user_route_stops_logs,
        route_stops_v2: item.user_route_stops_logs
      })
    }

    if (item.route_status === "In-Progress" && item.isRoundTrip === true) {
      let object = {
        placeId: item.end_place_id,
        latitude: item.end_latitude,
        longitude: item.end_longitude,
        status: "Not Started"
      };
      let route_stops = item.user_route_stops_logs
      let route_stops_v2 = [...item.user_route_stops_logs, object]
      return ({
        route_stops,
        route_stops_v2
      })
    }

    return userRouteDetails;
  }
  if (alluserRoute && alluserRoute.length > 0) {
    //mapping and assigning user routes to shared routes
    for (const item of alluserRoute) {
      let userRouteDetails = {};
      //if inprogress route assigning user_route_log_id to userroute details
      if (item.route_status == "In-Progress") {
        userRouteDetails.user_route_log_id = item.user_route_log_id;
        userRouteDetails.start_place_id = item.start_place_id;
        userRouteDetails.end_place_id = item.end_place_id
      }
      userRouteDetails.route_id = item.route_id;
      userRouteDetails.route_name = item.route_name;
      userRouteDetails.start_latitude = item.start_latitude;
      userRouteDetails.start_longitude = item.start_longitude;
      userRouteDetails.start_address = item.start_address;
      userRouteDetails.end_latitude = item.end_latitude;
      userRouteDetails.end_longitude = item.end_longitude;
      userRouteDetails.end_address = item.end_address;
      userRouteDetails.distance = item.distance;
      userRouteDetails.start_date = item.start_date;
      userRouteDetails.route = "userroute";
      userRouteDetails.started_date = item.started_date;
      userRouteDetails.end_date = item.end_date;
      userRouteDetails.route_id = item.route_id;
      userRouteDetails.route_status = item.route_status;
      userRouteDetails.created_by = item.created_by;
      userRouteDetails.createdAt = item.createdAt;
      userRouteDetails.updated_by = item.updated_by;
      userRouteDetails.enable_keep_route = false;
      userRouteDetails.route_started_count = 0;
      userRouteDetails.shared_route_status = "null";
      userRouteDetails.expiry_days = "";
      // userRouteDetails.route_stops = item.route_status == "In-Progress" ? item.user_route_stops_logs : item.route_stops;
      userRouteDetails.isRoundTrip = item.isRoundTrip;
      let stopDetails = await processRouteDetails(item)
      // return(stopDetails);
      userRouteDetails.route_stops = stopDetails.route_stops
      userRouteDetails.route_stops_v2 = stopDetails.route_stops_v2
      userRouteDetails.share_routes = [];

      // Enable Keep route option
      if (item.expires_on) {
        const currentDate = moment().utc().startOf("day");
        const expiry = moment.utc(item.expires_on, "YYYY-MM-DD").startOf("day");
        const datediff = expiry.diff(currentDate, "days");
        if (datediff >= 0 && datediff <= 2) {
          userRouteDetails.enable_keep_route = true;
          userRouteDetails.expiry_days = datediff;
        }
      }
      //getting user route shared route details
      userRouteDetails.share_routes = await sequelize.query(
        `select sr.shared_route_id,sr.expires_on,sr.user_id,sr.route_status,sr.is_expired,
      case when u.user_id is not null then  concat(u.first_name," ",u.last_name) else (sr.user_name) end as full_name, case when u.phone_number is not null then u.phone_number else sr.phone_number end as phone_number,
    CASE WHEN sr.route_status = 1 THEN "Not Started" WHEN sr.route_status = 2  THEN "In-Progress" WHEN sr.route_status = 3 THEN "Completed" WHEN sr.route_status = 0 THEN "Deleted" END as status
    from shared_routes sr
    left join users u on u.user_id = sr.user_id
    where sr.parent_route_id = ${item.route_id} and sr.route_id is null
    and sr.created_by = ${item.created_by}
    and route_status != 0 AND case when u.user_id is not null then u.is_active = 1 else true end and sr.is_expired!=1`,
        { type: Sequelize.QueryTypes.SELECT }
      );
      //shared route started count
      route_count = await sequelize.query(
        `SELECT  COUNT(*) as route_started_count  FROM shared_routes sr WHERE sr.parent_route_id = ${item.route_id} and sr.route_id is null
     and sr.created_by = ${item.created_by}
     and sr.route_status = 2`,
        { type: Sequelize.QueryTypes.SELECT }
      );
      //changing the status of the route to In-progress if shared route is in progress
      if (route_count[0]["route_started_count"] > 0) {
        userRouteDetails.route_started_count = route_count[0]["route_started_count"];
        userRouteDetails.shared_route_status = "In-Progress";
      }

      userRouteDetailsWithShare.push(userRouteDetails);
    }
  }
  //if sortby not empty then this output will return with pagination
  if (req.query.sortBy != null && req.query.sortBy != "") {
    const banners = await paginateArray(userRouteDetailsWithShare, req.query.offset, req.query.limit, sortBy, sortType);
    return {
      route_details: banners,
    };
  }
  //sorting the route created_at descending
  userRouteDetailsWithShare.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));//updatedAt need to be changed
  //assigning the route status
  let status = {
    "In-Progress": 1,
    "Not Started": 2,
    Completed: 4,
    null: 3,
  };
  //sort by above status
  const finalOutput = userRouteDetailsWithShare.sort(
    (a, b) => status[a.shared_route_status] - status[b.shared_route_status]
  );
  const sortedResults = finalOutput.sort((a, b) => status[a.route_status] - status[b.route_status]);
  //pagination
  const homeScreenResults = await paginateArray(sortedResults, req.query.offset, req.query.limit, sortBy, sortType);
  return {
    route_details: homeScreenResults,
  };
};
//api is not in use
/**
 * @description Get recent routes with pagination
 */
const recentRoutes = async (req) => {
  const { user_id, route_name, page = 1, size = 10 } = req.query;
  const pageNo = parseInt(page, 10) || 1;
  const offset = (pageNo - 1) * size;
  const limit = parseInt(size, 10);
  const unionQuery = `SELECT route_id, 
  route_name,start_latitude,start_longitude,start_address, end_latitude,end_longitude,end_address,
  start_date,started_date,end_date,route_started_count,created_by,
  distance, createdAt, updatedAt, 'ownroute' as type ,null as expires_on,null as parent_route_id,
  CASE WHEN route_status = 1 THEN "Not Started" WHEN route_status = 2 THEN "In-Progress" WHEN route_status = 3 THEN "Completed" WHEN route_status = 0 THEN "Deleted" END AS route_status
  FROM user_routes where created_by=${user_id} AND route_name like '%${route_name}%'
  UNION ALL
  SELECT shared_route_id as route_id, 
  route_name,start_latitude,start_longitude,start_address, end_latitude,end_longitude,end_address,
  start_date,started_date,end_date,route_started_count,created_by,
  distance, createdAt, updatedAt, 'sharedroute' as type ,expires_on,parent_route_id,
  CASE WHEN route_status = 1 THEN "Not Started" WHEN route_status = 2 THEN "In-Progress" WHEN route_status = 3 THEN "Completed" WHEN route_status = 0 THEN "Deleted" END AS route_status
  FROM shared_routes where user_id=${user_id} AND route_name like '%${route_name}%'
  `;
  const [countResult] = await sequelize.query(
    `SELECT count(*) as count FROM 
    (${unionQuery}) t
        ORDER BY createdAt DESC`,
    { type: Sequelize.QueryTypes.SELECT }
  );

  if (!countResult.count) {
    return {
      status: "success",
      page,
      nextPage: false,
      results: [],
      totalResults: countResult.count,
    };
  }

  const combinedList = await sequelize.query(
    `SELECT * FROM 
    (${unionQuery}) t
        ORDER BY createdAt DESC
        LIMIT ${offset}, ${limit}`,
    { type: Sequelize.QueryTypes.SELECT }
  );

  await Promise.all(
    combinedList.map(async (route) => {
      if (route.type === "ownroute") {
        const { dataValues: shared_route_permissions } =
          (await SharedRoutePermission.findOne({
            where: { route_id: route.route_id },
            attributes: ["allow_edit", "allow_share", "edit_startdate"],
          })) || {};

        Object.assign(route, shared_route_permissions);
        route.shared_route = await sequelize.query(
          `select sr.shared_route_id,sr.expires_on,sr.user_id,
      concat(u.first_name," ",u.last_name) as full_name,u.phone_number,
      CASE WHEN sr.route_status = 1 THEN "Not Started" WHEN sr.route_status = 2 THEN "In-Progress" WHEN sr.route_status = 3 THEN "Completed" WHEN sr.route_status = 0 THEN "Deleted" END as status
      from shared_routes sr
      inner join users u on u.user_id=sr.user_id
      where sr.parent_route_id = ${route.route_id} and sr.route_id is null
      and sr.created_by = ${route.created_by}
      and route_status != 0 and u.is_active=1`,
          { type: Sequelize.QueryTypes.SELECT }
        );
        if (route.route_status === "In-Progress") {
          const { dataValues: route_details } =
            (await UserRouteLog.findOne({
              where: {
                route_id: { [Op.eq]: `${route.route_id}` },
                route_status: 2,
              },
              attributes: ["user_route_log_id"],
            })) || {};
          Object.assign(route, route_details);
        }
      } else {
        route.shared_route_id = route.route_id;
        route.route_id = null;
        const { dataValues: shared_route_permissions } =
          (await SharedRoutePermission.findOne({
            where: { route_id: route.parent_route_id },
            attributes: ["allow_edit", "allow_share", "edit_startdate"],
          })) || {};
        Object.assign(route, shared_route_permissions);
        if (route.route_status === "In-Progress") {
          const user = await User.findOne({
            where: { user_id: route.created_by },
            attributes: ["user_id", "first_name", "last_name", "email", "phone_number"],
          });
          route.shared_user_id = user.dataValues.user_id;
          route.shared_user_name = user.dataValues.first_name + " " + user.dataValues.last_name;
          route.shared_user_email = user.dataValues.email;
          route.shared_user_phone_number = user.dataValues.phone_number;
        }
      }
    })
  );
  // Sorting recent routes
  let status = {
    "In-Progress": 1,
    "Not Started": 2,
    Completed: 3,
  };
  const sortedResults = combinedList.sort((a, b) => status[a.route_status] - status[b.route_status]);
  return {
    status: "success",
    page,
    nextPage: countResult.count > size * page ? true : false,
    results: sortedResults,
    totalResults: countResult.count,
  };
};

const userRouteExpiration = async () => {
  const startDate = moment().utc().add(2, "days").startOf("hour").format("YYYY-MM-DD HH:mm:ss");
  const EndDate = moment().utc().add(2, "days").endOf("hour").format("YYYY-MM-DD HH:mm:ss");
  // const EndDate=moment().utc().add(3, 'days').format('YYYY-MM-DD 00:00:00');
  const userRouteExpirationCheck = await sequelize.query(
    `SELECT * FROM user_routes
  WHERE (expires_on IS NOT NULL AND (expires_on >= '${startDate}' AND expires_on < '${EndDate}' AND route_status!=0 ));`,
    { type: Sequelize.QueryTypes.SELECT }
  );
  if (userRouteExpirationCheck.length) {
    await Promise.all(
      userRouteExpirationCheck.map(async (route) => {
        const title = await getTemplate("Route_remainder");
        const data = (await route.route_name) + " " + title.content;
        await sendPushNotification(title.title, data, [`${route.created_by}`]);
      })
    );
  }
};
//getting template from db
const getTemplate = async (template_code) => {
  const template = await Template.findOne({
    where: { template_code: template_code },
    attributes: ["title", "content"],
  });
  if (template) {
    return template;
  }
};
//extending the route for next 30 days
const keepUserRoute = async (req) => {
  //if the req has shared routes then this api will be called
  if (req.query.shared_route_id) {
    return await sharedService.keepSharedRoute(req);
  }
  const userRoute = await UserRoute.findAll({ where: { route_id: req.query.route_id } });
  if (req.query.keep_route && req.query.keep_route == true) {
    const currentDate = moment().utc().startOf("day");
    const expiry = moment.utc(userRoute[0].expires_on, "YYYY-MM-DD").startOf("day");
    const datediff = expiry.diff(currentDate, "days");
    if (datediff >= 0 && datediff <= 2) {
      const date = moment(userRoute[0].expires_on).add(config.setexpirydate, "days").format("YYYY-MM-DD HH:mm:ss");
      //updating the user route if user gives yes
      await UserRoute.update(
        {
          expires_on: date,
          updated_by: req.query.user_id,
        },
        { where: { route_id: req.query.route_id } }
      );
      return {
        status: "success",
        message: "Date Updated Successfully",
      };
    }
  }
};

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
  updateStopStatus,
  deleteRoute,
  checkActiveRoutes,
  deleteStop,
  inprogressUserRouteDetails,
  checkRouteName,
  homeScreen,
  recentRoutes,
  userRouteExpiration,
  optimizeRoute,
  keepUserRoute,
};
