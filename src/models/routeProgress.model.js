const bcrypt = require("bcryptjs");

module.exports = (sequelize, Sequelize) => {
  const route_progress = sequelize.define(
    "route_progress",
    {
      route_progress_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },
      latitude: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      longitude: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      createdAt: {
        type: "DateTime",
        default_value: Sequelize.literal("CURRENT_TIMESTAMP"),
        field: "created_at",
      },
    }
  );
  return route_progress;
};
