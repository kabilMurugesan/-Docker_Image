module.exports = (sequelize, Sequelize) => {
    const userroute = sequelize.define(
      "user_route",
      {
        route_id: {
          type: Sequelize.BIGINT,
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
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
        created_by: {
          type: Sequelize.BIGINT,
          allowNull: false
        },
        updated_by: {
          type: Sequelize.BIGINT,
          allowNull: false,
        },
        route_started_count : {
          type: Sequelize.BIGINT,
          allowNull: false,
          default: 0
        },
        expires_on: {
          type: 'DateTime',
          allowNull: true,
        },
        is_optimize: {
          type: Sequelize.BOOLEAN,
          allowNull: true,
          defaultValue: true,
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
      },
    );
    return userroute;
  };  