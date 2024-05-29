// const sequelize = require('./config/dbconfig');
// const socketio = require('socket.io');
// const app = require('./app');
// const config = require('./config/config');
// const logger = require('./config/logger');
// const webSockets = require('./utils/webSockets');
// const http = require('http').Server(app);


// let server;
// sequelize.sync().then(() => {
//   logger.info('Connected to MYSQL');
//   const socket = socketio().listen(http, {
//     cors: {
//       origin: '*',
//       methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD'],
//       preflightContinue: false,
//       optionsSuccessStatus: 204,
//     },
//   });
//   global.io = socket;
//   global.io.on('connection', webSockets.connection);

//   server = http.listen(config.port, () => {
//     logger.info(`Listening to port ${config.port}`);
//   });
// });
// const exitHandler = () => {
//   if (server) {
//     server.close(() => {
//       logger.info('Server closed');
//       process.exit(1);
//     });
//   } else {
//     process.exit(1);
//   }
// };

// const unexpectedErrorHandler = (error) => {
//   logger.error(error);
//   exitHandler();
// };

// process.on('uncaughtException', unexpectedErrorHandler);
// process.on('unhandledRejection', unexpectedErrorHandler);

// process.on('SIGTERM', () => {
//   logger.info('SIGTERM received');
//   if (server) {
//     server.close();
//   }
// });



const express = require("express");
const bodyparser = require("body-parser");
const app = express();
// const { checkToken } = require("./auth/token.validation");
const port = process.env.PORT || 5000;

app.use(bodyparser.urlencoded({ extended: false }));

app.use(bodyparser.json());

app.get("/", (req, res) => {
  res.send("hello world");
});

//importing file student routes
// const studentroutes = require("./src/routes/student.route");
// const userroutes = require("./src/routes/user.route");
// const routes = require("./test/calculator");

//create url using middleware
// app.use("/api/v1/student/login", userroutes);
// app.use("/api/v1/student", checkToken, studentroutes);

app.listen(port, () => {
  console.log("express server is started at port 5000");
});
