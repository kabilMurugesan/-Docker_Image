const Joi = require("joi");


const password = (value, helpers) => {
  if (value.length < 8) {
    return helpers.message("password must be at least 8 characters");
  }
  if (!value.match(/\d/) || !value.match(/[a-zA-Z]/)) {
    return helpers.message(
      "password must contain at least 1 letter and 1 number"
    );
  }
  return value;
};

const adminLogin = {
    body: Joi.object().keys({
        email: Joi.string().required(),
        password: Joi.string().required()
    }),
};

const adminRefreshTokens = {
    body: Joi.object().keys({
        refreshToken: Joi.string().required(),
    }),
};

const adminLogout = {
    body: Joi.object().keys({
        refreshToken: Joi.string().required()
    }),
};

const userDetails = {
    query: Joi.object().keys({
        user_id: Joi.string().required(),
    }),
};

const routeDetailsById = {
    query: Joi.object().keys({
        route_id: Joi.string().required(),
    }),
};

const userRouteDetails = {
    query:Joi.object().keys({
        user_id: Joi.string().required(),
        route_status: Joi.string().optional().valid("Not Started", "Inprogress", "Completed", "Deleted").allow("", null),
        name: Joi.string().optional().allow("", null),
        size: Joi.number().required().less(11),
        page: Joi.number().required(),
        sortBy: Joi.string().optional().allow("", null),
        sortType: Joi.string().optional().allow("", null),
    })
}

const resetPassword = {
  body: Joi.object().keys({
    email: Joi.string().email().required(),
    newPassword: Joi.string().required().custom(password),
    confirmNewPassword: Joi.string().required().custom(password),
  }),
};

module.exports = {
    adminLogin,
    adminRefreshTokens,
    adminLogout,
    userDetails,
    routeDetailsById,
    userRouteDetails,
    resetPassword
};