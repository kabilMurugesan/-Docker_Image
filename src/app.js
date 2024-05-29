
// const express = require('express');
// const helmet = require('helmet');
// const compression = require('compression');
// const cors = require('cors');
// const passport = require('passport');
// const httpStatus = require('http-status');
// const config = require('./config/config');
// const morgan = require('./config/morgan');

// const { authLimiter } = require('./middlewares/rateLimiter');
// const routes = require('./routes');
// const { errorConverter, errorHandler } = require('./middlewares/error');
// const ApiError = require('./utils/ApiError');
// const { jwtStrategy } = require('./config/passport');
// const sharedRouteService = require("./routes/v1/sharedRoute/sharedRoute.service");
// const userRouteService=require("./routes/v1/userRoute/userRoute.service")

// const app = express();

// // Importing required libraries
// const cron = require("node-cron");

// // Creating a cron job which runs on every 5 minutes
// cron.schedule("1 */5 * * * *", function () {
//   sharedRouteService.routeExpiration()
// });

// // Creating a cron job which runs on every 5 minutes
// cron.schedule("1 */5 * * * *", function () {
//   sharedRouteService.checkRouteExpiry()
// });

// // Creating a cron job which runs every hour.
// cron.schedule("0 * * * *", function () {
//   sharedRouteService.sharedRouteExpiration()
// });

// // Creating a cron job which runs every hour.
// cron.schedule("0 * * * *", function () {
//   userRouteService.userRouteExpiration()
// });


// if (config.env !== 'test') {
//   app.use(morgan.successHandler);
//   app.use(morgan.errorHandler);
// }

// // set security HTTP headers
// app.use(helmet());

// // parse json request body
// app.use(express.json());

// // parse urlencoded request body
// app.use(express.urlencoded({ extended: true }));

// // gzip compression
// app.use(compression());

// // enable cors
// app.use(cors());
// app.options('*', cors());
// // passport jwt
// app.use(passport.initialize());
// passport.use('jwt', jwtStrategy);

// // limit repeated failed requests to auth endpoints
// if (config.env === 'production') {
//   app.use('/v1/auth', authLimiter);
// }

// // v1 api routes
// app.use( routes);

// // send back a 404 error for any unknown api request
// app.use((req, res, next) => {
//   next(new ApiError(httpStatus.NOT_FOUND, 'Not found'));
// });

// // convert error to ApiError, if needed
// app.use(errorConverter);

// // handle error
// app.use(errorHandler);

// module.exports = app;