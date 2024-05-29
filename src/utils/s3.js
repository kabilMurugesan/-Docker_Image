const AWS = require("aws-sdk");
const multer = require("multer");
const multerS3 = require("multer-s3");
const config = require("../config/config");

AWS.config.update({
  accessKeyId: config.aws.accessKeyId,
  secretAccessKey: config.aws.secretAccessKey,
  signatureVersion: "v4",
  region: config.aws.defaultRegion,
});
const s3 = new AWS.S3();
const upload = multer({
  storage: multerS3({
    s3,
    acl: "public-read",
    bucket: config.aws.s3Bucket,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata(req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key(req, file, cb) {
      cb(null, Date.now().toString());
    },
  }),
});
const getSignedURL = async (Key, method = "GET") => {
  try {
    const signedUrlMethod =
      String(method).toUpperCase() === "PUT" ? "putObject" : "getObject";
    const url = await new AWS.S3().getSignedUrlPromise(signedUrlMethod, {
      Bucket: config.aws.s3Bucket,
      Key,
      Expires: Number(config.aws.signedUrlExpireSeconds),
    });
    return url;
  } catch (err) {
    return null;
  }
};
module.exports = { upload, getSignedURL };
