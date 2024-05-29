const { JSONInputFilterSensitiveLog } = require("@aws-sdk/client-s3");
const { string } = require("joi");
const Joi = require("joi");

const createRoute = {
  body: Joi.object().keys({
    user_id: Joi.number().required(),
    route_name: Joi.string().required(),
    start_latitude: Joi.string().optional().allow("", null),
    start_longitude: Joi.string().optional().allow("", null),
    start_address: Joi.string().optional().allow("", null),
    end_latitude: Joi.string().optional().allow("", null),
    end_longitude: Joi.string().optional().allow("", null),
    end_address: Joi.string().optional().allow("", null),
    start_date: Joi.string().optional().allow("", null),
    // start_time: Joi.string().optional().allow("", null),
    end_time: Joi.string().optional().allow("", null),
    //distance: Joi.string().required(),
    route_stops: Joi.array().items({
      latitude: Joi.string().optional().allow("", null),
      longitude: Joi.string().optional().allow("", null),
      address: Joi.string().optional().allow("", null),
      sequence_number: Joi.string().required(),
      stop_user_id: Joi.number().optional().allow("", null),
      contact_name: Joi.string().optional().allow("", null),
      email: Joi.string().optional().allow("", null),
      phone_number: Joi.string().optional().allow("", null),
    }),
    // share_permissions: Joi.object().keys({
    //   allow_edit: Joi.boolean().optional().allow("", null),
    //   allow_share: Joi.boolean().optional().allow("", null),
    //   share_indefinitely: Joi.boolean().optional().allow("", null),
    //   share_endofday: Joi.boolean().optional().allow("", null),
    //   share_onehour: Joi.boolean().optional().allow("", null),
    // }),
    // shared_routes: Joi.array().items(Joi.number()).optional()
  }),
};

const editRoute = {
  body: Joi.object().keys({
    route_id: Joi.number().required(),
    user_id: Joi.number().required(),
    route_name: Joi.string().required(),
    start_latitude: Joi.string().optional().allow("", null),
    start_longitude: Joi.string().optional().allow("", null),
    start_address: Joi.string().optional().allow("", null),
    end_latitude: Joi.string().optional().allow("", null),
    end_longitude: Joi.string().optional().allow("", null),
    end_address: Joi.string().optional().allow("", null),
    start_date: Joi.date().optional().allow("", null),
    // start_time: Joi.string().optional().allow("", null),
    end_time: Joi.string().optional().allow("", null),
    // is_optimize: Joi.boolean().optional().allow("", null),
    route_stops: Joi.array()
      .required()
      .items({
        latitude: Joi.string().required().allow("", null),
        longitude: Joi.string().required().allow("", null),
        address: Joi.string().required().allow("", null),
        sequence_number: Joi.number().required(),
        stop_user_id: Joi.number().optional().allow("", null),
        contact_name: Joi.string().optional().allow("", null),
        email: Joi.string().optional().allow("", null),
        phone_number: Joi.string().optional().allow("", null),
      }),
    share_permissions: Joi.object().keys({
      allow_edit: Joi.boolean().optional().allow("", null),
      allow_share: Joi.boolean().optional().allow("", null),
      share_indefinitely: Joi.boolean().optional().allow("", null),
      share_endofday: Joi.boolean().optional().allow("", null),
      share_onehour: Joi.boolean().optional().allow("", null),
      edit_startdate: Joi.boolean().optional().allow("", null),
    }),
    shared_routes: Joi.array()
      .items(
        Joi.object({
          phone_number: Joi.string().required(),
          email_id: Joi.string().email().optional().allow("", null),
          name: Joi.string().required(),
          region: Joi.string().optional().allow("", null),
        })
      )
      .optional(),
  }),
};

const userRouteById = {
  query: Joi.object().keys({
    user_id: Joi.string().required(),
    route_status: Joi.string().required().valid("Inprogress", "Completed", "Upcoming", "Inprogress,Upcoming"),
    route_name: Joi.string().optional().allow("", null),
  }),
};

const addRouteStop = {
  body: Joi.object().keys({
    user_id: Joi.number().required(),
    route_id: Joi.number().required(),
    route_stops: Joi.array()
      .required()
      .items({
        user_name: Joi.string().optional().allow("", null),
        email: Joi.string().optional().allow("", null),
        phone_number: Joi.string().optional().allow("", null),
        latitude: Joi.string().required(),
        longitude: Joi.string().required(),
        address: Joi.string().optional().allow("", null),
        sequence_number: Joi.string().required(),
        stop_user_id: Joi.string().optional().allow("", null),
      }),
  }),
};

const routeDetailsById = {
  query: Joi.object().keys({
    route_id: Joi.string().required(),
  }),
};

