const httpStatus = require("http-status");
const Sequelize = require("sequelize");
const config = require("../../../config/config");
const moment = require("moment");
const { Op } = Sequelize;
const db = require("../../../models");
const User = db.user;
const Address = db.userAddress;
const UserDevice = db.userDevice;
const UserRoutes = db.userRoute
const Token = db.token;
const paginate = require('../../../utils/paginate');

const ApiError = require("../../../utils/ApiError");
const { sequelize, user } = require("../../../models");
const { now } = require("moment");

const NodeGeocoder = require('node-geocoder');
const { getSignedURL } = require("../../../utils/s3");
const distanceService = require("../../../services/map.service")

function capitalizeFirstLetter(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

const createAddress = async (req) => {
  try {
    //checking valid user in the database
    const user = await User.findAll({ where: { user_id: req.body.user_id } })
    if (!user || user == "") {
      throw new ApiError(httpStatus.BAD_REQUEST, "Invalid UserId");
    }
    let latitude = req.body.latitude;
    let longitude = req.body.longitude;
  
    if(!latitude || !longitude){
    //checking the lat and long coordinates.
    const location = await distanceService.getLatLong(req.body.address+' ,'+req.body.city+' ,'+req.body.state+' ,'+req.body.zipcode);
    latitude = (location.length > 0 && location[0].latitude)? location[0].latitude:'';
    longitude = (location.length > 0 && location[0].longitude)? location[0].longitude:'';
  }
  //inserting the new records in the address table
  const address = await Address.create({
    user_id: req.body.user_id,
    address: req.body.address,
    city: req.body.city,
    state: req.body.state,
    zipcode: req.body.zipcode,
    latitude: latitude,
    longitude: longitude
  });

  if (address) {
    return { status: "success", message: "Address added Successfully",address};
  }else{
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Something went wrong"
    );
  } 
  }catch(e){
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Something went wrong "+e
    );
  }
};

const updateAddress = async (req) => {
  try{
  const address = await Address.findOne({ where: { user_address_id: req.body.user_address_id, user_id:req.body.user_id }});
  if(!address){
    throw new ApiError(
      httpStatus[400],
      "User address not found."
    );
  }
  
  let latitude = req.body.latitude;
  let longitude = req.body.longitude;
  //checking the lat and long coordinates.
    if(!latitude || !longitude){
    const location = await distanceService.getLatLong(req.body.address+' ,'+req.body.city+' ,'+req.body.state+' ,'+req.body.zipcode);
    latitude = (location.length > 0 && location[0].latitude)? location[0].latitude:'';
    longitude = (location.length > 0 && location[0].longitude)? location[0].longitude:'';
  }
//updating the address in database
  const updateaddress = await address.update({
    address: req.body.address,
    city: req.body.city,
    state: req.body.state,
    zipcode: req.body.zipcode,
    latitude: latitude,
    longitude: longitude,
    updatedAt: now()
  });

  if (updateaddress) {
    return { status: "success", message: "Address updated Successfully",address:updateaddress};
  }else{
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Something went wrong"
    );
  } 
  }catch(e){
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Something went wrong "+e
    );
  }
};

const getAddress = async(req) => {
  //getting address from the database using userid.
  const address = await Address.findOne({ where: {user_id : req.query.user_id}});
  if(!address || address===null){
    return { status:"success",message : "No Record Found" };
  }
  return { status:"success",address }
}
// not in use as of now we are using native contacts
const getContactList = async(req) => {
  try{
    const user = await User.findAll({where:{user_id:req.query.user_id}})
    if(!user||user==""){
      throw new ApiError(httpStatus.BAD_REQUEST, "Invalid UserId");
    }
     
    conditions = {[Op.and]:[{user_id:{[Op.ne]:`${1}`}},
      { user_id: { [Op.ne]: `${req.query.user_id}` } }, { is_email_verified: { [Op.ne]: `${0}` } }, { is_active:1}]};
  if (req.query.user_name) {
    conditions = [{
      [Op.and]:[{user_id:{[Op.ne]:`${1}`}},
                {user_id:{[Op.ne]:`${req.query.user_id}`}},
                {is_email_verified:{[Op.ne]:`${0}`}},
                { is_active:1}],
      [Op.or]: [{first_name:{[Op.like]:`%${req.query.user_name}%`}},
                {last_name:{[Op.like]:`%${req.query.user_name}%`}}],
    }]
  }
    const userList = await User.findAll({where:conditions,attributes : ["user_id","first_name","last_name","profile_pic","email","phone_number"],
    include: [
      {
        attributes: ["latitude","longitude","address","city","state","zipcode"],
        model: Address,
        required: false
      }
      ],
      order: [["first_name", "ASC"]]
});
if(!userList||userList==""){
  return {status:"success",message:"No Record Found"}
}
return { status:"success",userList };
}catch(e){
  throw new ApiError(
    httpStatus.INTERNAL_SERVER_ERROR,
    "Something went wrong "+e
  );
}
 }

