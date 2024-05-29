const Sequelize = require("sequelize");
const { Op } = Sequelize;
const db = require("../../../models");
const ApiError = require("../../../utils/ApiError");
const httpStatus = require("http-status");
const paginate = require('../../../utils/paginate');
const { response } = require("../../../app");
const Invitees = db.invitees;
const users = db.user;
const config = require("../../../config/config");
const { sendInvitationMail } = require("../../../services/email.service");

const env = config.env;
const accountSid =config.twilio.sid;
const authToken = config.twilio.authToken;
const twilioMobileNumber = config.twilio.mobileNumber;

const createInvitees = async (req) => {
  try {
    let data = req.body.users;
    let invitedUser = {};
    var res = {};
    const invitedBy = await users.findOne({ where: { user_id: { [Op.eq]: `${req.body.invited_by}` } } });
    if (invitedBy) {
      invitedUser = invitedBy.dataValues.first_name + " " + invitedBy.dataValues.last_name;
      await Promise.all(data.map(async (obj) => {
        const phoneNumber = (env == "development") ? "+91"+obj.invitees_mobile_number : "+1"+obj.invitees_mobile_number;
        const activeUser = await users.findAll({
          where: { phone_number: { [Op.eq]: `${phoneNumber}` } }
        });
        if (activeUser.length == 0) {
          await Invitees.create({
            name: obj.invitees_name,
            mobile_number: phoneNumber,
            email_address: obj.invitees_email_address,
            other_invitee_details: obj.other_invitee_details,
            invited_by: req.body.invited_by,
            is_registered: false
          }).then(async response => {
            const client = require('twilio')(accountSid, authToken);
            const link = "http://www.urlane.com"
            const message = "Hello, " + invitedUser + " is inviting you to install the URLane app. Here is the link: " + link;
            await client.messages
              .create({
                body: message,
                from: twilioMobileNumber,
                to: phoneNumber
              })
              .then(async message => {
                res = {
                  status: "success",
                  message: "Users has been invited successfully"
                };
              }
              );
          });


        }
        else {
          res = { status: "success", message: "Users has been invited successfully" };
        }

      }))
      return (res);
    }
    else{
      return { status: "failed", message: "Something went wrong. Please contact admin. " + e };
    }

    
  } catch (e) {
    return { status: "failed", message: "Something went wrong. Please contact admin. " + e };
  }

};

const shareInvitees = async (req,nonexistinguser) => {
  try {
    let data = req.body;
    let invitedUser = {};
    var res = {};
    const invitedBy = await users.findOne({ where: { user_id: { [Op.eq]: `${data.user_id}` } } });
    if (invitedBy) {
      invitedUser = invitedBy.dataValues.first_name + " " + invitedBy.dataValues.last_name;
      await Promise.all(nonexistinguser.map(async (obj) => {
        const phoneNumber = (env == "development") ? "+91"+obj.phone_number : "+1"+obj.phone_number;
        const activeUser = await users.findAll({
          where: { phone_number: { [Op.eq]: `${phoneNumber}` } }
        });
        if (activeUser.length == 0) {
          if(obj.email_id)
          await sendInvitationMail(invitedBy,obj);
            const client = require('twilio')(accountSid, authToken);
            const link = "https://www.urlane.com"
            const message = "Hello, " + invitedUser + " shared a route with you on URLane. Please click the link to start your journey on the URLane app! " + link;
           const messages= await client.messages
              .create({
                body: message,
                from: twilioMobileNumber,
                to: phoneNumber
              })
        }

      }))
      return{status: "success", message: "Users has been invited successfully" };
    }
    else{
      return { status: "failed", message: "Something went wrong. Please contact admin. " + e };
    }

    
  } catch (e) {
    return { status: "failed", message: "Something went wrong. Please contact admin. " + e };
  }

};



module.exports = {
  createInvitees,
  shareInvitees
};
