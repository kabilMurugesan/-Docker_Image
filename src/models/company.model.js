module.exports = (sequelize, Sequelize) => {
    const company = sequelize.define("companies", {
      company_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      company_name: {
        type: Sequelize.STRING(40),
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING(100),
        allowNull: false,
       
      },
      contact_number: {
        type: Sequelize.STRING(15),
        allowNull: false,
      },
      license_number: {
        type: Sequelize.STRING(70),
        allowNull: false,
      },
      address: {
        type: Sequelize.STRING(200),
        allowNull: true,
      },
      city: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      state: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      zip_code: {
        type: Sequelize.STRING(10),
        allowNull: false,
        default: false,
      },
      logo_image_path: {
        type: Sequelize.STRING(100),
        allowNull: false,
        default: false,
      },
      status: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        default: false,
      },
    });
    return company;
  };
  