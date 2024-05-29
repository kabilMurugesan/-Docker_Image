module.exports = (sequelize, Sequelize) => {
    const sharedstops = sequelize.define(
      "shared_stops",
      {
        shared_stop_id: {
          type: Sequelize.BIGINT,
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
        },
        shared_route_id: {
          type: Sequelize.BIGINT,
          allowNull: false,
        },
        phone_number: {
          type: Sequelize.STRING(20),
          allowNull: true
        },
        contact_name: {
          type: Sequelize.STRING(50),
          allowNull: true
        },
        stop_type: {
          type: Sequelize.STRING(10),
          allowNull: true
        },
        latitude: {
          type: Sequelize.STRING(50),
          allowNull: true,
        },
        longitude: {
          type: Sequelize.STRING(50),
          allowNull: true,
        },
        placeId: {
          type: Sequelize.STRING(70),
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
        created_by: {
          type: Sequelize.BIGINT,
          allowNull: true,
        },
        updated_by: {
          type: Sequelize.BIGINT,
          allowNull: true,
        },
      },
    );
    return sharedstops;
  };