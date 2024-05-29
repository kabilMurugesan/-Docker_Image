const httpStatus = require("http-status");
const Sequelize = require("sequelize");
const config = require("../../config/config");
const moment = require("moment");
const { Op } = Sequelize;
const db = require("../../models");
const User = db.user;
const UserRoute = db.userRoute
const Banner = db.banner;
const ApiError = require("../../utils/ApiError");
const { sequelize, user, userAddress } = require("../../models");
const { now } = require("moment");
const paginate = require("../../utils/paginate");
const { getSignedURL } = require("../../utils/s3");


const getDashboardDetails = async (req) => {
  const startOfMonth =moment().utc().startOf('month').format('YYYY-MM-DD 00:00:00');
 const todayDate   = moment().utc().startOf('minute').format('YYYY-MM-DD hh:mm:ss');
  const result = await User.findOne({
    attributes: ['user_id',
    [Sequelize.literal('(SELECT COUNT(*) FROM `users` )'), 'users'],
    [Sequelize.literal('(SELECT COUNT(*) FROM `companies` where status=1)'), 'companies'],
    [Sequelize.literal('(SELECT COUNT(*) FROM `user_routes` where route_status!=0)'), 'userroutes'],
   ],
    });
    const bannercosts = await (sequelize.query((`select sum(banner_cost) from banners where createdAt  BETWEEN  '${startOfMonth}' AND'${todayDate}' AND is_active=1`)))
  if (!result || result == "") {
    throw new ApiError(httpStatus.BAD_REQUEST, "No Record Found");
  }
  return {
    usercount:result.dataValues.users,
    companiescount:result.dataValues.companies,
    userroutecount:result.dataValues.userroutes,
    bannercost: (bannercosts[0][0]['sum(banner_cost)'] === null ? "0": bannercosts[0][0]['sum(banner_cost)'])
  };
};

const getChartDetails = async (req) => {
  const result = await User.findOne({
    attributes: ['user_id',
    // [Sequelize.literal('(SELECT COUNT(route_status) FROM `user_routes` where route_status=0 )'), 'deleted'],
    [Sequelize.literal('(SELECT COUNT(route_status) FROM `user_routes` where route_status=1 )'), 'notstarted'],
     [Sequelize.literal('(SELECT COUNT(route_status) FROM `user_routes` where route_status=2 )'), 'inprogress'],
     [Sequelize.literal('(SELECT COUNT(route_status) FROM `user_routes` where route_status=3 )'), 'completed'],
   ],
    });
  return [
    ["Routes","Status"],
    // ["Deleted",result.dataValues.deleted],
    ["Not Started",result.dataValues.notstarted],
    ["In Progress",result.dataValues.inprogress],
    ["Completed",result.dataValues.completed],
  ]
};


const getUserChartDetails = async (req) => {
  const startOfMonth =moment().utc().startOf('month').subtract(2,'months').format('YYYY-MM-DD 00:00:00');
  const endDate   = moment().utc().endOf('month').format('YYYY-MM-DD 23:59:59');
    const usercount = await (sequelize.query((`SELECT DATE_FORMAT(created_at, '%m-%d-%y') as Date, COUNT(user_id) as Users
    FROM users
    WHERE created_at BETWEEN  '${startOfMonth}' AND '${endDate}'
    GROUP BY DATE_FORMAT(created_at, '%m-%d-%y') , user_id, created_at order by month(created_at) asc`)))
  if (!usercount || usercount == "") {
    throw new ApiError(httpStatus.BAD_REQUEST, "No Record Found");
  }
   let users=[]
   const userscount=usercount[0]
  const title=Object.keys(usercount[0][0])
  users.push(title)
  userscount.forEach(async (element) => {
    const output = await Object.values(element)
    users.push(output)
  });
  return {
    users:users
  };
};

const getUserRouteDetails = async (req) => {
  update={}
  if (req.query.route_status && req.query.route_status != "") {
    switch (req.query.route_status) {
      case "Not Started":
        update.route_status = 1;
        break;
      case "Started":
        update.route_status = 2;
        break;
      case "Completed":
        update.route_status = 3;
        break;
    }
  }
  const search=req.query.search==null?"":req.query.search
  const status= (req.query.route_status==null|| req.query.route_status =="" ) ? [1,2,3]: update.route_status
  const routename=req.query.route_name==null?"":req.query.route_name
  const page=req.query.page==null?1:req.query.page
  const size=req.query.size==null?10:req.query.size
  const sortBy=(req.query.sortBy!=null && req.query.sortBy!="") ? req.query.sortBy : "created_at";
  const sortType=(req.query.sortType!=null && req.query.sortType!="") ? req.query.sortType : "asc";
  const pageNo = parseInt(page, 10) || 1;
  const offset=((pageNo-1)*size);
  const limit = parseInt(size, 10)
  const usersRoutecount = await (sequelize.query((`select count(*) from (select ur.route_id,ur.route_name,ur.started_date,ur.start_date,ur.distance,ur.route_status,ur.createdAt,ur.created_by,ur.updated_by,
    concat(u.first_name," ",u.last_name) as username from user_routes as ur
     LEFT JOIN users u on u.user_id=ur.created_by and ur.route_status!=0 and ur.route_status in (${status})
      where (concat_ws(u.first_name,u.last_name) like '%${search}%' and ur.route_name like '%${routename}%') )as counts`)))
  
  const usersRouteList =await (sequelize.query((`select ur.route_id,ur.route_name,ur.started_date,ur.start_date,TRUNCATE(ur.distance,2) as distance ,ur.createdAt,ur.created_by,ur.updated_by,
  CASE
  WHEN ur.route_status = 1 THEN "Not Started" WHEN ur.route_status = 2  THEN "Started" WHEN ur.route_status = 3 THEN "Completed" END as route_status,
  concat(u.first_name," ",u.last_name) as username from user_routes as ur
   LEFT JOIN users u on u.user_id=ur.created_by and ur.route_status!=0  and ur.route_status in (${status})
    where (concat_ws(u.first_name,u.last_name) like '%${search}%' and ur.route_name like '%${routename}%')
    order by ${sortBy} ${sortType}
  limit ${limit} offset ${offset} `)))

  return {
    status:"success",  page,
    totalResults: usersRoutecount[0][0]['count(*)'],
    nextPage: (usersRoutecount[0][0]['count(*)'] > size*page) ? true : false,
     routeDetails:usersRouteList[0],
  };
};