//getting userslist
const getUserList = async(req) => {
  const search=req.query.search==null?"":req.query.search
  const email=req.query.email==null?"":req.query.email
  const page=req.query.page==null?1:req.query.page
  const size=req.query.size==null?10:req.query.size
  const field=(req.query.sortBy!=null && req.query.sortBy!="" && req.query.sortBy==="userroute_count"||"userdevice_count")?"":"u."
  const sortBy=(req.query.sortBy!=null && req.query.sortBy!="") ? req.query.sortBy : "created_at";
  const sortType=(req.query.sortType!=null && req.query.sortType!="") ? req.query.sortType : "asc";
  const pageNo = parseInt(page, 10) || 1;
  const offset=((pageNo-1)*size);
  const limit = parseInt(size, 10)
  try{

    const usersCount = await (sequelize.query((`select count(*) from (SELECT u.user_id,u.first_name,u.last_name,u.profile_pic,u.email,u.phone_number,u.is_email_verified,count(distinct ud.user_device_id) as userdevice_count,
    count(distinct ur.route_id) as userroute_count
    FROM users  u
    LEFT JOIN user_devices ud ON u.user_id = ud.user_id
    LEFT JOIN user_routes ur ON u.user_id = ur.created_by and route_status!=0
    where ((u.first_name like '%${search}%' or u.last_name like '%${search}%' or CONCAT_WS(' ',u.first_name,u.last_name) LIKE '\%${search}%\') and u.email like'\%${email}%\')
    group by u.user_id) as counts`)))
   
    const userLists = await (sequelize.query((`SELECT u.user_id,u.first_name,u.last_name,u.profile_pic,u.email,u.phone_number,u.is_email_verified,count(distinct ud.user_device_id) as userdevice_count,
    count(distinct ur.route_id) as userroute_count
    FROM users  u
    LEFT JOIN user_devices ud ON u.user_id = ud.user_id
    LEFT JOIN user_routes ur ON u.user_id = ur.created_by and route_status!=0
    where ((u.first_name like '%${search}%' or u.last_name like '%${search}%' or CONCAT_WS(' ',u.first_name,u.last_name) LIKE '\%${search}%\') and u.email like'\%${email}%\')
    group by u.user_id order by ${field} ${sortBy} ${sortType} limit ${limit} offset ${offset} `)))

    return { status:"success",  page,
    totalResults: usersCount[0][0]['count(*)'],
    nextPage: (usersCount[0][0]['count(*)'] > size*page) ? true : false,
    results: userLists[0]
  };
}catch(e){
  throw new ApiError(
    httpStatus.INTERNAL_SERVER_ERROR,
    "Something went wrong "+e
  );
}
}
const updateUserProfile=async(req)=>{
  try {
    const userId=await User.findOne({where:{user_id:req.body.user_id}})
    if(!userId ||userId==""){
        throw new ApiError(
          httpStatus.INTERNAL_SERVER_ERROR,
          "UserId not Found"
        );
    }else{
    const user=await User.findOne({where:{[Op.and]: [
      { phone_number: { [Op.eq]: req.body.phone_number} },
    ],user_id:{[Op.ne]:req.body.user_id},is_active:1}
    })
    if(user){
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Phone Number is already in use"
      );
    } else {
    
      await User.update({
        first_name: await capitalizeFirstLetter(req.body.first_name) ,
        last_name:await capitalizeFirstLetter(req.body.last_name),
        phone_number:req.body.phone_number,
        profile_pic:req.body.profile_pic
      },{where:{user_id:req.body.user_id}});
      const user = await userDetails(req.body.user_id)
     return{status:"success",message:"Profile Updated Successfully",user}  
    }
    
  }
  } catch (error) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Something went wrong "+error
    );
  }
}

