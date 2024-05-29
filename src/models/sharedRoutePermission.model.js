module.exports = (sequelize, Sequelize) => {
  const sharedroutepermission = sequelize.define("shared_route_permission", {
    shared_route_permission_id: {
      type: Sequelize.BIGINT,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
    },
    user_id: {
      type: Sequelize.BIGINT,
      allowNull: false,
    },
    route_id: {
      type: Sequelize.BIGINT,
      allowNull: false,
    },
    allow_edit: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    allow_share: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    share_indefinitely: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    share_endofday: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    share_onehour: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    edit_startdate:{
      type:Sequelize.BOOLEAN,
      allowNull:false,
      defaultValue:false
    }
  });
  return sharedroutepermission;
};