const getBannerDisplayDetails = async (req) => {
  try {
    const date = moment().utc().format("YYYY-MM-DD hh:mm:ss");
    const headerBanner = await Banner.findOne({
      where: {
        is_active: { [Op.eq]: `${1}` },
        start_date: { [Op.lte]: `${date}` },
        end_date: { [Op.gte]: `${date}` },
        banner_type: { [Op.eq]: `${'Header'}` }
      },
      order: [["createdAt", "DESC"]],
      limit: 1,
    });

    const footerBanner = await Banner.findOne({
      where: {
        is_active: { [Op.eq]: `${1}` },
        start_date: { [Op.lte]: `${date}` },
        end_date: { [Op.gte]: `${date}` },
        banner_type: { [Op.eq]: `${'Footer'}` }
      },
      order: [["createdAt", "DESC"]],
      limit: 1,
    });

    if ((headerBanner == "" || !headerBanner) && (footerBanner == "" || !footerBanner)) {
      return { status: "success", message: "No record found." };

    }
    let first_image_URL = "";
    let second_image_URL = "";
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

const getUserList = async (req) => {
  const search = req.query.search == null ? "" : req.query.search
  const email = req.query.email == null ? "" : req.query.email
  const page = req.query.page == null ? 1 : req.query.page
  const size = req.query.size == null ? 10 : req.query.size
  const field = (req.query.sortBy != null && req.query.sortBy != "" && req.query.sortBy === "userroute_count" || "userdevice_count") ? "" : "u."
  const sortBy = (req.query.sortBy != null && req.query.sortBy != "") ? req.query.sortBy : "created_at";
  const sortType = (req.query.sortType != null && req.query.sortType != "") ? req.query.sortType : "asc";
  const pageNo = parseInt(page, 10) || 1;
  const offset = ((pageNo - 1) * size);
  const limit = parseInt(size, 10)
  try {

    const usersCount = await (sequelize.query((`select count(*) from (SELECT u.user_id,u.first_name,u.last_name,u.profile_pic,u.email,u.phone_number,u.is_email_verified,count(distinct ud.user_device_id) as userdevice_count,
    count(distinct ur.route_id) as userroute_count
    FROM users  u
    LEFT JOIN user_devices ud ON u.user_id = ud.user_id
    LEFT JOIN user_routes ur ON u.user_id = ur.created_by and route_status!=0
    where ((u.first_name like '%${search}%' or u.last_name like '%${search}%' or CONCAT_WS(' ',u.first_name,u.last_name) LIKE '\%${search}%\') and u.email like'\%${email}%\')
    group by u.user_id) as counts`)))

    const userLists = await (sequelize.query((`SELECT u.user_id,u.first_name,u.last_name,u.profile_pic,u.email,u.phone_number,u.is_email_verified,u.is_active
    ,count(distinct ud.user_device_id) as userdevice_count,
    count(distinct ur.route_id) as userroute_count
    FROM users  u
    LEFT JOIN user_devices ud ON u.user_id = ud.user_id
    LEFT JOIN user_routes ur ON u.user_id = ur.created_by and route_status!=0
    where ((u.first_name like '%${search}%' or u.last_name like '%${search}%' or CONCAT_WS(' ',u.first_name,u.last_name) LIKE '\%${search}%\') and u.email like'\%${email}%\')
    group by u.user_id order by ${field} ${sortBy} ${sortType} limit ${limit} offset ${offset} `)))

    return {
      status: "success", page,
      totalResults: usersCount[0][0]['count(*)'],
      nextPage: (usersCount[0][0]['count(*)'] > size * page) ? true : false,
      results: userLists[0]
    };
  } catch (e) {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Something went wrong " + e
    );
  }
}



module.exports = {
  getDashboardDetails,
  getChartDetails,
  getUserChartDetails,
  getUserRouteDetails,
  getBannerDisplayDetails,
  getUserList
};