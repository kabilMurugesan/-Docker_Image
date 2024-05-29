const Sequelize = require("sequelize");
const moment = require("moment");
const { Op } = Sequelize;
const db = require("../../../models");
const { getSignedURL } = require("../../../utils/s3");

const Banner = db.banner;

//getting header and footer banner for the mobile
const getBannerDisplayDetails = async (req) => {
  try {
    const date = moment(new Date()).format("YYYY-MM-DD HH:MM:ss");
    //getting the header banner
    const headerBanner = await Banner.findOne({
      where: {
        is_active: { [Op.eq]: `${1}` },
        start_date: { [Op.lte]: `${date}` },
        end_date: { [Op.gte]: `${date}` },
        banner_type: { [Op.eq]: `${"Header"}` },
      },
      order: [["createdAt", "DESC"]],
      limit: 1,
    });
    //getting footer banner
    const footerBanner = await Banner.findOne({
      where: {
        is_active: { [Op.eq]: `${1}` },
        start_date: { [Op.lte]: `${date}` },
        end_date: { [Op.gte]: `${date}` },
        banner_type: { [Op.eq]: `${"Footer"}` },
      },
      order: [["createdAt", "DESC"]],
      limit: 1,
    });

    if ((headerBanner == "" || !headerBanner) && (footerBanner == "" || !footerBanner)) {
      return { status: "success", message: "No record found." };
    }
    let first_image_URL = "";
    let second_image_URL = "";
    //getting presigned url from aws server for header and footer
    if (headerBanner && headerBanner.banner_image_path != "") {
      first_image_URL = await getSignedURL(headerBanner.banner_image_path, "GET");
    }

    if (footerBanner && footerBanner.banner_image_path != "") {
      second_image_URL = await getSignedURL(footerBanner.banner_image_path, "GET");
    }
    return {
      status: "success",
      headerBanner,
      footerBanner,
      imageURL: {
        first_image_URL: first_image_URL,
        second_image_URL: second_image_URL,
      },
    };
  } catch (e) {
    return { status: "failed", message: "Something went wrong. Please contact admin. " + e };
  }
};

module.exports = {
  getBannerDisplayDetails,
};
