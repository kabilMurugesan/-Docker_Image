const { JSONInputFilterSensitiveLog } = require("@aws-sdk/client-s3");
const Joi = require("joi");

const createAddress = {
  body: Joi.object().keys({
    user_id: Joi.number().required(),
    latitude: Joi.string().optional().allow("", null),
    longitude: Joi.string().optional().allow("", null),
    address: Joi.string().optional().allow("", null),
    city: Joi.string().optional().allow("", null),
    state: Joi.string().optional().allow("", null),
    zipcode: Joi.string().optional().allow("", null)
  })
};

const updateAddress = {
  body: Joi.object().keys({
    user_id: Joi.number().required(),
    user_address_id: Joi.number().required(),
    latitude: Joi.string().optional().allow("", null),
    longitude: Joi.string().optional().allow("", null),
    address: Joi.string().optional().allow("", null),
    city: Joi.string().optional().allow("", null),
    state: Joi.string().optional().allow("", null),
    zipcode: Joi.string().optional().allow("", null)
  })
};

const getAddress = {
  query: Joi.object().keys({
    user_id: Joi.number().required()
  })
}

const updateUserprofile = {
  body: Joi.object().keys({
    user_id: Joi.number().required(),
    first_name:Joi.string().required(),
    last_name:Joi.string().required(),
    phone_number:Joi.string().required(),
    profile_pic: Joi.string().optional().allow("", null),
  })
};

const userDetails = {
  query: Joi.object().keys({
    user_id: Joi.string().required(),
  }),
};

const getContactList={
  query: Joi.object().keys({
    user_id: Joi.string().required(),
    user_name:Joi.string().optional().allow("", null),
  }),
}

const getUserList = {
  query: Joi.object().keys({
    page: Joi.string().required(),
    size: Joi.string().required(),
    sortType: Joi.string().optional().allow("", null),
    sortBy: Joi.string().optional().allow("", null),
  }),
};

const userRouteDetails = {
  query: Joi.object().keys({
    user_id: Joi.string().required(),
    route_status:Joi.string().optional().valid( "Not Started", "Inprogress", "Completed", "Deleted").allow("", null),
    name:Joi.string().optional().allow("", null),
    size:Joi.number().required().less(11),
    page:Joi.number().required(),
    sortBy:Joi.string().optional().allow("", null),
    sortType:Joi.string().optional().allow("", null),
  }),
};
const deleteUserAccount = {
  body: Joi.object().keys({
    user_id: Joi.number().required()
  }),
}


const activateuseraccount={
  body:Joi.object().keys({
    user_id:Joi.number().required()
  })
}

module.exports = {
  createAddress,
  updateAddress,
  getAddress,
  updateUserprofile,
  userDetails,
  getContactList,
  getUserList,
  userRouteDetails,
  deleteUserAccount,
  activateuseraccount
};