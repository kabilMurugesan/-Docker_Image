module.exports = (sequelize, Sequelize) => {
    const tempsharedstops = sequelize.define(
      "temp_shared_stops",
      {
        temp_shared_stop_id: {
          type: Sequelize.BIGINT,
          allowNull: false,
          primaryKey: true,
          autoIncrement: true
        },
        temp_shared_route_id: {
          type: Sequelize.BIGINT,
          allowNull: false,
        },
        shared_stop_id: {
          type: Sequelize.BIGINT,
          allowNull: false,
        },
        shared_route_id: {
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
        status: {
          type: Sequelize.TINYINT,
          allowNull: true,
        },
        placeId: {
          type: Sequelize.STRING(70),
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
    return tempsharedstops;
  };