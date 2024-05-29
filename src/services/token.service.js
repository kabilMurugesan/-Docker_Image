const jwt = require('jsonwebtoken');
const moment = require('moment');
const config = require('../config/config');
const { tokenTypes } = require('../config/tokens');
const db = require('../models');

const Token = db.token;

/**
 * Generate token
 * @param {ObjectId} id
 * @param {Moment} expires
 * @param {string} type
 * @param {string} [secret]
 * @returns {string}
 */
 const generateToken = (id, expires, type, secret = config.jwt.secret) => {
  const payload = {
    sub: id,
    iat: moment().unix(),
    exp: expires.unix(),
    type,
  };
  return jwt.sign(payload, secret);
};

const randomString = (length, chars) => {
  let mask = '';
  if (chars.indexOf('a') > -1) mask += 'abcdefghijklmnopqrstuvwxyz';
  if (chars.indexOf('A') > -1) mask += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (chars.indexOf('#') > -1) mask += '0123456789';
  if (chars.indexOf('!') > -1) mask += '~`!@#$%^&*()_+-={}[]:";\'<>?,./|\\';
  let result = '';
  for (let i = length; i > 0; i -= 1) result += mask[Math.round(Math.random() * (mask.length - 1))];
  return result;
};

/**
 * Save a token
 * @param {string} token
 * @param {ObjectId} id
 * @param {Moment} expires
 * @param {string} type
 * @param {boolean} [blacklisted]
 * @returns {Promise<Token>}
 */
const saveToken = async (token, id, expires, type, deviceType, deviceId, blacklisted = false, code = false) => {
  let createObj = {
    token,
    user_id: id,
    expires: expires.toDate(),
    type,
    device_type: deviceType ,
    device_id: deviceId,
    
  };

  if (code) {
    createObj = Object.assign(createObj, {
      code,
    });
  }
  const tokenValidate = await Token.findAll({ where: { token: token,type:type, device_type: deviceType, device_id: deviceId } })
  if (tokenValidate) {
    await Token.destroy({
      where: {
        type: type,
        user_id: id,
        device_type: deviceType,
        device_id: deviceId
      },
      truncate: false,
    });
    const tokenDoc = await Token.create(createObj);
    return tokenDoc
  }
  else {
    const tokenDoc = await Token.create(createObj);
    return tokenDoc;
  }
};

/**
 * Generate auth tokens
 * @param {User} user
 * @returns {Promise<Object>}
 */
const generateAuthTokens = async (user,deviceType,deviceId) => {
  const accessTokenExpires = moment().add(config.jwt.accessExpirationMinutes, 'minutes');
  const accessToken = generateToken(user.user_id, accessTokenExpires, tokenTypes.ACCESS);

  const refreshTokenExpires = moment().add(config.jwt.refreshExpirationDays, 'days');
  const refreshToken = generateToken(user.user_id, refreshTokenExpires, tokenTypes.REFRESH);
  await saveToken(refreshToken, user.user_id, refreshTokenExpires, tokenTypes.REFRESH, deviceType, deviceId);

  return {
    access: {
      token: accessToken,
      expires: accessTokenExpires.toDate(),
    },
    refresh: {
      token: refreshToken,
      expires: refreshTokenExpires.toDate(),
    },
  };
};

/**
 * Verify token and return token (or throw an error if it is not valid)
 * @param {string} token
 * @param {string} type
 * @returns {Promise<Token>}
 */
const verifyToken = async (token, type, code = false) => {
  const payload = jwt.verify(token, config.jwt.secret);
  const tokenDoc = await Token.findOne({
    where: {
      token: token,
      type: type,
      user_id: payload.sub
    }
  });
  if (!tokenDoc) {
    throw new Error('Token not found');
  }
  if (code && tokenDoc) {
    if (tokenDoc.code !== code) {
      throw new Error('Invalid Code');
    }
  }

  return tokenDoc;
};

/**
 * Generate reset password token
 * @param {string} email
 * @returns {Promise<string>}
 */
const generateResetPasswordToken = async ({ userId }) => {
  const resetTokenExpires = moment().add(config.jwt.resetPasswordExpirationMinutes, 'minutes');
  const resetPasswordToken = generateToken(userId, resetTokenExpires, tokenTypes.RESET_PASSWORD);
  await saveToken(resetPasswordToken, userId, resetTokenExpires, tokenTypes.RESET_PASSWORD);
  return resetPasswordToken;
};

const saveAdminToken = async (token, id, expires, type, blacklisted = false, code = false) => {
  let createObj = {
    token,
    user_id: id,
    expires: expires.toDate(),
    type
  };

  if (code) {
    createObj = Object.assign(createObj, {
      code,
    });
  }

    await Token.destroy({
      where: {
        type: type,
        user_id: id,
      },
      truncate: false,
    });
    const tokenDoc = await Token.create(createObj);
    return tokenDoc
}


const generateAdminAuthTokens = async (user) => {
  const accessTokenExpires = moment().add(config.jwt.accessExpirationMinutes, 'minutes');
  const accessToken = generateToken(user.user_id, accessTokenExpires, tokenTypes.ACCESS);

  const refreshTokenExpires = moment().add(config.jwt.refreshExpirationDays, 'days');
  const refreshToken = generateToken(user.user_id, refreshTokenExpires, tokenTypes.REFRESH);
  await saveAdminToken(refreshToken, user.user_id, refreshTokenExpires, tokenTypes.REFRESH);

  return {
    access: {
      token: accessToken,
      expires: accessTokenExpires.toDate(),
    },
    refresh: {
      token: refreshToken,
      expires: refreshTokenExpires.toDate(),
    },
  };
};

module.exports = {
  generateToken,
  generateAuthTokens,
  randomString,
  saveToken,
  verifyToken,
  generateResetPasswordToken,
  generateAdminAuthTokens,
  saveAdminToken
};
