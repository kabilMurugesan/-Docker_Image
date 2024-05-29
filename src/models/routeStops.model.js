module.exports = (sequelize, Sequelize) => {
  const routestops = sequelize.define(
    "route_stops",
    {
      route_stop_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      route_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        primaryKey: false
      },
      contact_name: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      phone_number:{
        type: Sequelize.STRING(15),
        allowNull: true,
      },
      stop_user_id: {
        type: Sequelize.BIGINT,
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
    }
  );
  return routestops;
};