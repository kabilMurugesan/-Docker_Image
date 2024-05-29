const Joi = require("joi");

const createBanner = {
  body: Joi.object().keys({
    Title: Joi.string().required(),
    CompanyId:Joi.number().required(),
    BannerCost:Joi.number().required(),
    BannerImagePath: Joi.string().required(),
    BannerType: Joi.string().required().valid('Header','Footer'),
    StartDate: Joi.date().required(),
    EndDate: [Joi.date(), Joi.allow(null)],
    BannerURL: [Joi.string(),Joi.allow(null)],
    Status: Joi.string().required(),
    PdfName:Joi.string().required()
  }),
};

const editBanner = {
  body: Joi.object().keys({
    BannerId: Joi.number().required(),
    Title: Joi.string().required(),
    CompanyId:Joi.number().required(),
    BannerCost:Joi.number().required(),
    BannerImagePath: Joi.string().required(),
    BannerType: Joi.string().required().valid('Header','Footer'),
    StartDate: Joi.date().required(),
    EndDate: [Joi.date(), Joi.allow(null)],
    BannerURL: [Joi.string(),Joi.allow(null)],
    Status: Joi.string().required(),
    PdfName:Joi.string().required()
  })
};

const getBannerById = {
  query: Joi.object().keys({
    BannerId: Joi.number().required(),
  }),
};

const getAllBanner = {
  query: Joi.object().keys({
    page: Joi.number().required(),
    size: Joi.number().required(),
    title: [Joi.string(),Joi.allow(null)],
    start_date: [Joi.string(),Joi.allow(null)],
    end_date: [Joi.string(),Joi.allow(null)],
    status:  Joi.string().optional().valid('Active','Inactive').allow("", null),
    sortBy: [Joi.string(),Joi.allow(null)],
    sortType: [Joi.string(),Joi.allow(null)],
  })
}
const createCompany={
  body: Joi.object().keys({
  CompanyName:Joi.string().required(),
  Email: Joi.string().email().required(),
  ContactNumber: Joi.string().required(),
  LicenseNumber: Joi.string().required(),
  Address: Joi.string().required(),
  City: Joi.string().required(),
  State:Joi.string().required(),
  ZipCode: Joi.string().required(),
  ImagePath:[Joi.string(),Joi.allow(null)],
  Status: Joi.string().required().valid('Active','Inactive'),
  })
}
const editCompany={
  body: Joi.object().keys({
  CompanyId:Joi.number().required(),  
  CompanyName:Joi.string().required(),
  Email: Joi.string().email().required(),
  ContactNumber: Joi.string().required(),
  LicenseNumber: Joi.string().required(),
  Address: Joi.string().required(),
  City: Joi.string().required(),
  State:Joi.string().required(),
  ZipCode: Joi.string().required(),
  ImagePath:[Joi.string(),Joi.allow(null)],
  Status: Joi.string().required().valid('Active','Inactive'),
  })
}
const getAllCompany = {
  query: Joi.object().keys({
    page: Joi.number().required(),
    size: Joi.number().required(),
    CompanyName: [Joi.string(),Joi.allow(null)],
    LicenseNumber: [Joi.string(),Joi.allow(null)],
    Status: Joi.string().optional().valid('Active','Inactive').allow("", null),
    sortBy: [Joi.string(),Joi.allow(null)],
    sortType: [Joi.string(),Joi.allow(null)],
  })
}

const getCompanyById = {
  query: Joi.object().keys({
    CompanyId: Joi.number().required(),
  }),
};

module.exports = {
  createBanner,
  editBanner,
  getBannerById,
  getAllBanner,
  createCompany,
  getAllCompany,
  editCompany,
  getCompanyById
};
