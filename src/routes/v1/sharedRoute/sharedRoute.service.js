const httpStatus = require("http-status");
const Sequelize = require("sequelize");
const crypto = require("crypto");
const moment = require("moment");
const config = require("../../../config/config");
const { Op } = Sequelize;
const db = require("../../../models");
const UserRoute = db.userRoute;
const SharedRoute = db.sharedRoute;
const SharedRouteStops = db.sharedRouteStops;
const SharedRoutePermission = db.sharedRoutePermission;
const TempSharedRoute = db.tempSharedRoute;
const TempSharedRouteStops = db.tempSharedRouteStops;
const RouteStops = db.routeStops;
const User = db.user;
const UserDevice = db.userDevice;
const Template = db.pushNotificationTemplates;
const { sendPushNotification } = require("../../../services/push_notification.service.js");
const ApiError = require("../../../utils/ApiError");
const authService = require("../auth/auth.service");
const { now } = require("moment");
const { sequelize } = require("../../../models");
const distanceService = require("../../../services/map.service");
const userService = require("../user/user.service");
const { emitSharedRoute } = require("../../../utils/webSockets");
const { shareInvitees } = require("../invitees/invitees.service");

const sharedRoutesByFromUserId = async (req) => {
  let sharedResults = [];
  const sharedroute = await SharedRoute.findAll({
    attributes: ["route_name", "distance", "route_id", "parent_route_id"],
    where: { created_by: req.query.FromUserId, route_status: { [Op.ne]: 0 } },
    group: ["route_name", "distance", "route_id", "parent_route_id"],
  });
  for (const item of sharedroute) {
    let details = {};
    details.route_name = item.route_name;
    details.distance = item.distance;
    details.parent_route_id = item.parent_route_id;
    details.route_id = item.route_id;

    const userDetails = await SharedRoute.findAll({
      attributes: [
        "shared_route_id",
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
          model: User,
          attributes: ["user_id", "first_name", "last_name"],
          where: { is_active: 1 },
          required: false,
        },
      ],
      where: { parent_route_id: item.parent_route_id, route_id: item.route_id, route_status: { [Op.ne]: 0 } },
    });

    details.users = [];
    await userDetails.forEach(async (u) => {
      if (u.user && u.user != "") {
        let userDetails = {};
        userDetails.shared_route_id = u.shared_route_id;
        userDetails.user_id = u.user.user_id;
        userDetails.user_name = u.user.first_name + " " + u.user.last_name;
        userDetails.expires_on = u.expires_on;
        userDetails.route_status = u.route_status;
        details.users.push(userDetails);
      }
    });
    sharedResults.push(details);
  }
  if (sharedResults == "") {
    return {
      status: "success",
      message: "No record found",
    };
  }
  return {
    sharedFrom: sharedResults,
  };
};
//used in userroute service api call
const sharedRoutesByToUserId = async (user_id, status = "", search = "") => {
  const currenttime = moment(new Date()).format("YYYY-MM-DD HH:MM:ss");
  let statusId = "1,2,3";
  if (status && status != "") {
    switch (status) {
      case "Inprogress":
        statusId = 2;
        break;
      case "Not Started":
        statusId = 1;
        break;
    }
  }

  const sharedList = await sequelize.query(
    `select sr.shared_route_id,sr.user_id,sr.route_id,sr.route_name,sr.start_latitude,sr.start_longitude,sr.start_address,sr.end_latitude,sr.end_longitude,
 sr.end_address,sr.distance,sr.start_date,sr.started_date,sr.end_date,sr.parent_route_id,sr.isRoundTrip,
 CASE WHEN sr.route_status = 1 THEN "Not Started" WHEN sr.route_status = 2 THEN "In-Progress" WHEN sr.route_status = 3 THEN "Completed" WHEN sr.route_status = 0 THEN "Deleted" END as route_status
 ,sr.created_by,sr.updated_by,sr.expires_on,sr.createdAt,sr.start_place_id,sr.end_place_id,
 if(sr.expires_on<'${currenttime}','expired',null)as'is_expired',srp.shared_route_permission_id,srp.allow_edit,srp.allow_share,srp.edit_startdate,
 u.user_id as shared_user_id,concat(u.first_name," ",u.last_name) as shared_user_name,u.email as shared_user_email,u.phone_number as shared_user_phone_number
 from shared_routes as sr
  inner join shared_route_permissions as srp  on sr.parent_route_id=srp.route_id
 inner join users as u on sr.created_by=u.user_id 
 where sr.user_id='${user_id}' and sr.route_status in (${statusId}) and sr.route_name LIKE '%${search}%' and sr.expires_on >'${currenttime}'`,
    { type: Sequelize.QueryTypes.SELECT }
  );

  let sharesList = [];
  // function processRouteDetails(item) {
  //   if(item.route_status != "In-Progress"){
  //     return({
  //     route_stops:item.route_stops,
  //     route_stops_v2:item.route_stops
  //   })
  //   }
  //   if(item.route_status == "In-Progress"&&item.isRoundTrip==false){
  //     return({
  //     route_stops:item.user_route_stops_logs,
  //     route_stops_v2:item.user_route_stops_logs
  //   })
  //   }

  //   if (item.route_status === "In-Progress" && item.isRoundTrip === true) {
  //     let object = {
  //       placeId: item.end_place_id,
  //       end_latitude: item.end_latitude,
  //       end_longitude: item.end_longitude
  //     };
  //     let route_stops=item.user_route_stops_logs
  //     let route_stops_v2=[...item.user_route_stops_logs,object]
  //     return({
  //       route_stops,
  //       route_stops_v2
  //     })
  //   }
  // }
  for (const item of sharedList) {
    let sharedToList = {};

    sharedToList.shared_route_id = item.shared_route_id;
    sharedToList.user_id = item.user_id;
    sharedToList.route_id = item.route_id;
    sharedToList.route_name = item.route_name;
    sharedToList.start_latitude = item.start_latitude;
    sharedToList.start_longitude = item.start_longitude;
    sharedToList.start_address = item.start_address;
    sharedToList.end_latitude = item.end_latitude;
    sharedToList.end_longitude = item.end_longitude;
    sharedToList.end_address = item.end_address;
    sharedToList.distance = item.distance;
    sharedToList.start_date = item.start_date;
    sharedToList.started_date = item.started_date;
    sharedToList.end_date = item.end_date;
    sharedToList.parent_route_id = item.parent_route_id;
    sharedToList.route_status = item.route_status;
    sharedToList.created_by = item.created_by;
    sharedToList.updated_by = item.updated_by;
    sharedToList.expires_on = item.expires_on;
    sharedToList.is_expired = item.is_expired;
    sharedToList.allow_edit = item.allow_edit;
    sharedToList.allow_share = item.allow_share;
    sharedToList.allow_editstartdate = item.edit_startdate;
    sharedToList.shared_route_permission_id = item.shared_route_permission_id;
    sharedToList.allow_edit = item.allow_edit;
    sharedToList.allow_share = item.allow_share;
    sharedToList.route = "shareroute";
    if (item.route_status == "In-Progress") {
      sharedToList.start_place_id = sharedList[0].start_place_id;
      sharedToList.end_place_id = sharedList[0].end_place_id;
    }
    sharedToList.enable_keep_route = false;
    sharedToList.shared_user_name = item.shared_user_name;
    sharedToList.shared_user_id = item.shared_user_id;
    sharedToList.createdAt = item.createdAt;
    sharedToList.shared_user_email = item.shared_user_email;
    sharedToList.shared_user_phone_number = item.shared_user_phone_number;
    sharedToList.shared_route_status = "null";
    sharedToList.shared_route_permission_id = item.shared_route_permission_id;
    sharedToList.expiry_days = "";
    sharedToList.share_routes = [];
    sharedToList.route_stops = [];
    sharedToList.route_stops_v2 = []
    sharedToList.isRoundTrip = item.isRoundTrip
    // let stopDetails=await processRouteDetails(item)
    // if(item.route_status=="In-Progress"){
    sharedToList.start_place_id = item.start_place_id ? item.start_place_id : "";
    sharedToList.end_place_id = item.end_place_id ? item.end_place_id : "";
    // }

    // Keep route option enable from 28days to 30days
    if (item.expires_on) {
      const currentDate = moment().utc().startOf("day");
      const expiry = moment.utc(item.expires_on, "YYYY-MM-DD").startOf("day");
      const datediff = expiry.diff(currentDate, "days");
      if (datediff >= 0 && datediff <= 2) {
        sharedToList.enable_keep_route = true;
        sharedToList.expiry_days = datediff;
      }
    }

    sharedToList.share_routes = await sequelize.query(
      `select sr.shared_route_id,sr.expires_on,sr.user_id,
    case when u.user_id is not null then  concat(u.first_name," ",u.last_name) else (sr.user_name) end as full_name, case when u.phone_number is not null then u.phone_number else sr.phone_number end as phone_number,
    CASE WHEN sr.route_status = 1 THEN "Not Started" WHEN sr.route_status = 2 THEN "In-Progress" WHEN route_status = 3 THEN "Completed" WHEN sr.route_status = 0 THEN "Deleted" END as status
    from shared_routes sr
    left join users u on u.user_id = sr.user_id
    where route_id= ${item.shared_route_id} and parent_route_id=${item.parent_route_id} 
    and route_status != 0 AND case when u.user_id is not null then u.is_active = 1 else true end`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    if (item.route_status == "In-Progress") {
      const sharedRoutes = await TempSharedRoute.findOne({
        where: { route_status: 2, shared_route_id: { [Op.eq]: `${item.shared_route_id}` } },
        attributes: [
          "temp_shared_route_id",
          "shared_route_id",
        ],
      });
      sharedToList.route_stops = await sequelize.query(
        `select sr.temp_shared_stop_id,sr.shared_stop_id,sr.latitude,sr.longitude,sr.shared_route_id,sr.sequence_number,sr.address,sr.contact_name,sr.placeId,sr.phone_number,
      CASE WHEN sr.status = 1 THEN "Not Started" WHEN sr.status = 2 THEN "In-Progress" WHEN status = 3 THEN "Completed" WHEN sr.status = 0 THEN "Deleted" END as status
      from temp_shared_stops sr
      where sr.shared_route_id= ${item.shared_route_id} and sr.temp_shared_route_id=${sharedRoutes.dataValues.temp_shared_route_id} 
      and sr.status != 0 ORDER BY
      sr.sequence_number ASC`,
        { type: Sequelize.QueryTypes.SELECT }
      );
    }
    if (item.route_status == "In-Progress") {
      const sharedRoutes = await TempSharedRoute.findOne({
        where: { route_status: 2, shared_route_id: { [Op.eq]: `${item.shared_route_id}` } },
        attributes: [
          "temp_shared_route_id",
          "shared_route_id",
        ],
      });
      sharedToList.route_stops_v2 = await sequelize.query(
        `select sr.temp_shared_stop_id,sr.shared_stop_id,sr.latitude,sr.longitude,sr.shared_route_id,sr.sequence_number,sr.address,sr.contact_name,sr.placeId,sr.phone_number,
      CASE WHEN sr.status = 1 THEN "Not Started" WHEN sr.status = 2 THEN "In-Progress" WHEN status = 3 THEN "Completed" WHEN sr.status = 0 THEN "Deleted" END as status
      from temp_shared_stops sr
      where sr.shared_route_id= ${item.shared_route_id} and sr.temp_shared_route_id=${sharedRoutes.dataValues.temp_shared_route_id} 
      and sr.status != 0 ORDER BY
      sr.sequence_number ASC`,
        { type: Sequelize.QueryTypes.SELECT }
      );
      if (item.isRoundTrip == true) {
        let route_details = {
          placeId: item.end_place_id,
          latitude: item.end_latitude,
          longitude: item.end_longitude,
          status: "Not Started"
        };
        sharedToList.route_stops_v2.push(route_details)
      }
      // await sharesList.push(sharedToList);
    } else if (item.route_status != "In-Progress") {
      sharedToList.route_stops = await sequelize.query(
        `select sr.shared_stop_id,sr.latitude,sr.longitude,sr.shared_route_id,sr.sequence_number,sr.address,sr.contact_name,sr.placeId,sr.phone_number,
    CASE WHEN sr.status = 1 THEN "Not Started" WHEN sr.status = 2 THEN "In-Progress" WHEN status = 3 THEN "Completed" WHEN sr.status = 0 THEN "Deleted" END as status
    from shared_stops sr
    where sr.shared_route_id= ${item.shared_route_id}
    and sr.status != 0 ORDER BY
    sr.sequence_number ASC`,
        { type: Sequelize.QueryTypes.SELECT }
      );
      sharedToList.route_stops_v2 = await sequelize.query(
        `select sr.shared_stop_id,sr.latitude,sr.longitude,sr.shared_route_id,sr.sequence_number,sr.address,sr.contact_name,sr.placeId,sr.phone_number,
    CASE WHEN sr.status = 1 THEN "Not Started" WHEN sr.status = 2 THEN "In-Progress" WHEN status = 3 THEN "Completed" WHEN sr.status = 0 THEN "Deleted" END as status
    from shared_stops sr
    where sr.shared_route_id= ${item.shared_route_id}
    and sr.status != 0 ORDER BY
    sr.sequence_number ASC`,
        { type: Sequelize.QueryTypes.SELECT }
      );
    }
    await sharesList.push(sharedToList);
  }

  if (!sharesList) {
    return {
      message: "No record found",
    };
  }
  return {
    sharedTo: sharesList,
  };
};
//creating shared route api
const createSharedRoute = async (
  req,
  route_id,
  existinguser,
  nonexistinguser,
  nonexistinguserdetails,
  ph_number,
  details
) => {
  try {
    let shares = {};
    //checking whether the route is already shared to the user
    shares = await sequelize.query(
      `select distinct user_id,route_status,shared_route_id,phone_number from shared_routes where parent_route_id='${route_id}' and route_id is null and route_status!=0 and is_expired!=1`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    let expires_on = null;
    if (
      req?.body?.share_permissions?.share_endofday === true ||
      req?.body?.share_permissions?.share_onehour === true ||
      req?.body?.share_permissions?.share_indefinitely === true
    ) {
      switch (
      req.body.share_permissions.share_endofday === true ||
      req.body.share_permissions.share_onehour === true ||
      req?.body?.share_permissions?.share_indefinitely === true
      ) {
        case req.body.share_permissions.share_endofday === true:
          expires_on = moment().endOf("day").format("YYYY-MM-DD HH:mm:ss");
          break;
        case req.body.share_permissions.share_onehour === true:
          expires_on = moment(new Date()).utc().add(1, "h").format("YYYY-MM-DD HH:mm:ss");
          break;
        case req.body.start_date != null && req.body.start_date != "":
          expires_on = moment(new Date(req.body.start_date))
            .utc()
            .add(config.setexpirydate, "days")
            .format("YYYY-MM-DD HH:mm:ss");
          break;
        case req.body.share_permissions.share_indefinitely === true:
          expires_on = moment(new Date()).utc().add(config.setexpirydate, "days").format("YYYY-MM-DD HH:mm:ss");
          break;
      }
    }
    // Update and remove existing shares
    if (shares && shares != "") {
      shares.forEach(async (user) => {
        var found = ph_number.indexOf(user.phone_number);
        // Update existing routes only when the route is not started
        if (found != -1 && user.route_status == 1) {
          await SharedRoute.update(
            {
              route_name: req.body.route_name,
              start_latitude: req.body.start_latitude,
              start_longitude: req.body.start_longitude,
              start_address: req.body.start_address,
              end_latitude: req.body.end_latitude,
              end_longitude: req.body.end_longitude,
              end_address: req.body.end_address,
              start_date: req.body.start_date ? req.body.start_date : null,
              // start_time: req.body.start_time,
              end_time: req.body.end_time,
              // distance: optimizedDist.distance,
              created_by: req.body.user_id,
              updated_by: req.body.user_id,
              expires_on: expires_on,
              route_status: 1,
              // is_optimize: optimize
              //route_started_count:0
            },
            {
              where: {
                parent_route_id: route_id,
                phone_number: user.phone_number,
                shared_route_id: user.shared_route_id,
              },
            }
          );

          // Remove existing stops and add
          await SharedRouteStops.destroy({
            where: { shared_route_id: user.shared_route_id },
            truncate: false,
          });
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
              // checking distance api
              const location = await distanceService.getLatLong(item.address);
              if (!location || location == "" || location == null || location.isOperational == true) {
                throw new ApiError(httpStatus.BAD_REQUEST, "Invalid Address");
              }
              latitude = location.length > 0 && location[0].latitude ? location[0].latitude : "";
              longitude = location.length > 0 && location[0].longitude ? location[0].longitude : "";
            }
            //shared routes stops map
            let routeStops = await SharedRouteStops.create({
              latitude: latitude,
              longitude: longitude,
              address: item.address,
              sequence_number: item.sequence_number,
              contact_name: item.contact_name ? item.contact_name : null,
              phone_number: item.phone_number ? item.phone_number : null,
              shared_route_id: user.shared_route_id,
              status: 1,
              created_by: req.body.user_id,
              updated_by: req.body.user_id,
              placeId: placeId
            });

            if (!routeStops) {
              throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Something went wrong");
            }
          }
          // );
          const userId = `${user.user_id}`;
          const title = await getTemplate("Route_reshared");
          const username = await User.findOne({
            where: { user_id: req.body.user_id },
            attributes: ["first_name", "last_name"],
          });
          const data =
            (await req.body.route_name) + " " + title.content + " " + username.first_name + " " + username.last_name;
          await sendPushNotification(title.title, data, [userId]);
        } else if (found == -1 && user.route_status == 1) {
          await SharedRoute.update(
            { route_status: 0 },
            { where: { parent_route_id: route_id, user_id: user.user_id, shared_route_id: user.shared_route_id } }
          );
          await SharedRouteStops.update({ route_status: 0 }, { where: { shared_route_id: user.shared_route_id } });
        }
      });
      //new user share for shared routes
      details.forEach(async (to_user_id) => {
        var newShare = "";
        newShare = shares.find((o) => o.phone_number == to_user_id.phone_number);
        const userId = await User.findOne({ where: { phone_number: to_user_id.phone_number } });
        if (typeof newShare == "undefined" || newShare == "") {
          const shareRoute = {
            route_id: null,
            parent_route_id: route_id,
            route_name: req.body.route_name,
            start_latitude: req.body.start_latitude,
            start_longitude: req.body.start_longitude,
            start_address: req.body.start_address,
            end_latitude: req.body.end_latitude,
            end_longitude: req.body.end_longitude,
            end_address: req.body.end_address,
            start_date: req.body.start_date ? req.body.start_date : null,
            end_time: req.body.end_time,
            created_by: req.body.user_id,
            updated_by: req.body.user_id,
            expires_on: expires_on,
            user_id: userId ? userId.user_id : null,
            route_status: 1,
            phone_number: to_user_id.phone_number,
            region: to_user_id.region ? to_user_id.region : null,
            user_name: to_user_id.name,
            email: to_user_id.email_id,
          };
          let route_details = {};
          route_details = await SharedRoute.create(shareRoute);
          if (route_details) {
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
              let routeStops = await SharedRouteStops.create({
                latitude: latitude,
                longitude: longitude,
                address: item.address,
                sequence_number: item.sequence_number,
                contact_name: item.contact_name ? item.contact_name : null,
                phone_number: item.phone_number ? item.phone_number : null,
                region: item.region ? item.region : null,
                shared_route_id: route_details.shared_route_id,
                status: 1,
                created_by: req.body.user_id,
                updated_by: req.body.user_id,
                placeId: placeId
              });
              if (!routeStops) {
                throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Something went wrong");
              }
            }
            if (userId != null && userId != "") {
              const userIds = `${userId.user_id}`;
              const title = await getTemplate("Route_shared");
              const username = await User.findOne({
                where: { user_id: req.body.user_id },
                attributes: ["first_name", "last_name"],
              });
              const data =
                (await req.body.route_name) +
                " " +
                title.content +
                " " +
                username.first_name +
                " " +
                username.last_name;
              await sendPushNotification(title.title, data, [userIds]);
            }
          } else {
            throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Something went wrong");
          }
        }
      });
    } else {
      //new route share
      await details.forEach(async (to_user_id) => {
        const userId = await User.findOne({ where: { phone_number: to_user_id.phone_number } });
        const shareRoute = {
          route_id: null,
          parent_route_id: route_id,
          route_name: req.body.route_name,
          start_latitude: req.body.start_latitude,
          start_longitude: req.body.start_longitude,
          start_address: req.body.start_address,
          end_latitude: req.body.end_latitude,
          end_longitude: req.body.end_longitude,
          end_address: req.body.end_address,
          start_date: req.body.start_date ? req.body.start_date : null,
          end_time: req.body.end_time,
          created_by: req.body.user_id,
          updated_by: req.body.user_id,
          expires_on: expires_on,
          user_id: userId ? userId.user_id : null,
          route_status: 1,
          phone_number: to_user_id.phone_number,
          region: to_user_id.region ? to_user_id.region : null,
          user_name: to_user_id.name,
          email: to_user_id.email_id,
        };
        let route_details = {};
        route_details = await SharedRoute.create(shareRoute);
        if (route_details) {
          for (const item of req.body.route_stops) {
            let placeId = ""
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
            let routeStops = await SharedRouteStops.create({
              latitude: latitude,
              longitude: longitude,
              address: item.address,
              sequence_number: item.sequence_number,
              shared_route_id: route_details.shared_route_id,
              contact_name: item.contact_name ? item.contact_name : null,
              phone_number: item.phone_number ? item.phone_number : null,
              region: item.region ? item.region : null,
              status: 1,
              created_by: req.body.user_id,
              updated_by: req.body.user_id,
              placeId: placeId,
            });
            if (!routeStops) {
              throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Something went wrong");
            }
          }
          if (userId != null && userId != "") {
            const userIds = `${userId.user_id}`;
            const title = await getTemplate("Route_shared");
            const username = await User.findOne({
              where: { user_id: req.body.user_id },
              attributes: ["first_name", "last_name"],
            });
            const data =
              (await req.body.route_name) + " " + title.content + " " + username.first_name + " " + username.last_name;
            await sendPushNotification(title.title, data, [userIds]);
          }
        } else {
          throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Something went wrong");
        }
      });
      return {
        status: "success",
        message: "Route is shared successfully",
      };
    }
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
  }
};

