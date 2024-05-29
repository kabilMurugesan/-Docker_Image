const nodemailer = require("nodemailer");
const config = require("../config/config");
const logger = require("../config/logger");

const transport = nodemailer.createTransport(config.email.smtp);
/* istanbul ignore next */
if (config.env !== "test") {
  transport
    .verify()
    .then(() => logger.info("Connected to email server"))
    .catch(() =>
      logger.warn(
        "Unable to connect to email server. Make sure you have configured the SMTP options in .env"
      )
    );
}

/**
 * Send an email
 * @param {string} to
 * @param {string} subject
 * @param {string} text
 * @returns {Promise}
 */
const sendEmail = async (to, subject, text) => {
  const msg = { from: config.email.from, to, subject, text };
  return await transport.sendMail(msg);
};

/**
 * Send OTP in email to reset password
 * @param {string} to
 * @param {string} OTP
 * @param {string} user
 * @returns {Promise}
 */
const sendWelcomeMail = async (user) => {
  const subject = 'Welcome to URLane';
  const text = `
   Hi ${user.first_name} ${user.last_name},
    
    We are happy to see you at URLane! ${user.auth_code} is your verification code.

  Team URLane.`
  await sendEmail(user.email, subject, text);
};

/**
 * Send OTP in email to reset password
 * @param {string} to
 * @param {string} OTP
 * @returns {Promise}
 */
 const sendOtpEmail = async (user, OTP,msg) => {
  const subject = 'URLane - Verification Code';
  const text = `Dear ${user.first_name} ${user.last_name},

  ${OTP} ${msg}


  Team URLane.`;
  await sendEmail(user.email, subject, text);
};

const sendInvitationMail=async(user,obj) => {
  const subject = 'URLane - Invitation';
  const link = 'http://www.urlane.com';
  const text = `Hello ,\n\n${user.dataValues.first_name} ${user.dataValues.last_name} shared a route with you on URLane. Please click the link to start your journey on the URLane app! ${link}\n\nTeam URLane.`;
  await sendEmail(obj.email_id, subject, text);
  // await sendEmail(user.email, subject, text);
}

module.exports = {
  sendEmail,
  sendOtpEmail,
  sendWelcomeMail,
  sendInvitationMail
};
