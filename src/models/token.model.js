module.exports = (sequelize, Sequelize) => {
  const token = sequelize.define(
    'token',
    {
      id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        autoIncrement: false
      },
      expires: {
        type: 'DateTime',
        field: 'expires_at',
      },
      token: {
        type: Sequelize.TEXT('long'),
        allowNull: false,
      },
     
      type: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      device_id: {
        type: Sequelize.STRING(50),
        allowNull: true,
        field: 'device_id',
      },
      device_type: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      createdAt: {
        type: 'DateTime',
        default_value: Sequelize.literal('CURRENT_TIMESTAMP'),
        field: 'created_at',
      }
    }
  );

  return token;
};