const editSharedRoute = async (req) => {
  try {
    // const optimize = (req.body.is_optimize) ? true : false
    // let distance = await distanceService.calcDistance(req.body,req.body.route_stops);
    //checking shared route
    const routecheck = await UserRoute.findOne({
      where: {
        route_id: req.body.parent_route_id,
      },
    });
    if (routecheck && routecheck != "" && routecheck != null) {
      const permissioncheck = await SharedRoutePermission.findOne({
        where: {
          route_id: req.body.parent_route_id,
          allow_edit: 1,
        },
      });
      if (!permissioncheck || permissioncheck == "") {
        throw new ApiError(httpStatus.BAD_REQUEST, "This route cannot be edited");
      }
      const userroutenamecheck = await UserRoute.findOne({
        where: {
          created_by: req.body.user_id,
          route_name: req.body.route_name,
          route_status: { [Op.ne]: 0 },
        },
      });

      if (userroutenamecheck) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Route name already exists");
      }

      const routename = await SharedRoute.findOne({
        where: { shared_route_id: req.body.shared_route_id },
        attributes: ["shared_route_id", "route_name", "route_id", "user_id"],
      });
      if (routename.dataValues.route_name === req.body.route_name) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Please rename the route name");
      }
      let route = {};
      const userRoute = {
        route_name: req.body.route_name,
        start_latitude: req.body.start_latitude,
        start_longitude: req.body.start_longitude,
        start_address: req.body.start_address,
        end_latitude: req.body.end_latitude,
        end_longitude: req.body.end_longitude,
        end_address: req.body.end_address,
        start_date: req.body.start_date ? req.body.start_date : null,
        // start_time: req.body.start_time,
        end_time: req.body.end_time,
        distance: null,
        created_by: req.body.user_id,
        updated_by: req.body.user_id,
        route_status: 1,
        route_started_count: 0,
      };
      route.route_details = await UserRoute.create(userRoute);
      if (route.route_details) {
        // req.body.route_stops.forEach(async (item) => {
        for (const item of req.body.route_stops) {
          let placeId = ""
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
          let routeStops = await RouteStops.create({
            latitude: latitude,
            longitude: longitude,
            address: item.address,
            sequence_number: item.sequence_number,
            contact_name: item.contact_name ? item.contact_name : null,
            phone_number: item.phone_number ? item.phone_number : null,
            region: item.region ? item.region : null,
            //stop_user_id: item.stop_user_id,
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
        // await SharedRoutePermission.create({
        //   allow_edit: permissioncheck.allow_edit,
        //   allow_share: permissioncheck.allow_share,
        //   share_indefinitely: permissioncheck.share_indefinitely,
        //   share_endofday: permissioncheck.share_endofday,
        //   share_onehour: permissioncheck.share_onehour,
        //   route_id: route.route_details.route_id,
        //   user_id: req.body.user_id,
        // });
      } else {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Something went wrong");
      }
      // if (req.body.shared_routes) {
      //   const sharedRoute = await createSharedRoute(req, route.route_details.route_id);
      //   if (sharedRoute.status != 'success') {
      //     throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Something went wrong");
      //   }
      // }
    } else {
      throw new ApiError(httpStatus.NOT_FOUND, "RouteId does not exsit");
    }
    return {
      status: "success",
      message: "Route updated Successfully",
    };
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
  }
};
//getting shared routes by id
const sharedRouteDetailsById = async (shared_route_id) => {
  try {
    const checkStatus = await SharedRoute.findOne({
      attributes: ["route_status"],
      where: { shared_route_id: shared_route_id },
    });
    if (!checkStatus || checkStatus == "") {
      throw new ApiError(httpStatus.BAD_REQUEST, "Invalid Shared Route Id");
    }

    if (checkStatus.dataValues.route_status != 2) {
      let shared_route_details = {};
      const sharedRoutes = await SharedRoute.findAll({
        where: { shared_route_id: { [Op.eq]: `${shared_route_id}` } },
        attributes: [
          "shared_route_id",
          "parent_route_id",
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
          "expires_on",
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
            model: SharedRouteStops,
            attributes: [
              "shared_stop_id",
              "latitude",
              "longitude",
              "address",
              "sequence_number",
              "shared_route_id",
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
            as: "shared_stops",
            required: false,
          },
          {
            model: SharedRoutePermission,
            required: false,
            attributes: [
              "shared_route_permission_id",
              "allow_edit",
              "allow_share",
              "share_indefinitely",
              "share_endofday",
              "share_onehour",
              "edit_startdate",
            ],
          },
        ],
        order: [
          [SharedRouteStops, 'sequence_number', 'ASC'], // Sorting by sequence_number in ascending order
        ],
      });
      if (!sharedRoutes || sharedRoutes == "") {
        throw new ApiError(httpStatus.BAD_REQUEST, "Invalid RouteId");
      }

      const user = await User.findOne({
        where: { user_id: sharedRoutes[0].dataValues.created_by },
        attributes: ["user_id", "first_name", "last_name", "email", "phone_number"],
      });
      shared_route_details.shared_route_id = sharedRoutes[0].dataValues.shared_route_id;
      shared_route_details.route_id = sharedRoutes[0].dataValues.route_id;
      shared_route_details.parent_route_id = sharedRoutes[0].dataValues.parent_route_id;
      shared_route_details.route_status = sharedRoutes[0].dataValues.route_status;
      shared_route_details.route_name = sharedRoutes[0].dataValues.route_name;
      shared_route_details.start_latitude = sharedRoutes[0].dataValues.start_latitude;
      shared_route_details.start_longitude = sharedRoutes[0].dataValues.start_longitude;
      shared_route_details.start_address = sharedRoutes[0].dataValues.start_address;
      shared_route_details.end_latitude = sharedRoutes[0].dataValues.end_latitude;
      shared_route_details.end_longitude = sharedRoutes[0].dataValues.end_longitude;
      shared_route_details.end_address = sharedRoutes[0].dataValues.end_address;
      shared_route_details.distance = sharedRoutes[0].dataValues.distance;
      shared_route_details.start_date = sharedRoutes[0].dataValues.start_date;
      shared_route_details.started_date = sharedRoutes[0].dataValues.started_date;
      shared_route_details.end_date = sharedRoutes[0].dataValues.end_date;
      shared_route_details.route_status = sharedRoutes[0].dataValues.route_status;
      shared_route_details.created_by = sharedRoutes[0].dataValues.created_by;
      shared_route_details.updated_by = sharedRoutes[0].dataValues.updated_by;
      shared_route_details.expires_on = sharedRoutes[0].dataValues.expires_on;
      shared_route_details.shared_user_id = user.user_id;
      shared_route_details.shared_user_name = user.first_name + " " + user.last_name;
      shared_route_details.shared_user_email = user.email;
      shared_route_details.shared_user_phone_number = user.phone_number;
      shared_route_details.enable_keep_route = false;
      shared_route_details.expiry_days = "";
      shared_route_details.last_known_latitude = "";
      shared_route_details.last_known_longitude = "";
      shared_route_details.shared_route_permissions = sharedRoutes[0]?.shared_route_permission?.dataValues
        ? sharedRoutes[0]?.shared_route_permission?.dataValues
        : [];
      shared_route_details.shared_route_stops = sharedRoutes[0].shared_stops;
      shared_route_details.route_stops_v2 = sharedRoutes[0].shared_stops;

      // Keep route option enable from 28days to 30days
      if (sharedRoutes[0].expires_on) {
        const currentDate = moment().utc().startOf("day");
        const expiry = moment.utc(sharedRoutes[0].expires_on, "YYYY-MM-DD").startOf("day");
        const datediff = expiry.diff(currentDate, "days");
        if (datediff >= 0 && datediff <= 2) {
          shared_route_details.enable_keep_route = true;
          shared_route_details.expiry_days = datediff;
        }
      }
      shared_route_details.shared_routes = await sequelize.query(
        `select sr.shared_route_id,sr.expires_on,sr.user_id,sr.route_status,sr.is_expired,
  case when u.user_id is not null then  concat(u.first_name," ",u.last_name) else (sr.user_name) end as full_name, case when u.phone_number is not null then u.phone_number else sr.phone_number end as phone_number,
  CASE WHEN sr.route_status = 1 THEN "Not Started" WHEN sr.route_status = 2  THEN "Completed" WHEN sr.route_status = 0 THEN "Deleted" END as status
  from shared_routes sr
  left join users u on u.user_id=sr.user_id
  where route_id= ${shared_route_id} and parent_route_id=${sharedRoutes[0].dataValues.parent_route_id} 
  and route_status != 0 AND case when u.user_id is not null then u.is_active = 1 else true end and is_expired!=1`,
        { type: Sequelize.QueryTypes.SELECT }
      );

      return {
        shared_route_details,
      };
    } else {
      return await inprogressRouteDetails(shared_route_id);
    }
  } catch (e) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Something went wrong. Please contact admin. " + e);
  }
};

