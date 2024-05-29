module.exports = (sequelize, Sequelize) => {
  const banner = sequelize.define("banner", {
    banner_id: {
      type: Sequelize.BIGINT,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    company_id:{
      type:Sequelize.BIGINT,
      allowNull:false
    },
    title: {
      type: Sequelize.STRING(70),
      allowNull: false,
    },
    banner_image_path: {
      type: Sequelize.STRING(200),
      allowNull: false,
    },
    banner_type: {
      type: Sequelize.STRING(20),
      allowNull: false,
    },
    banner_url: {
      type: Sequelize.STRING(200),
      allowNull: true,
    },
    banner_cost:{
      type:Sequelize.BIGINT,
      allowNull:false
    },
    start_Date: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    end_Date: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    is_active: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      default: false,
    },
    pdf_file_name:{
      type: Sequelize.STRING(200),
      allowNull: false,
    }
  });

  return banner;
};
