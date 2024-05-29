module.exports = (sequelize, Sequelize) => {
    const invitees = sequelize.define("invitees", {
      invitees_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING(250),
        allowNull: false,
      },
      mobile_number: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      email_address: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      other_invitee_details: {
        type: Sequelize.STRING(200),
        allowNull: true,
      },
      invited_by: {
        type: Sequelize.STRING(200),
        allowNull: true,
      },
      is_registered: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        default: false,
      },
      updated_by: {
        type: Sequelize.BIGINT,
        allowNull: true,
      },
    });
  
    return invitees;
  };
  