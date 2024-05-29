const Joi = require("joi");

const createInvitees = {
  body: Joi.object().keys({
    invited_by:Joi.number().required(),
    users: Joi.array().items({
      invitees_name: Joi.string().required(),
      invitees_mobile_number: Joi.string().required(),
      invitees_email_address: Joi.string().optional().allow("",null),
      other_invitee_details:Joi.any(),
    }),

  }),
};



module.exports = {
  createInvitees
};