const userDetails = async (user_id) => {
  let image_Url = ""
  picture = await User.findOne({
    where: { user_id:user_id },
  });
 
  if (picture && picture.profile_pic != "") {
    image_Url = await getSignedURL(picture.profile_pic, "GET");
  } else {
    image_Url= "";
  }
  const userDetail = await User.findOne({
    where: {
      user_id: {
        [Op.eq]: `${user_id}`,
      },
    },
    attributes: [
      "user_id",
      "first_name",
      "last_name",
      "phone_number",
      "email",
      "createdAt",
      "updatedAt",
    ],

    include: [
      {
        model: UserDevice,
        as: "user_devices",
        where: { user_id: { [Op.eq]: `${user_id}` } },
      },
    ],
    order: [[UserDevice, "last_login", "DESC"]],
  });
  if (!userDetail || userDetail == "") {
    throw new ApiError(httpStatus.BAD_REQUEST, "No Record Found");
  }
  return {
    userDetail: userDetail,
    image_Url
  };
};


//getting user details for admin page and this api is not in use
const userRouteDetails = async (req) => {
  const user=await User.findOne({ 
    attributes: ["user_id","first_name","last_name"],
    where: { user_id:req.query.user_id }});
  if(!user||user==""){
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid UserId");
  }
  let conditions={created_by:req.query.user_id}
  conditions.route_status={[Op.ne]:0};
  if(req.query){
    conditions.created_by=req.query.user_id
  if(req.query.route_status){
    switch (req.query.route_status) {
      case "Not Started":
        conditions.route_status=1
        break;
      case "Inprogress":
        conditions.route_status=2
        break;
        case "Completed":
          conditions.route_status=3
        break;
      case "Deleted":
        conditions.route_status=0
        break;
    }
  }
  if(req.query.name){
    conditions.route_name={[Op.like]:`%${req.query.name}%`}
  }
}
  let search={where:conditions,attributes:[
          "route_id",
          "route_name",
           "start_latitude",
           "start_longitude",
           "start_address",
           "end_latitude",
           "end_longitude",
           "end_address",
           "distance" ,
          "start_date",
          "started_date",
          // "start_time",
          "started_date",
          "end_date",
          "route_status",
          "created_by",
          "updated_by",
        [Sequelize.literal('CASE WHEN route_status = 1 THEN "Not Started" WHEN route_status = 2 THEN "In-Progress" WHEN route_status = 3 THEN "Completed" WHEN route_status = 0 THEN "Deleted" END'), 'route_status'],
        [ Sequelize.literal( ('case when distance is not null then (truncate(distance ,3)) else " "  end')) , `distance` ]
        ]}
  const userRoutedetails=await paginate(UserRoutes, req.query,search);
  return {
    status:"success",
    user,
    userRoutedetails
  };
};

//deleting the user account
const deleteUserAccount= async (req) => {
  const user = await User.findOne({ where: { user_id: req.body.user_id } });
  if (!user || user === null) {
    return { status: "success", message: "No Record Found" };
  }
  //soft deleting the record in db
  await User.update({
    is_active: 0,
    
  }, { where: { user_id: req.body.user_id } })
  await Token.destroy({
    where: { user_id: req.body.user_id },
    truncate: false,
  });
  return {
    status: "success",
    message:"User Deleted Successfully"
  }
  
}
//checking the user is active or not
const checkActiveUser = async (user_id) => {
  const checkActiveUser = await User.findOne({
    where: {
      is_active:1,
      is_email_verified:1,
      user_id:user_id
    }
  });
  if (checkActiveUser) {
    return true;
  }else {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid user_id");
  }
};


//activateuseraccount the user account
const activateuseraccount= async (req) => {
  const user = await User.findOne({ where: { user_id: req.body.user_id } });
  if (!user || user === null) {
    return { status: "success", message: "No Record Found" };
  }
  // activateuseraccount the record in db
  await User.update({
    is_active: 1,
    
  }, { where: { user_id: req.body.user_id } })

  return {
    status: "success",
    message:"User Account Activated Successfully"
  }
  
}

module.exports = {
  createAddress,
  updateAddress,
  getAddress,
  getContactList,
  getUserList,
  updateUserProfile,
  userDetails,
  userRouteDetails,
  deleteUserAccount,
  checkActiveUser,
  activateuseraccount

};
