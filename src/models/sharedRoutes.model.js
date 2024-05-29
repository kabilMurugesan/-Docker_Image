module.exports = (sequelize, Sequelize) => {
  const sharedroutes = sequelize.define("shared_route", {
    shared_route_id: {
      type: Sequelize.BIGINT,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
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
    is_expired:{
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    is_updated:{
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    updated_by: {
      type: Sequelize.BIGINT,
      allowNull: false
    },
    route_started_count: {
      type: Sequelize.BIGINT,
        allowNull: true,
        default: 0
    },
    email:{
      type: Sequelize.STRING(20),
      allowNull: true,
    },
    phone_number:{
      type: Sequelize.STRING(20),
      allowNull: true,
    },
    user_name:{
      type: Sequelize.STRING(20),
      allowNull: true,
    },
    region:{
      type: Sequelize.STRING(20),
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
  return sharedroutes;
};