const getStopsByRouteId = {
  query: Joi.object().keys({
    route_id: Joi.string().required(),
  }),
};
const optimizeRoute = {
  body: Joi.object().keys({
    shared_route_id: Joi.number().optional().allow("", null),
    route_id: Joi.number().optional().allow("", null),
    user_id: Joi.number().required(),
    start_longitude: Joi.string().required(),
    start_latitude: Joi.string().required(),
    start_address: Joi.string().optional().allow("", null),
    end_latitude: Joi.string().allow("", null),
    end_longitude: Joi.string().allow("", null),
    end_address: Joi.string().optional().allow("", null),
    is_optimize:Joi.boolean().required()
  }),
};
const updateRouteStatus = {
  body: Joi.object().keys({
    route_id: Joi.number().required(),
    user_id: Joi.number().required(),
    isRoundTrip:Joi.boolean().optional().allow("", null),
    route_status: Joi.string().required().valid("Started", "Completed"),
    start_latitude: Joi.string().when("route_status", {
      is: "Started",
      then: Joi.required(),
      otherwise: Joi.optional().allow("", null),
    }),
    start_longitude: Joi.string().when("route_status", {
      is: "Started",
      then: Joi.required(),
      otherwise: Joi.optional().allow("", null),
    }),
    start_address: Joi.string().optional().allow("", null),
    end_latitude: Joi.string().when("route_status", {
      is: "Started",
      then: Joi.required(),
      otherwise: Joi.optional().allow("", null),
    }),
    end_longitude: Joi.string().when("route_status", {
      is: "Started",
      then: Joi.required(),
      otherwise: Joi.optional().allow("", null),
    }),
    end_address: Joi.string().optional().allow("", null),
    user_route_log_id: Joi.number().optional().allow("", null),
    is_optimize: Joi.boolean().optional().allow("", null),
    route_stops: Joi.array().items({
      latitude: Joi.string().optional().allow("", null),
      longitude: Joi.string().optional().allow("", null),
      address: Joi.string().optional().allow("", null),
      sequence_number: Joi.number().required(),
      stop_user_id: Joi.number().optional().allow("", null),
      contact_name: Joi.string().optional().allow("", null),
      email: Joi.string().optional().allow("", null),
      phone_number: Joi.string().optional().allow("", null),
      route_stop_id: Joi.number().optional().allow("", null),
      status: Joi.string().optional().allow("", null),
      user_id: Joi.string().optional().allow("", null),
      placeId:Joi.string().optional().allow("", null),
    }),
  }),
};

const removeStop = {
  body: Joi.object().keys({
    stop_ids: Joi.array().required(),
    route_id: Joi.string().required(),
  }),
};

const deleteRoute = {
  body: Joi.object().keys({
    user_id: Joi.string().required(),
    user_route: Joi.array().required(),
  }),
};

const updateStopStatus = {
  body: Joi.object().keys({
    route_id: Joi.number().required(),
    route_stops_log_id: Joi.array().required(),
    stop_status: Joi.string().required().valid("Inprogress", "Reached", "Deleted"),
    user_id: Joi.number().required(),
  }),
};

const deleteStop = {
  body: Joi.object().keys({
    route_stops_log_id: Joi.number().optional().allow("", null),
    user_route_id: Joi.number().required(),
    route_stop_id: Joi.number().required(),
  }),
};

const homeScreen = {
  query: Joi.object().keys({
    user_id: Joi.number().required(),
    route_name: Joi.string().optional().allow("", null),
    offset: Joi.number().required(),
    limit: Joi.number().required(),
    sortBy: [Joi.string(), Joi.allow(null)],
    sortType: [Joi.string(), Joi.allow(null)],
  }),
};
const recentRoutes = {
  query: Joi.object().keys({
    user_id: Joi.number().required(),
    page: Joi.number().optional(),
    size: Joi.number().optional(),
    route_name: Joi.string().optional().allow("", null),
  }),
};

const checkRouteName = {
  query: Joi.object().keys({
    user_id: Joi.number().required(),
    route_name: Joi.string().required(),
  }),
};

const keepUserRoute = {
  query: Joi.object()
    .keys({
      user_id: Joi.number().required(),
      route_id: Joi.number().allow("", null),
      shared_route_id: Joi.when("route_id", { is: "", then: Joi.number(), otherwise: Joi.number().allow("", null) }),
      keep_route: Joi.boolean().allow("", null),
    })
    .or("shared_route_id", "route_id"),
};

module.exports = {
  createRoute,
  editRoute,
  userRouteById,
  addRouteStop,
  routeDetailsById,
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
  keepUserRoute,
};
