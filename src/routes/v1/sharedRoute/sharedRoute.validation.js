const Joi = require("joi");
const sharedRoutesByFromUserId = {
  query: Joi.object().keys({
    FromUserId: Joi.number().required(),
  }),
};
const sharedRoutesByToUserId = {
  query: Joi.object().keys({
    ToUserId: Joi.number().required(),
  }),
};
const createSharedRoute = {
  body: Joi.object().keys({
    UserId: Joi.number().required(),
    RouteId: Joi.number().required(),
    share_route: Joi.array().required().items({
      UserName: Joi.string().required(),
      UserEmail: Joi.string().required(),
      UserNumber: Joi.string().required(),
    }),
  }),
};
const sharedRouteDetailsById = {
  query: Joi.object().keys({
    shared_route_id: Joi.number().required(),
  }),
};

const editSharedRoute = {
  body: Joi.object().keys({
    route_id: Joi.number().optional().allow("", null),
    parent_route_id: Joi.number().required(),
    shared_route_id: Joi.number().required(),
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
    route_stops: [Joi.array().required()],
    share_permissions: Joi.object().keys({
      allow_edit: Joi.boolean().optional().allow("", null),
      allow_share: Joi.boolean().optional().allow("", null),
      share_indefinitely: Joi.boolean().optional().allow("", null),
      share_endofday: Joi.boolean().optional().allow("", null),
      share_onehour: Joi.boolean().optional().allow("", null),
    }),
    shared_routes: Joi.array().items(Joi.number()).optional(),
  }),
};

const updateRouteStatus = {
  body: Joi.object().keys({
    share_route_id: Joi.number().required(),
    user_id: Joi.number().required(),
    isRoundTrip:Joi.boolean().optional().allow("", null),
    route_name: Joi.string().optional().allow("", null),
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
    save: Joi.boolean().optional().allow("", null),
    is_optimize: Joi.boolean().optional().allow("", null),
    route_stops: Joi.array().items({
      latitude: Joi.string().optional().allow("", null),
      longitude: Joi.string().optional().allow("", null),
      address: Joi.string().optional().allow("", null),
      sequence_number: Joi.number().required(),
      shared_route_id: Joi.number().optional().allow("", null),
      contact_name: Joi.string().optional().allow("", null),
      email: Joi.string().optional().allow("", null),
      phone_number: Joi.string().optional().allow("", null),
      shared_stop_id: Joi.number().optional().allow("", null),
      status: Joi.string().optional().allow("", null),
      stop_type: Joi.number().optional().allow("", null),
      user_id: Joi.string().optional().allow("", null),
      placeId: Joi.string().optional().allow("", null)
    }),
  }),
};

const shareSharedRoute = {
  body: Joi.object().keys({
    shared_route_id: Joi.number().required(),
    user_id: Joi.number().required(),
    shared_routes: Joi.array()
      .min(1)
      .items(
        Joi.object({
          phone_number: Joi.string().required().messages({
            "any.required": "phone_number is required.",
          }),
          email_id: Joi.string().email().optional().allow("", null),
          region: Joi.string().optional().allow("", null),
          name: Joi.string().required().messages({
            "any.required": "name is required.",
          }),
        })
      )
      .required()
      .messages({
        "array.min":
          '"shared_routes" must contain an item of object phone_number(required),email_id(optional),name(required).',
      }),
  }),
};

const inprogressRouteDetails = {
  query: Joi.object().keys({
    shared_route_id: Joi.number().required(),
  }),
};

const removeStop = {
  body: Joi.object().keys({
    stop_ids: Joi.array().required(),
    shared_route_id: Joi.number().required(),
    start_latitude: Joi.string().optional(),
    start_longitude: Joi.string().optional(),
    start_address: Joi.string().optional(),
    end_latitude: Joi.string().optional(),
    end_longitude: Joi.string().optional(),
    end_address: Joi.string().optional(),
  }),
};

const updateStopStatus = {
  body: Joi.object().keys({
    shared_route_id: Joi.number().required(),
    temp_shared_stop_id: Joi.array().required(),
    stop_status: Joi.string().required().valid("Inprogress", "Completed", "Deleted"),
    user_id: Joi.number().required(),
  }),
};

const deleteSharedRoute = {
  body: Joi.object().keys({
    shared_route_id: Joi.number().required(),
    user_id: Joi.number().required(),
  }),
};

const editStartDate = {
  query: Joi.object().keys({
    user_id: Joi.number().required(),
    shared_route_id: Joi.number().required(),
    start_date: Joi.date().required(),
  }),
};

module.exports = {
  sharedRoutesByFromUserId,
  sharedRoutesByToUserId,
  createSharedRoute,
  sharedRouteDetailsById,
  editSharedRoute,
  updateRouteStatus,
  shareSharedRoute,
  inprogressRouteDetails,
  removeStop,
  updateStopStatus,
  deleteSharedRoute,
  editStartDate,
};