/**
 * @description Update the Share Route Status
 * For Starting and Completing Shared Routes
 */
const updateRouteStatus = async (req) => {
  const { is_optimize, route_stops, user_id } = req.body;
  const route_name_trim = req.body.route_name ? req.body.route_name.trim() : "";
  const sharedRoutes = await SharedRoute.findOne({
    where: { shared_route_id: req.body.share_route_id, user_id: req.body.user_id },
  });
  if (!sharedRoutes) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Incorrect RouteId");
  }
  if (req.body.route_status == "Completed" && sharedRoutes.route_status == 1) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Route cannot be completed");
  }
  if (req.body.route_status == "Started") {
    if (sharedRoutes.route_status == 3) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Route completed.");
    }

    if (sharedRoutes.route_status == 0) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Route deleted.");
    }

    if (sharedRoutes.route_status == 2) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Route already in-progress.");
    }

    var activeRoutes = await checkActiveRoutes(req.body.user_id);
    if (activeRoutes) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Route cannot be started. Another route in-progress");
    }

    const { distance } = await distanceService.calcDistance(req.body, route_stops, is_optimize);
    let startPlaceId = "";
    let endPlaceId = ""
    if (req.body.start_latitude !== (undefined && "") && req.body.start_longitude !== "" && req.body.end_latitude !== undefined && req.body.end_longitude !== "") {
      startPlaceId = await distanceService.getPlaceIdFromLatLong(req.body.start_latitude, req.body.start_longitude);
      endPlaceId = await distanceService.getPlaceIdFromLatLong(req.body.end_latitude, req.body.end_longitude);
    }
    const updateshare = await SharedRoute.update(
      {
        route_status: 2,
        start_latitude: req.body.start_latitude,
        start_longitude: req.body.start_longitude,
        end_latitude: req.body.end_latitude,
        end_longitude: req.body.end_longitude,
        distance: distance,
        route_started_count: sharedRoutes.route_started_count + 1,
        started_date: now(),
        updated_by: req.body.user_id,
        start_place_id: startPlaceId,
        end_place_id: endPlaceId,
        updatedAt: now(),
        isRoundTrip: req.body.isRoundTrip
      },
      {
        where: {
          shared_route_id: req.body.share_route_id,
        },
      }
    );

    await SharedRouteStops.destroy({
      where: {
        shared_route_id: {
          [Op.eq]: req.body.share_route_id,
        },
      },
      truncate: false,
    });
    const promises = route_stops.map(async (stop) => {
      let placeId = "";
      if (stop.latitude !== undefined && stop.latitude !== "" && stop.longitude !== undefined && stop.longitude !== "") {
        placeId = await distanceService.getPlaceIdFromLatLong(stop.latitude, stop.longitude);
      }
      else if (stop.address && stop.address != "") {
        placeId = await distanceService.getPlaceId(stop.address)
      }
      delete stop.shared_stop_id;
      delete stop.stop_type;
      delete stop.user_id;
      await SharedRouteStops.create({
        ...stop,
        shared_route_id: req.body.share_route_id,
        status: 1,
        created_by: user_id,
        updated_by: user_id,
        placeId: placeId
      });
    });
    await Promise.all(promises);
    // optimise.stops.forEach(async (item,i) => {
    //   await SharedRouteStops.create({
    //     latitude: item.latitude,
    //     longitude: item.longitude,
    //     address: item.address,
    //     sequence_number: i+1,
    //     stop_user_id: (item.stop_user_id) ? item.stop_user_id : null,
    //     contact_name: (item.contact_name) ? item.contact_name : null,
    //     phone_number: (item.phone_number) ? item.phone_number : null,
    //     shared_route_id: req.body.share_route_id,
    //     status: 1,
    //     created_by: req.body.user_id,
    //     updated_by: req.body.user_id,
    //   });
    // });

    if (updateshare[0] == 1) {
      const temproute = await sequelize.query(
        `INSERT INTO temp_shared_routes (shared_route_id, route_id, parent_route_id, start_date, started_date, user_id, start_latitude, start_longitude, end_latitude, end_longitude, route_name, start_address, end_address, distance, route_status, expires_on, created_by, updated_by, createdAt, updatedAt,start_place_id,end_place_id,isRoundTrip) 
    (select shared_route_id, route_id, parent_route_id, start_date, started_date, user_id, start_latitude, start_longitude, end_latitude, end_longitude, route_name, start_address, end_address, distance, route_status, expires_on, created_by, updated_by,now(),now(),start_place_id,end_place_id,isRoundTrip from shared_routes where shared_route_id='${req.body.share_route_id}')`
      );
      await sequelize.query(
        `INSERT INTO temp_shared_stops (shared_stop_id,temp_shared_route_id,shared_route_id,latitude,longitude,address,sequence_number,contact_name,phone_number,status,created_by,updated_by,createdAt,updatedAt,placeId)
      (select shared_stop_id,'${temproute[0]}',shared_route_id,latitude,longitude,address,sequence_number,contact_name,phone_number,status,created_by,updated_by,now(),now(),placeId from shared_stops where shared_route_id=${req.body.share_route_id} and status!=0)`
      );
    }

    const title = await getTemplate("Route_started");
    const username = await User.findOne({
      where: { user_id: req.body.user_id },
      attributes: ["first_name", "last_name"],
    });
    const data =
      (await username.first_name) +
      " " +
      username.last_name +
      " " +
      title.content +
      " " +
      sharedRoutes.route_name +
      " " +
      "route";
    await sendPushNotification(title.title, data, [`${sharedRoutes.dataValues.created_by}`]);
  }

  if (req.body.route_status == "Completed" && !req.body.save) {
    if (sharedRoutes.route_status == 3) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Route has aleady been completed.");
    }

    await updateStatus(3, req.body.user_id, req.body.share_route_id, sharedRoutes.dataValues.expires_on);
    const title = await getTemplate("Route_completed");
    const username = await User.findOne({
      where: { user_id: req.body.user_id },
      attributes: ["first_name", "last_name"],
    });
    const data =
      (await username.first_name) +
      " " +
      username.last_name +
      " " +
      title.content +
      " " +
      sharedRoutes.route_name +
      " " +
      "route";
    await sendPushNotification(title.title, data, [`${sharedRoutes.dataValues.created_by}`]);
  }

  if (req.body.route_status == "Completed" && req.body.save) {
    if (sharedRoutes.route_status == 3) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Route has aleady been completed.");
    }
    const routePermissions = await sequelize.query(
      `select allow_edit from shared_route_permissions where route_id=(select parent_route_id from shared_routes where shared_route_id=${req.body.share_route_id})`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    if (routePermissions[0].allow_edit == 1) {
      const userroutenamecheck = await UserRoute.findOne({
        where: {
          created_by: req.body.user_id,
          route_name: route_name_trim,
          route_status: { [Op.ne]: 0 },
        },
      });
      const sharedRoutenamecheck = await SharedRoute.findOne({
        where: {
          shared_route_id: req.body.share_route_id,
          route_name: req.body.route_name,
        },
      });
      if (userroutenamecheck || sharedRoutenamecheck) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Route name already exists");
      }
      if (req.body.route_name == "") {
        throw new ApiError(httpStatus.BAD_REQUEST, "Rename Route");
      }
      await updateStatus(3, req.body.user_id, req.body.share_route_id, sharedRoutes.dataValues.expires_on);

      const title = await getTemplate("Route_completed");
      const username = await User.findOne({
        where: { user_id: req.body.user_id },
        attributes: ["first_name", "last_name"],
      });
      const data =
        (await username.first_name) +
        " " +
        username.last_name +
        " " +
        title.content +
        " " +
        sharedRoutes.route_name +
        " " +
        "route";
      await sendPushNotification(title.title, data, [`${sharedRoutes.dataValues.created_by}`]);

      if (!userroutenamecheck && userroutenamecheck === null && req.body.route_name != "") {
        const inprogresssharedroutes = await TempSharedRoute.findAll({
          attributes: ["temp_shared_route_id"],
          where: {
            shared_route_id: req.body.share_route_id,
            route_status: { [Op.ne]: 0 },
          },
          order: [["createdAt", "DESC"]],
          limit: 1,
        });
        const newUserRoute = await sequelize.query(
          `INSERT INTO user_routes (route_name, start_date, start_latitude, start_longitude, end_latitude, end_longitude, start_address, end_address, distance, route_status, created_by, updated_by,route_started_count, createdAt, updatedAt) 
        (select '${route_name_trim}', start_date, start_latitude, start_longitude, end_latitude, end_longitude, start_address, end_address, distance, 1,user_id,user_id,0,now(),now() from temp_shared_routes where shared_route_id=${req.body.share_route_id} and route_status != 0 order by createdAt desc limit 1)`
        );
        if (newUserRoute != "") {
          await sequelize.query(
            `INSERT INTO route_stops (route_id,latitude,longitude,address,sequence_number,contact_name,phone_number,status,created_by,updated_by, createdAt, updatedAt,placeId)  
        (select '${newUserRoute[0]}',latitude,longitude,address,sequence_number,contact_name,phone_number,1,${req.body.user_id},${req.body.user_id},now(),now(),placeId from temp_shared_stops where shared_route_id=${req.body.share_route_id} and temp_shared_route_id=${inprogresssharedroutes[0].dataValues.temp_shared_route_id} and status !=0)`
          );
          await sequelize.query(
            `INSERT INTO shared_route_permissions (user_id,route_id,allow_edit,allow_share,share_indefinitely,share_endofday,share_onehour,createdAt,updatedAt)  
        (select ${req.body.user_id},'${newUserRoute[0]}',0,0,0,0,0,now(),now())`
          );
        }
        return {
          status: "success",
          message: "Route updated successfully",
          is_updated: "true",
        };
      }
    } else {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Modifications to the route cannot be done. Please contact the route owner for permission"
      );
    }
  }
  if (req.body.route_status != "Completed") {
    const route_details = await inprogressRouteDetails(req.body.share_route_id)
    return {
      status: "success",
      message: "Route updated successfully",
      route_details: route_details.route_details,
    };
  }
  return {
    status: "success",
    message: "Route updated successfully",
  };
};

