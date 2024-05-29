const dotenv = require("dotenv");
const path = require("path");
const Joi = require("joi");
dotenv.config({ path: path.join(__dirname, "../../.env") });
const envVarsSchema = Joi.object()
  .keys({
    NODE_ENV: Joi.string()
      .valid("production", "development", "test", "local", "stage")
      .required(),
    PORT: Joi.number().default(3000),
    DB_HOST: Joi.string().required().description("MySQL DB url"),
    DB_PORT: Joi.string().required().description("MYSQL database port"),
    DB_DATABASE: Joi.string().required().description("MYSQL database name"),
    DB_USERNAME: Joi.string().required().description("username for mysql"),
    SMTP_HOST: Joi.string().description("server that will send the emails"),
    SMTP_PORT: Joi.number().description("port to connect to the email server"),
    SMTP_USERNAME: Joi.string().description("username for email server"),
    SMTP_PASSWORD: Joi.string().description("password for email server"),
    EMAIL_FROM: Joi.string().description(
      "the from field in the emails sent by the app"
    ),
    JWT_SECRET: Joi.string().required().description("JWT secret key"),
    JWT_ACCESS_EXPIRATION_MINUTES: Joi.number()
      .default(30)
      .description("minutes after which access tokens expire"),
    JWT_REFRESH_EXPIRATION_DAYS: Joi.number()
      .default(30)
      .description("days after which refresh tokens expire"),
    JWT_RESET_PASSWORD_EXPIRATION_MINUTES: Joi.number()
      .default(10)
      .description("minutes after which reset password token expires"),
    JWT_VERIFY_EMAIL_EXPIRATION_MINUTES: Joi.number()
      .default(10)
      .description("minutes after which verify email token expires"),
    ONE_SIGNAL_APP_ID: Joi.string()
    .required()
    .description("App Id for one signal"),
    ONE_SIGNAL_REST_API_KEY: Joi.string()
    .required()
    .description("Reset api key for one signal"),
    ONE_SIGNAL_BASE_URL:Joi.string()
    .required()
    .description("Base url for One-Signal Push Notification"),
    GOOGLE_MAP_KEY:Joi.string()
    .required()
    .description("Google Map Key for getting location"),
})
  .unknown();
const { value: envVars, error } = envVarsSchema
  .prefs({ errors: { label: "key" } })
  .validate(process.env);
if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}
module.exports = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  email: {
    smtp: {
      host: envVars.SMTP_HOST,
      port: envVars.SMTP_PORT,
      auth: {
        user: envVars.SMTP_USERNAME,
        pass: envVars.SMTP_PASSWORD,
      },
    },
    from: envVars.EMAIL_FROM,
  },
  aws: {
    accessKeyId: envVars.AWS_ACCESS_KEY_ID,
    secretAccessKey: envVars.AWS_SECRET_ACCESS_KEY,
    defaultRegion: envVars.AWS_DEFAULT_REGION,
    s3Bucket: envVars.AWS_S3_BUCKET,
    roleARN: envVars.AWS_ROLE_ARN,
  },
  jwt: {
    secret: envVars.JWT_SECRET,
    accessExpirationMinutes: envVars.JWT_ACCESS_EXPIRATION_MINUTES,
    refreshExpirationDays: envVars.JWT_REFRESH_EXPIRATION_DAYS,
    resetPasswordExpirationMinutes:
      envVars.JWT_RESET_PASSWORD_EXPIRATION_MINUTES,
    verifyEmailExpirationMinutes: envVars.JWT_VERIFY_EMAIL_EXPIRATION_MINUTES,
  },
  pwd: {
    wishlist: envVars.WISHLIST,
    length: envVars.LENGTH,
  },
  twilio: {
    sid: envVars.SID,
    authToken: envVars.AUTH_TOKEN,
    mobileNumber: envVars.MOBILE_NUMBER
  },
  onesignal:{
    appid:envVars.ONE_SIGNAL_APP_ID,
    restapikey:envVars.ONE_SIGNAL_REST_API_KEY,
    baseurl:envVars.ONE_SIGNAL_BASE_URL
  },
  routeexpiration:envVars.COMPLETE_ROUTE_EXPIRATION,
  startdaterouteexpiration:envVars.STARTDATE_ROUTE_EXPIRATION,
  enddaterouteexpiration:envVars.ENDDATE_ROUTE_EXPIRATION,
  setexpirydate:envVars.SET_EXPIRY_DATE,
  google_map:{
  key: envVars.GOOGLE_MAP_KEY
  }
};