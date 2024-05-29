module.exports = (sequelize, Sequelize) => {
  const tempsharedroutes = sequelize.define("temp_shared_route", {
    temp_shared_route_id: {
      type: Sequelize.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    shared_route_id: {
      type: Sequelize.BIGINT,
      allowNull: false,
    },
    user_id: {
      type: Sequelize.BIGINT,
      allowNull: true,
      defaultValue: null,
    },
    parent_route_id: {
      type: Sequelize.BIGINT,
      allowNull: false,
    },
    route_id: {
      type: Sequelize.BIGINT,
      allowNull: true,
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
      allowNull: true,
    },
    start_date: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    start_time: {
      type: Sequelize.TIME,
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
    expires_on: {
      type: 'DateTime',
      allowNull: true,
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
    updated_by: {
      type: Sequelize.BIGINT,
      allowNull: false
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
  //tempsharedroutes.removeAttribute('id');
  return tempsharedroutes;
};