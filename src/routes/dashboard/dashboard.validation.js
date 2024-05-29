const Joi = require("joi");


const getUserRouteDetails = {
    query: Joi.object().keys({
        page:Joi.string().required(),  
        size:Joi.string().required(), 
        sortType:Joi.string().optional().allow("", null), 
        sortBy:Joi.string().optional().allow("", null), 
        search:Joi.string().optional().allow("", null), 
        route_name:Joi.string().optional().allow("", null), 
      route_status: Joi.string().optional()
        .valid("Not Started", "Started", "Completed").allow("", null),
    }),
  };


const getUserList = {
  query: Joi.object().keys({
    page: Joi.string().required(),
    size: Joi.string().required(),
    sortType: Joi.string().optional().allow("", null),
    sortBy: Joi.string().optional().allow("", null),
    search: Joi.string().optional().allow("", null),
    email: Joi.string().optional().allow("", null)
  }),
};  
module.exports = {
  getUserRouteDetails,
  getUserList
};