const optimizeRoute = async (req) => {
  const { shared_route_id, user_id } = req.body;
  const sharedRoutes = await SharedRoute.findOne({
    where: { shared_route_id, user_id },
  });
  if (!sharedRoutes) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid RouteId");
  }
  if (sharedRoutes.route_status === 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Route deleted.");
  }
  if (sharedRoutes.route_status === 2) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Route already in-progress.");
  }
  const allStops = await SharedRouteStops.findAll({ where: { shared_route_id, status: { [Op.ne]: 0 } } });
  if (!allStops) {
    throw new ApiError(httpStatus.BAD_REQUEST, "No stops found to optimize");
  }
  const is_optimze=req.body.is_optimize
  const { stops: optimizedStops } = await distanceService.calcDistance(req.body, allStops,is_optimze);
  for (let i = 0; i < optimizedStops.length; i++) {
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

const shareSharedRoute = async (req) => {
  try {
    const routePermissions = await sequelize.query(
      `select allow_share from shared_route_permissions where route_id=(select parent_route_id from shared_routes where shared_route_id=${req.body.shared_route_id})`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    if (routePermissions.length == 0 || routePermissions[0].allow_share == 0) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Route cannot be shared. Please contact the route owner for permission"
      );
    }
    // for (const item of req.body.shared_routes ){
    //   const user=await userService.checkActiveUser(item)
    //   if(user!=true){
    //    throw new ApiError(httpStatus.BAD_REQUEST, "Please select proper user_id");
    //   }
    //   }
    let shares = {};
    shares = await sequelize.query(
      `select distinct user_id,route_status,shared_route_id from shared_routes where route_id='${req.body.shared_route_id}' and route_status!=0 and is_expired!=1`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    sharedroute = await sharedRouteDetailsById(req.body.shared_route_id);

    routeDetails = sharedroute.shared_route_details;
    let expires_on = null;
    if (routeDetails && routeDetails != null && routeDetails != "") {
      switch (routeDetails.expires_on != null || routeDetails.start_date != null) {
        case routeDetails.start_date != null && routeDetails.start_date != "":
          expires_on = moment(new Date(routeDetails.start_date))
            .utc()
            .add(config.setexpirydate, "days")
            .format("YYYY-MM-DD HH:mm:ss");
          break;
        case routeDetails.expires_on != null && routeDetails.expires_on != "":
          expires_on = moment(new Date(routeDetails.expires_on))
            .utc()
            .add(config.setexpirydate, "days")
            .format("YYYY-MM-DD HH:mm:ss");
          break;
      }
    }
    let shared_route_id = [];
    let nonexistinguser = [];
    await Promise.all(
      req.body.shared_routes.map(async (shared_route) => {
        const phNoCheck = await User.findOne({
          where: {
            phone_number: shared_route.phone_number,
          },
        });
        if (phNoCheck) {
          shared_route_id.push(phNoCheck.user_id);
        } else {
          nonexistinguser.push(shared_route);
        }
      })
    );
    await shareInvitees(req, nonexistinguser);
    // Update and remove existing shares
    if (shares && shares != "") {
      shares.forEach(async (user) => {
        var found = shared_route_id.indexOf(user.phone_number);

        // Update existing routes only when the route is not started and not expired
        if (found != -1 && user.route_status == 1) {
          await SharedRoute.update(
            {
              route_name: routeDetails.route_name,
              start_latitude: routeDetails.start_latitude,
              start_longitude: routeDetails.start_longitude,
              start_address: routeDetails.start_address,
              end_latitude: routeDetails.end_latitude,
              end_longitude: routeDetails.end_longitude,
              end_address: routeDetails.end_address,
              start_date: routeDetails.start_date,
              // start_time: routeDetails.start_time,
              end_time: routeDetails.end_time,
              distance: routeDetails.distance,
              created_by: req.body.user_id,
              updated_by: req.body.user_id,
              expires_on: expires_on,
              route_status: 1,
            },
            { where: { phone_number: user.phone_number, shared_route_id: user.shared_route_id } }
          );
          // Remove existing stops and add
          await SharedRouteStops.destroy({
            where: { shared_route_id: user.shared_route_id },
            truncate: false,
          });
          routeDetails.shared_route_stops.forEach(async (item) => {
            let placeId = ""
            if (item.latitude !== undefined && item.latitude !== "" && item.longitude !== undefined && item.longitude !== "") {
              placeId = await distanceService.getPlaceIdFromLatLong(item.latitude, item.longitude);
            }
            else if (item.address && item.address != "") {
              placeId = await distanceService.getPlaceId(item.address)
            }
            let routeStops = await SharedRouteStops.create({
              latitude: item.latitude,
              longitude: item.longitude,
              address: item.address,
              sequence_number: item.sequence_number,
              contact_name: item.contact_name ? item.contact_name : null,
              phone_number: item.phone_number ? item.phone_number : null,
              region: item.region ? item.region : null,
              shared_route_id: user.shared_route_id,
              status: 1,
              created_by: req.body.user_id,
              updated_by: req.body.user_id,
              placeId: placeId
            });
            if (!routeStops) {
              throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Something went wrong");
            }
          });
        } else if (found == -1 && user.route_status == 1) {
          await SharedRoute.update(
            { route_status: 0 },
            { where: { route_id: routeDetails.shared_route_id, user_id: user.user_id } }
          );
          await SharedRouteStops.update({ route_status: 0 }, { where: { shared_route_id: user.shared_route_id } });
        }
      });

      req.body.shared_routes.forEach(async (to_user_id) => {
        var newShare = "";
        newShare = shares.find((o) => o.phone_number == to_user_id.phone_number);
        const userId = await User.findOne({ where: { phone_number: to_user_id.phone_number } });
        if (typeof newShare == "undefined" || newShare == "") {
          const shareRoute = {
            route_id: routeDetails.shared_route_id,
            parent_route_id: routeDetails.parent_route_id,
            route_name: routeDetails.route_name,
            start_latitude: routeDetails.start_latitude,
            start_longitude: routeDetails.start_longitude,
            start_address: routeDetails.start_address,
            end_latitude: routeDetails.end_latitude,
            end_longitude: routeDetails.end_longitude,
            end_address: routeDetails.end_address,
            start_date: routeDetails.start_date,
            // start_time: routeDetails.start_time,
            end_time: routeDetails.end_time,
            distance: routeDetails.distance,
            created_by: req.body.user_id,
            updated_by: req.body.user_id,
            expires_on: expires_on,
            user_id: userId ? userId.user_id : null,
            route_status: 1,
            phone_number: to_user_id.phone_number,
            user_name: to_user_id.name,
            email: to_user_id.email_id,
            region: to_user_id.region ? to_user_id.region : null,
          };
          let route_details = {};
          route_details = await SharedRoute.create(shareRoute);

          if (route_details) {
            routeDetails.shared_route_stops.forEach(async (item) => {
              let placeId = ""
              if (item.latitude !== undefined && item.latitude !== "" && item.longitude !== undefined && item.longitude !== "") {
                placeId = await distanceService.getPlaceIdFromLatLong(item.latitude, item.longitude);
              }
              else if (item.address && item.address != "") {
                placeId = await distanceService.getPlaceId(item.address)
              }
              let routeStops = await SharedRouteStops.create({
                latitude: item.latitude,
                longitude: item.longitude,
                address: item.address,
                sequence_number: item.sequence_number,
                contact_name: item.contact_name ? item.contact_name : null,
                phone_number: item.phone_number ? item.phone_number : null,
                region: item.region ? item.region : null,
                shared_route_id: route_details.shared_route_id,
                status: 1,
                created_by: req.body.user_id,
                updated_by: req.body.user_id,
                placeId: placeId
              });
              if (!routeStops) {
                throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Something went wrong");
              }
            });
            if (userId != null && userId != "") {
              const userIds = `${userId.user_id}`;
              const title = await getTemplate("Route_shared");
              const username = await User.findOne({
                where: { user_id: req.body.user_id },
                attributes: ["first_name", "last_name"],
              });
              const data =
                (await shareRoute.route_name) +
                " " +
                title.content +
                " " +
                username.first_name +
                " " +
                username.last_name;
              await sendPushNotification(title.title, data, [userIds]);
            }
          } else {
            throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Something went wrong");
          }
        }
      });
    } else {
      req.body.shared_routes.forEach(async (to_user_id) => {
        const userId = await User.findOne({ where: { phone_number: to_user_id.phone_number } });
        const shareRoute = {
          route_id: routeDetails.shared_route_id,
          parent_route_id: routeDetails.parent_route_id,
          route_name: routeDetails.route_name,
          start_latitude: routeDetails.start_latitude,
          start_longitude: routeDetails.start_longitude,
          start_address: routeDetails.start_address,
          end_latitude: routeDetails.end_latitude,
          end_longitude: routeDetails.end_longitude,
          end_address: routeDetails.end_address,
          start_date: routeDetails.start_date,
          // start_time: routeDetails.start_time,
          end_time: routeDetails.end_time,
          distance: routeDetails.distance,
          created_by: req.body.user_id,
          updated_by: req.body.user_id,
          expires_on: expires_on,
          user_id: userId ? userId.user_id : null,
          route_status: 1,
          phone_number: to_user_id.phone_number,
          email: to_user_id.email,
          user_name: to_user_id.name,
          region: to_user_id.region ? to_user_id.region : null,
        };
        let route_details = {};
        route_details = await SharedRoute.create(shareRoute);
        if (route_details) {
          routeDetails.shared_route_stops.forEach(async (item) => {
            let placeId = ""
            if (item.latitude !== undefined && item.latitude !== "" && item.longitude !== undefined && item.longitude !== "") {
              placeId = await distanceService.getPlaceIdFromLatLong(item.latitude, item.longitude);
            }
            else if (item.address && item.address != "") {
              placeId = await distanceService.getPlaceId(item.address)
            }
            let routeStops = await SharedRouteStops.create({
              latitude: item.latitude,
              longitude: item.longitude,
              address: item.address,
              sequence_number: item.sequence_number,
              contact_name: item.contact_name ? item.contact_name : null,
              phone_number: item.phone_number ? item.phone_number : null,
              region: item.region ? item.region : null,
              shared_route_id: route_details.shared_route_id,
              status: 1,
              created_by: req.body.user_id,
              updated_by: req.body.user_id,
              placeId: placeId
            });
            if (!routeStops) {
              throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Something went wrong");
            }
          });
          if (userId != null && userId != "") {
            const userIds = `${userId.user_id}`;
            const title = await getTemplate("Route_shared");
            const username = await User.findOne({
              where: { user_id: req.body.user_id },
              attributes: ["first_name", "last_name"],
            });
            const data =
              (await shareRoute.route_name) +
              " " +
              title.content +
              " " +
              username.first_name +
              " " +
              username.last_name;
            await sendPushNotification(title.title, data, [userIds]);
          }
        } else {
          throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Something went wrong");
        }
      });
    }
    return {
      status: "success",
      message: "Route is shared successfully",
    };
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
  }
};

const getTemplate = async (template_code) => {
  const template = await Template.findOne({
    where: { template_code: template_code },
    attributes: ["title", "content"],
  });
  if (template) {
    return template;
  }
};

const checkActiveRoutes = async (user_id) => {
  const currenttime = moment(new Date()).format("YYYY-MM-DD 00:00:00");
  const inprogressRoutes = await UserRoute.findAndCountAll({ where: { [Op.or]: [{ expires_on: null }, { expires_on: { [Op.ne]: null }, expires_on: { [Op.gte]: `${currenttime}` } }], created_by: user_id, route_status: 2 } });
  const inprogressSharedRoutes = await SharedRoute.findAndCountAll({ where: { [Op.or]: [{ expires_on: null }, { expires_on: { [Op.ne]: null }, expires_on: { [Op.gte]: `${currenttime}` } }], user_id: user_id, route_status: 2 } });
  if (inprogressRoutes.count >= 1 || inprogressSharedRoutes.count >= 1) {
    return true;
  } else return false;
};

const inprogressRouteDetails = async (shared_route_id) => {
  let shared_route_details = {};

  const sharedRoutes = await TempSharedRoute.findOne({
    where: { route_status: 2, shared_route_id: { [Op.eq]: `${shared_route_id}` } },
    attributes: [
      "temp_shared_route_id",
      "shared_route_id",
      "parent_route_id",
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
      "expires_on",
      "created_by",
      "updated_by",
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

  if (!sharedRoutes || sharedRoutes == "") {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid Shared Route Id");
  }

  const sharedRouteStops = await TempSharedRouteStops.findAll({
    attributes: [
      "shared_stop_id",
      "temp_shared_stop_id",
      "temp_shared_route_id",
      "latitude",
      "longitude",
      "address",
      "sequence_number",
      "shared_route_id",
      "placeId",
      [
        Sequelize.literal(
          'CASE WHEN status = 1 THEN "Not Started" WHEN status = 2  THEN "Completed" WHEN status = 0 THEN "Deleted" END'
        ),
        "status",
      ],
    ],
    where: {
      status: { [Op.ne]: 0 },
      shared_route_id: shared_route_id,
      temp_shared_route_id: sharedRoutes.dataValues.temp_shared_route_id,
    },
    as: "route_stops",
    required: false,
    order: [
      ['sequence_number', 'ASC'], // Sorting by sequence_number in ascending order
    ],
  });

  const user = await User.findOne({
    where: { user_id: sharedRoutes.dataValues.created_by },
    attributes: ["user_id", "first_name", "last_name", "email", "phone_number"],
  });

  shared_route_details.shared_route_id = sharedRoutes.dataValues.shared_route_id;
  // if(sharedRoutes.isRoundTrip==true){
  //   shared_route_details.isRoundTrip = [{
  //     placeId:sharedRoutes.dataValues.end_place_id,
  //     end_latitude:sharedRoutes.dataValues.end_latitude,
  //     end_longitude:sharedRoutes.dataValues.end_longitude
  //   }];
  // } 
  function inProgressRouteDetails(item, stopDetails) {
    if (item.route_status == "In-Progress" && item.isRoundTrip == false) {
      return ({
        route_stops: stopDetails,
        route_stops_v2: stopDetails
      })
    }

    if (item.route_status === "In-Progress" && item.isRoundTrip === true) {
      let object = {
        placeId: item.end_place_id,
        latitude: item.end_latitude,
        longitude: item.end_longitude,
        status: "Not Started"
      };
      let route_stops = stopDetails
      let route_stops_v2 = [...stopDetails, object]
      return ({
        route_stops,
        route_stops_v2
      })
    }

    return userRouteDetails;
  }
  shared_route_details.parent_route_id = sharedRoutes.dataValues.parent_route_id;
  shared_route_details.route_id = sharedRoutes.dataValues.route_id;
  shared_route_details.route_name = sharedRoutes.dataValues.route_name;
  shared_route_details.start_latitude = sharedRoutes.dataValues.start_latitude;
  shared_route_details.start_longitude = sharedRoutes.dataValues.start_longitude;
  shared_route_details.start_address = sharedRoutes.dataValues.start_address;
  shared_route_details.end_latitude = sharedRoutes.dataValues.end_latitude;
  shared_route_details.end_longitude = sharedRoutes.dataValues.end_longitude;
  shared_route_details.end_address = sharedRoutes.dataValues.end_address;
  shared_route_details.distance = sharedRoutes.dataValues.distance;
  shared_route_details.start_date = sharedRoutes.dataValues.start_date;
  shared_route_details.started_date = sharedRoutes.dataValues.started_date;
  shared_route_details.end_date = sharedRoutes.dataValues.end_date;
  shared_route_details.route_status = sharedRoutes.dataValues.route_status;
  shared_route_details.last_known_latitude = "";
  shared_route_details.last_known_longitude = "";
  shared_route_details.start_place_id = sharedRoutes.dataValues.start_place_id;
  shared_route_details.end_place_id = sharedRoutes.dataValues.end_place_id;
  shared_route_details.enable_keep_route = false;
  shared_route_details.created_by = sharedRoutes.dataValues.created_by;
  shared_route_details.updated_by = sharedRoutes.dataValues.updated_by;
  shared_route_details.shared_user_id = user.user_id;
  shared_route_details.shared_user_name = user.first_name + " " + user.last_name;
  shared_route_details.shared_user_email = user.email;
  shared_route_details.isRoundTrip = sharedRoutes.isRoundTrip
  shared_route_details.shared_user_phone_number = user.phone_number;
  let stopDetails = inProgressRouteDetails(sharedRoutes.dataValues, sharedRouteStops)

  shared_route_details.route_stops_v2 = stopDetails.route_stops_v2;
  shared_route_details.route_stops = stopDetails.route_stops;
  shared_route_details.expiry_days = "";

  // Keep route option enable from 28days to 30days
  if (sharedRoutes.expires_on) {
    const currentDate = moment().utc().startOf("day");
    const expiry = moment.utc(sharedRoutes?.dataValues?.expires_on, "YYYY-MM-DD").startOf("day");
    const datediff = expiry.diff(currentDate, "days");
    if (datediff >= 0 && datediff <= 2) {
      shared_route_details.enable_keep_route = true;
      shared_route_details.expiry_days = datediff;
    }
  }

  return {
    route_details: shared_route_details,
  };
};

const removeStop = async (req) => {
  const sharedRouteCheck = await SharedRoute.findOne({
    where: {
      shared_route_id: req.body.shared_route_id,
    },
  });
  if (sharedRouteCheck.route_status == 2) {
    const inprogresssharedroutes = await TempSharedRoute.findAll({
      attributes: ["temp_shared_route_id"],
      where: {
        shared_route_id: req.body.shared_route_id,
        route_status: { [Op.ne]: 0 },
      },
      order: [["createdAt", "DESC"]],
      limit: 1,
    });
    const stops = await TempSharedRouteStops.findAll({
      attributes: ["shared_stop_id", "status", "temp_shared_route_id"],
      where: {
        shared_stop_id: { [Op.in]: req.body.stop_ids },
        shared_route_id: req.body.shared_route_id,
        status: { [Op.ne]: 0 },
        temp_shared_route_id: inprogresssharedroutes[0].dataValues.temp_shared_route_id,
      },
    });
    if (stops == "" || !stops || stops.length != req.body.stop_ids.length) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Invalid RouteId or StopId");
    }
    const stopLengthCheck = await TempSharedRouteStops.findAll({
      attributes: ["shared_stop_id", "status", "temp_shared_route_id"],
      where: {
        // shared_stop_id: { [Op.in]: req.body.stop_ids },
        shared_route_id: req.body.shared_route_id,
        status: { [Op.ne]: 0 },
        temp_shared_route_id: stops[0].dataValues.temp_shared_route_id,
      },
    });
    if (stopLengthCheck.length === 1) {
      throw new ApiError(httpStatus.BAD_REQUEST, "This route has only one stop, cannot be deleted");
    }
    const stopCheck = await TempSharedRouteStops.findAll({
      where: {
        temp_shared_route_id: stops[0].dataValues.temp_shared_route_id,
        shared_route_id: req.body.shared_route_id,
        status: { [Op.ne]: 0 },
        shared_stop_id: { [Op.in]: req.body.stop_ids },
      },
    });
    const stopUpdate = await TempSharedRouteStops.update(
      {
        status: 0,
        updatedAt: now(),
        updated_by: req.body.user_id,
      },
      {
        where: {
          shared_stop_id: { [Op.in]: req.body.stop_ids },
          temp_shared_route_id: stops[0].dataValues.temp_shared_route_id,
        },
      }
    );
    const allStops = await TempSharedRouteStops.findAll({
      where: {
        shared_route_id: req.body.shared_route_id,
        status: { [Op.ne]: 0 },
        temp_shared_route_id: stops[0].dataValues.temp_shared_route_id,
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
        await TempSharedRouteStops.update(
          { sequence_number: route.sequence_number },
          {
            where: {
              temp_shared_stop_id: route.temp_shared_stop_id,
            },
          }
        );
      })
    );
    const routeDetails = await TempSharedRoute.findOne({
      where: {
        shared_route_id: req.body.shared_route_id,
        route_status: { [Op.ne]: 0 },
        temp_shared_route_id: stops[0].dataValues.temp_shared_route_id,
      },
      order: [["createdAt", "DESC"]],
      limit: 1,
    });
    const stopsList = await TempSharedRouteStops.findAll({
      where: {
        shared_route_id: req.body.shared_route_id,
        status: { [Op.ne]: 0 },
        temp_shared_route_id: stops[0].dataValues.temp_shared_route_id,
      },
    });

    let distance = await distanceService.calcDistance(routeDetails.dataValues, stopsList);
    await TempSharedRoute.update(
      {
        updatedAt: now(),
        updated_by: req.body.updated_by,
        distance: distance.distance,
      },
      {
        where: {
          shared_route_id: req.body.shared_route_id,
          temp_shared_route_id: stops[0].dataValues.temp_shared_route_id,
        },
      }
    );

    if (stopUpdate[0] != req.body.stop_ids.length) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Stops not deleted. Please contact admin.");
    }
    await emitSharedRouteDetails(req.body.shared_route_id);
    return {
      status: "Success",
      message: "Stop Has Been Removed From Route Sucessfully",
    };
  } else {
    const stops = await SharedRouteStops.findAll({
      attributes: ["shared_stop_id", "status"],
      where: {
        shared_stop_id: { [Op.in]: req.body.stop_ids },
        shared_route_id: req.body.shared_route_id,
        status: { [Op.ne]: 0 },
      },
    });
    if (stops == "" || !stops || stops.length != req.body.stop_ids.length) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Invalid RouteId or StopId");
    }
    const stopLengthCheck = await SharedRouteStops.findAll({
      attributes: ["shared_stop_id", "status"],
      where: {
        shared_route_id: req.body.shared_route_id,
        status: { [Op.ne]: 0 },
      },
    });
    if (stopLengthCheck.length === 1) {
      throw new ApiError(httpStatus.BAD_REQUEST, "This route has only one stop, cannot be deleted");
    }
    const userroutestopCheck = await SharedRouteStops.findAll({
      where: {
        shared_stop_id: { [Op.in]: req.body.stop_ids },
        shared_route_id: req.body.shared_route_id,
        status: { [Op.ne]: 0 },
      },
    });
    const stopUpdate = await SharedRouteStops.update(
      {
        status: 0,
        updatedAt: now(),
        updated_by: req.body.user_id,
      },
      {
        where: {
          shared_stop_id: { [Op.in]: req.body.stop_ids },
        },
      }
    );
    if (stopUpdate[0] != req.body.stop_ids.length) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Stops not deleted. Please contact admin.");
    }
    const allStops = await SharedRouteStops.findAll({
      where: {
        shared_route_id: req.body.shared_route_id,
        status: { [Op.ne]: 0 },
      },
    });
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
        await SharedRouteStops.update(
          { sequence_number: route.sequence_number },
          {
            where: {
              shared_stop_id: route.shared_stop_id,
              shared_route_id: route.shared_route_id,
            },
          }
        );
      })
    );
    await emitSharedRouteDetails(req.body.shared_route_id);
    return {
      status: "Success",
      message: "Stop Has Been Removed From Route Sucessfully",
    };
  }
};

