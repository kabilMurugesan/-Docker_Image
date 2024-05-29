const Sequelize = require("sequelize");
const sequelize = require("../config/dbconfig");
const db = {};
db.sequelize = sequelize;
db.Sequelize = Sequelize;
db.user = require("./user.model")(sequelize, Sequelize);
db.token = require("./token.model")(sequelize, Sequelize);
db.userDevice = require("./userDevice.model")(sequelize, Sequelize);
db.userRoute = require("./userRoute.model")(sequelize, Sequelize);
db.sharedRoute = require("./sharedRoutes.model")(sequelize, Sequelize);
db.sharedRoutePermission = require("./sharedRoutePermission.model")(sequelize, Sequelize);
db.routeStops = require("./routeStops.model")(sequelize, Sequelize);
db.banner = require("./banner.model")(sequelize, Sequelize);
db.userAddress = require("./userAddress.model")(sequelize, Sequelize);
db.company = require("./company.model")(sequelize, Sequelize);
db.invitees = require("./invitees.model")(sequelize, Sequelize);
db.sharedRouteStops = require("./sharedRouteStops.model")(sequelize, Sequelize);
db.pushNotificationTemplates = require("./pushNotifications.model")(sequelize, Sequelize)
db.tempSharedRouteStops = require("./tempSharedRouteStops.model")(sequelize, Sequelize);
db.tempSharedRoute = require("./tempSharedRoutes.model")(sequelize, Sequelize);
db.userRoutesLog = require("./userRoutesLog.model")(sequelize, Sequelize);
db.userRouteStopsLog = require("./userRouteStopsLog.model")(sequelize, Sequelize);

db.user.hasMany(db.userRoute, {
  foreignKey: "user_id",
});
db.userRoute.hasOne(db.user, {
  foreignKey: "user_id",
  sourceKey: "created_by",
});
db.userRoute.hasMany(db.sharedRoute, { foreignKey: "parent_route_id" });
db.userRoute.hasMany(db.routeStops, { foreignKey: "route_id" });
db.userRoute.hasMany(db.sharedRoutePermission, { foreignKey: "route_id" });
// db.user.hasMany(db.userRoute, {
//   foreignKey: "created_by",
//   sourceKey: "user_id",
// });
db.sharedRoute.hasMany(db.sharedRouteStops, {
  sourceKey: "shared_route_id",
  foreignKey: "shared_route_id",
});

db.routeStops.hasOne(db.user, {
  foreignKey: "user_id",
  sourceKey: "stop_user_id",
});
// db.user.hasMany(db.sharedRoute, {
//   foreignKey: "user_id",
// });
db.sharedRoute.belongsTo(db.user, {
  foreignKey: "user_id",
});
db.sharedRoute.hasOne(db.sharedRoutePermission, {
  sourceKey: "parent_route_id",
  foreignKey: "route_id",
});
db.user.hasMany(db.userAddress, { foreignKey: "user_id" });
db.user.hasMany(db.userDevice, { foreignKey: "user_id" });
db.userDevice.belongsTo(db.user, { foreignKey: "user_id" });
db.userRoutesLog.belongsTo(db.userRoute, {
  foreignKey:"route_id"
});
// db.userRouteStopsLog.belongsTo(db.userRoute, {
//   sourceKey: "user_route_id",
//   foreignKey:"route_id"
// });
// db.userRouteStopsLog.belongsTo(db.routeStops, {
//   foreignKey:"route_stop_id"
// });
db.userRouteStopsLog.belongsTo(db.userRoutesLog, {
  foreignKey:"user_route_log_id"
});
db.userRoutesLog.hasMany(db.userRouteStopsLog, {
  foreignKey:"user_route_log_id"
});
//sequelize.sync({ alter:true })
module.exports = db;