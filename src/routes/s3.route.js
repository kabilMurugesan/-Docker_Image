const express = require('express');
const httpStatus = require('http-status');
const Joi = require('joi');
const auth = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const catchAsync = require('../utils/catchAsync');
const { upload, getSignedURL } = require('../utils/s3');

const router = express.Router();

/**
 * Upload file to s3
 */
router.route('/upload').post(
  auth('fileupload'),
  catchAsync(async (req, res) => {
    const multipleUpload = upload.array('files');
    multipleUpload(req, res, function (err) {
      if (err) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR).send('Upload failed');
      } else {
        const uploadedFiles = req.files.map(function (file) {
          return { url: file.location, name: file.key, type: file.mimetype, size: file.size };
        });
        res.status(httpStatus.OK).send(uploadedFiles);
      }
    });
  })
);

/**
 * Obtain an AWS S3 Presigned Url to view or download a file
 * {Params} fileName
 */
router.route('/get-presigned-url').get(
  validate({
    query: Joi.object()
      .keys({
        fileName: Joi.string().required(),
      })
      .unknown(true),
  }),
  catchAsync(async (req, res) => {
    const { fileName } = req.query;
    const signedUrl = await getSignedURL(fileName, 'GET');
    res.send({ url: signedUrl });
  })
);

/**
 * Obtain an AWS S3 pre-signed URL for uploading files
 * {Params} fileName
 */
router.route('/put-presigned-url').get(
 //auth('fileupload'),
  validate({
    query: Joi.object()
      .keys({
        fileName: Joi.string().required(),
      })
      .unknown(true),
  }),
  catchAsync(async (req, res) => {
    const { fileName } = req.query;
    const signedUrl = await getSignedURL(fileName, 'PUT');
    res.send({ url: signedUrl });
  })
);

module.exports = router;
