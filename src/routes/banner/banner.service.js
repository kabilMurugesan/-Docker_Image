const Sequelize = require("sequelize");
const moment = require("moment");
const { Op } = Sequelize;
const db = require("../../models");
const ApiError = require("../../utils/ApiError");
const catchAsync = require("../../utils/catchAsync");
const { getSignedURL } = require("../../utils/s3");
const httpStatus = require("http-status");
const paginate = require("../../utils/paginate");
const Banner = db.banner;
const Company = db.company;
//creating banner
const createBanner = async (req) => {
  try {
    if (req.body.CompanyId) {
      const validatingid = await Company.findOne({
        where: { company_id: { [Op.eq]: req.body.CompanyId } },
      });
      if (!validatingid || validatingid === "") {
        throw new ApiError(httpStatus.NOT_FOUND, "CompanyId Not Found");
      }
    }
    if (req.body.EndDate && req.body.EndDate < req.body.StartDate) {
      return { status: "failed", message: "End Date must be greater than Start Date" };
    }
    if (req.body.Status == "Active") {
      conditions = [
        {
          is_active: { [Op.eq]: `${1}` },
          banner_type: { [Op.eq]: `${req.body.BannerType}` },
          [Op.or]: [
            {
              start_Date: {
                [Op.gte]: `${moment(new Date(req.body.StartDate))}`,
                [Op.lte]: `${moment(new Date(req.body.EndDate))}`,
              },
            },
            {
              end_Date: {
                [Op.gte]: `${moment(new Date(req.body.StartDate))}`,
                [Op.lte]: `${moment(new Date(req.body.EndDate))}`,
              },
            },
          ],
        },
      ];
      const activeBanners = await Banner.findAll({
        where: conditions,
      });
      if (activeBanners && activeBanners != "") {
        return { status: "failed", message: "Active Banner available for Same Date" };
      }
    }

    const banner = await Banner.create({
      title: req.body.Title,
      banner_image_path: req.body.BannerImagePath,
      banner_type: req.body.BannerType,
      company_id: req.body.CompanyId,
      banner_cost: req.body.BannerCost,
      start_Date: moment(new Date(req.body.StartDate)),
      end_Date: req.body.EndDate ? moment(new Date(req.body.EndDate)) : null,
      is_active: req.body.Status == "Active" ? true : false,
      banner_url: req.body.BannerURL,
      pdf_file_name: req.body.PdfName,
    });

    if (!banner) {
      return { status: "failed", message: "Banner not added. Please contact admin." };
    }
    return {
      status: "success",
      message: "Banner added succesfully",
      banner,
    };
  } catch (e) {
    return { status: "failed", message: "Something went wrong. Please contact admin. " + e };
  }
};
//edit banner
const editBanner = async (req) => {
  try {
    if (req.body.CompanyId) {
      const validatingid = await Company.findOne({
        where: { company_id: { [Op.eq]: req.body.CompanyId } },
      });
      if (!validatingid || validatingid === "") {
        throw new ApiError(httpStatus.NOT_FOUND, "CompanyId Not Found");
      }
    }
    if (req.body.EndDate && req.body.EndDate < req.body.StartDate) {
      return { status: "failed", message: "End Date must be greater than Start Date" };
    }
    if (req.body.Status == "Active") {
      conditions = [
        {
          banner_id: { [Op.ne]: `${req.body.BannerId}` },
          is_active: { [Op.eq]: `${1}` },
          banner_type: { [Op.eq]: `${req.body.BannerType}` },
          [Op.or]: [
            {
              start_Date: {
                [Op.gte]: `${moment(new Date(req.body.StartDate))}`,
                [Op.lte]: `${moment(new Date(req.body.EndDate))}`,
              },
            },
            {
              end_Date: {
                [Op.gte]: `${moment(new Date(req.body.StartDate))}`,
                [Op.lte]: `${moment(new Date(req.body.EndDate))}`,
              },
            },
          ],
        },
      ];
      const activeBanners = await Banner.findAll({
        where: conditions,
      });

      if (activeBanners && activeBanners != "") {
        return { status: "failed", message: "Active Banner available for Same Date" };
      }
    }

    const banner = await Banner.update(
      {
        title: req.body.Title,
        banner_image_path: req.body.BannerImagePath,
        banner_type: req.body.BannerType,
        company_id: req.body.CompanyId,
        banner_cost: req.body.BannerCost,
        start_Date: moment(new Date(req.body.StartDate)),
        end_Date: req.body.EndDate ? moment(new Date(req.body.EndDate)) : null,
        is_active: req.body.Status == "Active" ? true : false,
        banner_url: req.body.BannerURL,
        pdf_file_name: req.body.PdfName,
      },
      {
        where: {
          banner_id: req.body.BannerId,
        },
      }
    );

    if (!banner) {
      return { status: "failed", message: "Banner not updated. Please contact admin." };
    }
    return {
      status: "success",
      message: "Banner updated succesfully",
      banner,
    };
  } catch (e) {
    return { status: "failed", message: "Something went wrong. Please contact admin. " + e };
  }
};
//getting all registered banner
const getAllBanner = async (req) => {
  try {
    //passing req.query in conditions
    conditions = {};

    if (req.query.title) {
      conditions.title = {
        [Op.like]: `%${req.query.title}%`,
      };
    }
    if (req.query.status) {
      conditions.is_active = req.query.status == "Active" ? { [Op.eq]: `${1}` } : { [Op.eq]: `${0}` };
    }

    if (req.query.start_date) {
      conditions.start_Date = {
        [Op.gte]: `%${moment(new Date(req.query.start_date))}%`,
      };
    }
    if (req.query.end_date) {
      conditions.end_Date = {
        [Op.lte]: `%${moment(new Date(req.query.end_date))}%`,
      };
    }
    let search = { where: conditions };

    const banners = await paginate(Banner, req.query, search);
    if (banners && banners.status == "failed") {
      return banners;
    }
    if (!banners) {
      return { status: "success", message: "No record found" };
    }
    return { status: "success", banners };
  } catch (e) {
    return { status: "failed", message: "Something went wrong. Please contact admin. " + e };
  }
};
//getting particular banner by id
const getBannerById = async (req) => {
  try {
    let banner = {};
    banner.details = await Banner.findOne({
      where: { banner_id: { [Op.eq]: `${req.query.BannerId}` } },
    });
    if (!banner.details) {
      return { status: "success", message: "No record found" };
    }
    if (banner.details && banner.details.banner_image_path != "") {
      banner.banner_image_path = await getSignedURL(banner.details.banner_image_path, "GET");
    } else {
      banner.banner_image_path = "";
    }
    if (banner.details && banner.details.pdf_file_name != "") {
      banner.pdf_file_url = await getSignedURL(banner.details.pdf_file_name, "GET");
    } else {
      banner.pdf_file_url = "";
    }
    return {
      status: "success",
      banner: banner,
    };
  } catch (e) {
    return { status: "failure", message: "Something went wrong. Please contact admin. ", error: e };
  }
};
//registering new company
const createCompany = async (req) => {
  try {
    const validate = await Company.findOne({
      where: {
        [Op.or]: [{ license_number: { [Op.eq]: req.body.LicenseNumber } }, { email: { [Op.eq]: req.body.Email } }],
      },
    });
    if (validate) {
      return { status: "failed", message: "Company not added. License_number or Email already in use." };
    } else {
      const company = await Company.create({
        company_name: req.body.CompanyName,
        email: req.body.Email,
        contact_number: req.body.ContactNumber,
        license_number: req.body.LicenseNumber,
        address: req.body.Address,
        city: req.body.City,
        state: req.body.State,
        zip_code: req.body.ZipCode,
        logo_image_path: req.body.ImagePath,
        status: req.body.Status == "Active" ? true : false,
      });

      if (!company) {
        return { status: "failed", message: "Company not added. Please contact admin." };
      }
      return {
        status: "success",
        message: "Company added succesfully",
        company,
      };
    }
  } catch (e) {
    return { status: "failed", message: "Please contact admin." + e };
  }
};
// editing already existing comapny in database
const editCompany = async (req) => {
  try {
    const validate = await Company.findOne({
      where: {
        [Op.or]: [{ license_number: { [Op.eq]: req.body.LicenseNumber } }, { email: { [Op.eq]: req.body.Email } }],
        company_id: { [Op.ne]: req.body.CompanyId },
      },
    });
    if (validate) {
      return { status: "failed", message: "License_number or Email already in use." };
    } else {
      const company = await Company.update(
        {
          company_name: req.body.CompanyName,
          email: req.body.Email,
          contact_number: req.body.ContactNumber,
          license_number: req.body.LicenseNumber,
          address: req.body.Address,
          city: req.body.City,
          state: req.body.State,
          zip_code: req.body.ZipCode,
          logo_image_path: req.body.ImagePath,
          status: req.body.Status == "Active" ? true : false,
        },
        {
          where: {
            company_id: req.body.CompanyId,
          },
        }
      );

      if (!company) {
        return { status: "failed", message: "Company not updated. Please contact admin." };
      }
      return {
        status: "success",
        message: "Company updated succesfully",
        company,
      };
    }
  } catch (e) {
    return { status: "failed", message: "Please contact admin." + e };
  }
};
//getting all company stored in db
const getAllCompany = async (req) => {
  try {
    conditions = {};

    if (req.query.CompanyName) {
      conditions.company_name = {
        [Op.like]: `%${req.query.CompanyName}%`,
      };
    }
    if (req.query.Status) {
      conditions.status = req.query.Status == "Active" ? { [Op.eq]: `${1}` } : { [Op.eq]: `${0}` };
    }

    if (req.query.LicenseNumber) {
      conditions.license_number = {
        [Op.like]: `%${req.query.LicenseNumber}%`,
      };
    }

    let search = { where: conditions };

    const company = await paginate(Company, req.query, search);
    if (company && company.status == "failed") {
      return company;
    }
    if (!company) {
      return { status: "success", message: "No record found" };
    }
    return { status: "success", company };
  } catch (e) {
    return { status: "failed", message: "Please contact admin." + e };
  }
};
//getting particular company by using company id
const getCompanyById = async (req) => {
  try {
    let company = {};
    company.details = await Company.findOne({
      where: { company_id: { [Op.eq]: `${req.query.CompanyId}` } },
    });
    if (!company.details) {
      return { status: "success", message: "No record found" };
    }
    if (company.details && company.details.logo_image_path != "") {
      company.logo_image_url = await getSignedURL(company.details.logo_image_path, "GET");
    } else {
      company.logo_image_url = "";
    }
    return {
      status: "success",
      company: company,
    };
  } catch (e) {
    return { status: "failure", message: "Something went wrong. Please contact admin. ", error: e };
  }
};
//getting company name and comapny id for dropdown
const getAllCompanyId = async (req) => {
  try {
    const company = await Company.findAll({
      where: { status: { [Op.eq]: 1 } },
      attributes: ["company_id", "company_name"],
    });
    if (!company) {
      return { status: "success", message: "No record found" };
    }
    return { status: "success", company };
  } catch (e) {
    return { status: "failed", message: "Something went wrong. Please contact admin. " + e };
  }
};

module.exports = {
  createBanner,
  editBanner,
  getAllBanner,
  getBannerById,
  createCompany,
  getAllCompany,
  editCompany,
  getCompanyById,
  getAllCompanyId,
};
