const bcrypt = require("bcryptjs");

module.exports = (sequelize, Sequelize) => {
  const user = sequelize.define(
    "user",
    {
      user_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      first_name: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      last_name: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      phone_number: {
        type: Sequelize.STRING(15),
        allowNull: false,
      },
      password: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      profile_pic: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      is_email_verified: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: false,
      },
      auth_code: {
        type: Sequelize.STRING(30),
        allowNull: true,
      },
      attempts: {
        type: Sequelize.TINYINT,
        allowNull: true,
      },
      expires_on: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull:false,
        defaultValue: true,
        
      },
      createdAt: {
        type: "DateTime",
        default_value: Sequelize.literal("CURRENT_TIMESTAMP"),
        field: "created_at",
      },
      updatedAt: {
        type: "DateTime",
        default_value: Sequelize.literal(
          "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
        ),
        field: "updated_at",
      },
    },
    {
      hooks: {
        beforeCreate: async (record) => {
          // eslint-disable-next-line no-param-reassign
          record.dataValues.password = await bcrypt.hash(
            record.dataValues.password,
            8
          );
        },
        beforeUpdate: async (record) => {
          // eslint-disable-next-line no-param-reassign
          record.dataValues.password = await bcrypt.hash(
            record.dataValues.password,
            8
          );
        },
      },
    }
  );

  return user;
};