const checkRouteExpiry = async (req, res) => {
  const todayDate = moment(new Date()).utc().add(15, "m").format("YYYY-MM-DD HH:mm:ss");
  const updatingIds = [];
  const shares = await sequelize.query(
    `select * from shared_routes where expires_on is not null and expires_on<="${todayDate}" and is_expired!=1 and is_updated!=1 and route_status=1`,

    { type: Sequelize.QueryTypes.SELECT }
  );
  await shares.forEach(async (item) => {
    await updatingIds.push(`${item.shared_route_id}`);
  });
  if (updatingIds.length != 0) {
    await sequelize.query(`update shared_routes set is_updated = 1 where shared_route_id in (${updatingIds}) `);

    await shares.forEach(async (userid) => {
      const title = await getTemplate("Route_expiry_remainder");
      const routename = await SharedRoute.findOne({
        where: { shared_route_id: userid.shared_route_id },
        attributes: ["route_name"],
      });

      const data = (await routename.route_name) + " " + title.content;
      await sendPushNotification(title.title, data, [`${userid.user_id}`]);
    });
  }
};
const routeExpiration = async (req, res) => {
  const todayDate = moment(new Date()).utc().format("YYYY-MM-DD HH:mm:ss");

  const updatingIds = [];
  const routeExpired = await sequelize.query(
    `select * from shared_routes where expires_on is not null and expires_on<="${todayDate}" and is_expired!=1 and is_updated=1 and route_status=1`,

    { type: Sequelize.QueryTypes.SELECT }
  );
  await routeExpired.forEach(async (item) => {
    await updatingIds.push(`${item.shared_route_id}`);
  });
  if (updatingIds.length != 0) {
    await sequelize.query(`update shared_routes set is_expired=1 where shared_route_id in (${updatingIds}) `);

    await routeExpired.forEach(async (userid) => {
      const title = await getTemplate("Route_expired");
      const routename = await SharedRoute.findOne({
        where: { shared_route_id: userid.shared_route_id },
        attributes: ["route_name", "created_by"],
      });
      const ownername = await User.findOne({
        where: { user_id: routename.created_by },
        attributes: ["first_name", "last_name"],
      });
      const data =
        (await routename.route_name) + " " + title.content + " " + ownername.first_name + " " + ownername.last_name;
      await sendPushNotification(title.title, data, [`${userid.user_id}`]);
    });
  }
};

