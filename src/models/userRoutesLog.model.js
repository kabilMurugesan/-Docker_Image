module.exports = (sequelize, Sequelize) => {
  const user_route_log = sequelize.define("user_route_log", {
    user_route_log_id: {
      type: Sequelize.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    route_id: {
      type: Sequelize.BIGINT,
      allowNull: false,
    },
    user_id: {
      type: Sequelize.BIGINT,
      allowNull: true,
      defaultValue: null,
    },
    route_name: {
      type: Sequelize.STRING(50),
      allowNull: false,
    },
    start_latitude: {
      type: Sequelize.STRING(50),
      allowNull: true,
    },
    start_longitude: {
      type: Sequelize.STRING(50),
      allowNull: true,
    },
    start_address: {
      type: Sequelize.STRING(300),
      allowNull: true,
    },
    end_latitude: {
      type: Sequelize.STRING(50),
      allowNull: true,
    },
    end_longitude: {
      type: Sequelize.STRING(50),
      allowNull: true,
    },
    end_address: {
      type: Sequelize.STRING(300),
      allowNull: true,
    },
    distance: {
      type: Sequelize.STRING(20),
      allowNull: false,
    },
    start_date: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    started_date: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    end_date: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    route_status: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    created_by: {
      type: Sequelize.BIGINT,
      allowNull: false,
    },
    updated_by: {
      type: Sequelize.BIGINT,
      allowNull: true,
    },
    route_status: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    expires_on: {
      type: 'DateTime',
      allowNull: true,
    },
    start_place_id: {
      type: Sequelize.STRING(50),
      allowNull: true,
    },
    end_place_id: {
      type: Sequelize.STRING(50),
      allowNull: true,
    },
    isRoundTrip: {
      type: Sequelize.BOOLEAN,
      allowNull: true,
      defaultValue: false
    },

  });
  return user_route_log;
};