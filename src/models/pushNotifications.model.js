module.exports = (sequelize, Sequelize) => {
    const pushNotificationTemplates = sequelize.define('pushnotification_templates', {
      template_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      template_code: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      title: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      content: {
        type: Sequelize.TEXT,
        defaultValue: 1,
        allowNull: false,
      },
      updated_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      createdAt: {
        type: 'DateTime',
        default_value: Sequelize.literal('CURRENT_TIMESTAMP'),
        field: 'created_at',
      },
      updatedAt: {
        type: 'DateTime',
        default_value: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
        field: 'updated_at',
      },
    });
    return pushNotificationTemplates;
  };