const updateStatus = async (route_status, user_id, shared_route_id, expires_on) => {
  // check for shared indefinetly if true than set status as 1
  const routePermissions = await sequelize.query(
    `select share_indefinitely,share_endofday from shared_route_permissions where route_id=(select parent_route_id from shared_routes where shared_route_id=${shared_route_id})`,
    { type: Sequelize.QueryTypes.SELECT }
  );
  let sharedRouteStatus = route_status;
  if (
    routePermissions[0].share_indefinitely === 1 ||
    (routePermissions[0].share_endofday === 1 && expires_on && moment().isSameOrBefore(expires_on))
  ) {
    sharedRouteStatus = 1;
  }
  await SharedRoute.update(
    {
      route_status: sharedRouteStatus,
      end_date: now(),
      updatedAt: now(),
      updated_by: user_id,
      isRoundTrip: false
    },
    {
      where: {
        shared_route_id: shared_route_id,
      },
    }
  );
  const routeDetails = await TempSharedRoute.findAll({
    where: {
      shared_route_id: shared_route_id,
      route_status: { [Op.ne]: 0 },
    },
    order: [["createdAt", "DESC"]],
    limit: 1,
  });
  await TempSharedRoute.update(
    {
      route_status: route_status,
      end_date: now(),
      updatedAt: now(),
      updated_by: user_id,
    },
    {
      where: {
        temp_shared_route_id: routeDetails[0].dataValues.temp_shared_route_id,
        route_status: { [Op.ne]: 0 },
      },
    }
  );
};
//updating shared route stop status
const updateStopStatus = async (req) => {
  const inprogresssharedroutes = await TempSharedRoute.findAll({
    attributes: ["temp_shared_route_id"],
    where: {
      shared_route_id: req.body.shared_route_id,
      route_status: { [Op.ne]: 0 },
    },
    order: [["createdAt", "DESC"]],
    limit: 1,
  });

  if (!inprogresssharedroutes || inprogresssharedroutes == "") {
    throw new ApiError(httpStatus.BAD_REQUEST, "Incorrect RouteId.Route is not yet started.");
  }

  update = {};
  if (req.body.stop_status && req.body.stop_status != "") {
    switch (req.body.stop_status) {
      case "Inprogress":
        update.stop_status = 1;
        break;
      case "Completed":
        update.stop_status = 2;
        break;
      case "Deleted":
        update.stop_status = 0;
        break;
    }
  }
  const routeStopsnumcheck = await TempSharedRouteStops.findAll({
    where: {
      temp_shared_stop_id: { [Op.in]: req.body.temp_shared_stop_id },
      shared_route_id: req.body.shared_route_id,
      temp_shared_route_id: inprogresssharedroutes[0].dataValues.temp_shared_route_id,
    },
  });
  if (!routeStopsnumcheck || routeStopsnumcheck == "") {
    throw new ApiError(httpStatus.BAD_REQUEST, "Incorrect RouteId and RouteStopId");
  }
  let updatestops = [];
  await routeStopsnumcheck.forEach(async (item) => {
    if (item.status == 1) updatestops.push(item.temp_shared_stop_id);
  });
  if (updatestops.length > 0) {
    await TempSharedRouteStops.update(
      {
        status: update.stop_status,
        updated_by: req.body.user_id,
        updatedAt: now(),
      },
      {
        where: {
          temp_shared_stop_id: { [Op.in]: updatestops },
          temp_shared_route_id: inprogresssharedroutes[0].dataValues.temp_shared_route_id,
        },
      }
    );
  }
  const route_details = await inprogressRouteDetails(req.body.shared_route_id)
  //emitting live location of the user
  await emitSharedRouteDetails(req.body.shared_route_id);
  return {
    status: "success",
    message: "Stop updated successfully",
    route_details
  };
};
//deleteing the shared route
const deleteSharedRoute = async (req) => {
  const sharedroute = await SharedRoute.findOne({
    where: {
      shared_route_id: req.body.shared_route_id,
      user_id: req.body.user_id,
    },
  });
  if (!sharedroute || sharedroute == "") {
    throw new ApiError(httpStatus.BAD_REQUEST, "Incorrect UserId or SharedRouteId");
  }
  //soft delete in the db
  await SharedRoute.update(
    {
      route_status: 0,
      updatedAt: now(),
      updated_by: req.body.user_id,
    },
    {
      where: {
        shared_route_id: req.body.shared_route_id,
        user_id: req.body.user_id,
      },
    }
  );
  return {
    status: "success",
    message: "Route deleted successfully",
  };
};
//edit start date api for shared routes
const editStartDate = async (req) => {
  const editstartdatecheck = await SharedRoute.findOne({
    where: {
      shared_route_id: req.query.shared_route_id,
      user_id: req.query.user_id,
    },
  });
  if (editstartdatecheck.route_status == 2) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Route is in Inprogress start date cannot be modified");
  }
  if (editstartdatecheck.route_status == 3) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Route has been completed start date cannot be modified");
  }
  //checking edit start date permissions in shared route permission table
  const permissioncheck = await SharedRoutePermission.findOne({
    where: {
      route_id: editstartdatecheck.parent_route_id,
      edit_startdate: 1,
    },
  });
  if (!permissioncheck || permissioncheck == "") {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "This route date cannot be edited.Please contact the route owner for permission."
    );
  }
  if (editstartdatecheck.is_expired == true) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Route has been already expired");
  }
  if (editstartdatecheck.expires_on && editstartdatecheck.expires_on < req.query.start_date) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Start date is greater than the route expiry date");
  }
  const date = moment(req.body.start_date).add(config.setexpirydate, "days").format("YYYY-MM-DD HH:mm:ss");
  await SharedRoute.update(
    {
      start_date: req.query.start_date,
      expires_on: date,
    },
    { where: { shared_route_id: req.query.shared_route_id } }
  );
  return {
    status: "success",
    message: "Date Updated Successfully",
  };
};
//cron for shared route expiry check on 28 day of the shared route
const sharedRouteExpiration = async () => {
  const startDate = moment().utc().add(2, "days").startOf("hour").format("YYYY-MM-DD HH:mm:ss");
  const EndDate = moment().utc().add(2, "days").endOf("hour").format("YYYY-MM-DD HH:mm:ss");
  const userRouteExpirationCheck = await sequelize.query(
    `SELECT * FROM shared_routes
  WHERE ( expires_on IS NOT NULL AND (is_expired !=1 AND expires_on >= '${startDate}' AND expires_on < '${EndDate}' AND route_status!=0));`,
    { type: Sequelize.QueryTypes.SELECT }
  );
  if (userRouteExpirationCheck.length) {
    await Promise.all(
      userRouteExpirationCheck.map(async (route) => {
        const title = await getTemplate("Route_remainder");
        const data = (await route.route_name) + " " + title.content;
        await sendPushNotification(title.title, data, [`${route.user_id}`]);
      })
    );
  }
};
//extending the shared route for next 30 days
const keepSharedRoute = async (req) => {
  const sharedroutes = await SharedRoute.findAll({ where: { shared_route_id: req.query.shared_route_id } });
  if (req.query.keep_route && req.query.keep_route == true) {
    const currentDate = moment().utc().startOf("day");
    const expiry = moment.utc(sharedroutes[0].expires_on, "YYYY-MM-DD").startOf("day");
    const datediff = expiry.diff(currentDate, "days");
    if (datediff >= 0 && datediff <= 2) {
      const date = moment(sharedroutes[0].expires_on).add(config.setexpirydate, "days").format("YYYY-MM-DD HH:mm:ss");
      await SharedRoute.update(
        {
          expires_on: date,
          updated_by: req.query.user_id,
        },
        { where: { shared_route_id: req.query.shared_route_id } }
      );
      return {
        status: "success",
        message: "Date Updated Successfully",
      };
    }
  }
};
// sharing live location of the driver to user
const emitSharedRouteDetails = async (shared_route_id) => {
  const { shared_route_details } = await sharedRouteDetailsById(shared_route_id);
  emitSharedRoute(shared_route_id, shared_route_details);
};

module.exports = {
  sharedRoutesByFromUserId,
  sharedRoutesByToUserId,
  // getAllSharedRoute,
  createSharedRoute,
  sharedRouteDetailsById,
  editSharedRoute,
  updateRouteStatus,
  shareSharedRoute,
  inprogressRouteDetails,
  removeStop,
  updateStatus,
  checkRouteExpiry,
  routeExpiration,
  updateStopStatus,
  deleteSharedRoute,
  editStartDate,
  sharedRouteExpiration,
  keepSharedRoute,
  optimizeRoute,
};
