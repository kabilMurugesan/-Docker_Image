module.exports = (sequelize, Sequelize) => {
    const user_route_stops_log = sequelize.define(
      "user_route_stops_log",
      {
        route_stops_log_id: {
          type: Sequelize.BIGINT,
          allowNull: false,
          primaryKey: true,
          autoIncrement: true
        },
        user_route_log_id: {
          type: Sequelize.BIGINT,
          allowNull: true,
        },
        route_stop_id: {
          type: Sequelize.BIGINT,
          allowNull: false,
        },
        user_route_id: {
          type: Sequelize.BIGINT,
          allowNull: false,
        },
        contact_name: {
          type: Sequelize.STRING(50),
          allowNull: true,
        },
        phone_number:{
          type: Sequelize.STRING(15),
          allowNull: true,
        },
        latitude: {
          type: Sequelize.STRING(50),
          allowNull: true,
        },
        longitude: {
          type: Sequelize.STRING(50),
          allowNull: true,
        },
        address: {
          type: Sequelize.STRING(150),
          allowNull: true,
        },
        sequence_number: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        placeId: {
          type: Sequelize.STRING(70),
          allowNull: true,
        },
        status: {
          type: Sequelize.TINYINT,
          allowNull: true,
        },
        created_by: {
          type: Sequelize.BIGINT,
          allowNull: true,
        },
        updated_by: {
          type: Sequelize.BIGINT,
          allowNull: true,
        }
      },
    );
    return user_route_stops_log;
  };