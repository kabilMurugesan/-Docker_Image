const express = require("express");
const authRoute = require("./v1/auth/auth.route");
const s3Route = require("./s3.route");
const bannerRoute = require("./v1/banner/banner.route");
const sharedRoute = require("./v1/sharedRoute/sharedRoute.route");
const userRoute = require("./v1/userRoute/userRoute.route");
const chatRoute = require("./v1/chat/chat.route");
const user = require("./v1/user/user.route");
const inviteeRoute = require("./v1/invitees/invitees.route");
const adminBannerRoute = require("./banner/banner.route");
const dashboardRoute = require("./dashboard/dashboard.route")
const adminRoute=require("./admin/admin.route")


const router = express.Router();
const defaultRoutes = [
  {
    path: "/v1/auth",
    route: authRoute,
  },
  {
    path: "/v1/userroute",
    route: userRoute,
  },
  {
    path: "/v1/s3",
    route: s3Route,
  },
  {
    path: "/v1/banner",
    route: bannerRoute,
  },
  {
    path: "/admin/banner",
    route: adminBannerRoute,
  },
  {
    path: "/v1/sharedroute",
    route: sharedRoute,
  },
  {
    path: "/v1/map",
    route: chatRoute,
  },
  {
    path: "/v1/user",
    route: user,
  },
  {
    path: "/v1/invitees",
    route: inviteeRoute,
  },
  {
    path:"/admin/dashboard",
    route:dashboardRoute
  },
  {
    path: "/admin",
    route: adminRoute
  }
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

module.exports = router;
