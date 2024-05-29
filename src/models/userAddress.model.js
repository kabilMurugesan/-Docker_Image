module.exports = (sequelize, Sequelize) => {
  const userAddress = sequelize.define(
    "user_address",
    {
      user_address_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.BIGINT,
        allowNull: false
      },
      latitude: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      longitude: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      address: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      city: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      state: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      zipcode: {
        type: Sequelize.STRING(10),
        allowNull: false,
      },
      createdAt: {
        type: "DateTime",
        default_value: Sequelize.literal("CURRENT_TIMESTAMP")
      },
      updatedAt: {
        type: "DateTime",
        default_value: Sequelize.literal(
          "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
        )
      },
    },
  );
  return userAddress;
};
