module.exports = (sequelize, Sequelize) => {
  const userDevice = sequelize.define(
    "user_device",
    {
      user_device_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      device_id: {
        type: Sequelize.STRING(50),
        allowNull: false,
        field: 'device_id',
      },
      user_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },
      device_type: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      device_os: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      last_login: {
       type: 'DateTime',
       default_value: Sequelize.literal('CURRENT_TIMESTAMP'),
        allowNull: true,
      },
      latest_version: {
        type: Sequelize.STRING(50),
         allowNull: true,
       },
       first_install_date: {
        type: Sequelize.STRING(50),
         allowNull: true,
       },
       latest_version_date: {
        type: Sequelize.STRING(50),
         allowNull: true,
       },
       uninstall_date: {
       type: Sequelize.STRING(50),
         allowNull: true,
       }
   
    }
  );
  return userDevice;
};
