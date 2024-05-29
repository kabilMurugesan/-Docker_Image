const httpStatus = require("http-status");
const bcrypt = require("bcryptjs");
const Sequelize = require("sequelize");
const crypto = require("crypto");
const { Op } = Sequelize;
const db = require("../models");
const moment = require("moment");
const { now } = require("moment");
const User = db.user;
const Token = db.token;
const UserDevice = db.userDevice


const updateUserDeviceDetails = async (userId, deviceId, deviceType, deviceOs, installDate, uninstallDate, appVersion) => {
    const updateVersion = await UserDevice.findOne({ where: { user_id: userId, device_id: deviceId, latest_version: appVersion } })
    let deviceOsVersioncheck =[]
    let latestVersionDatecheck = []
    if (updateVersion) {
        if (updateVersion.latest_version === appVersion) {
            latestVersionDatecheck.push(updateVersion.latest_version_date)
            deviceOsVersioncheck.push(updateVersion.latest_version)
        } else {
            latestVersionDatecheck.push(date)
            deviceOsVersioncheck.push(appVersion)
            }
    } if (!updateVersion || updateVersion === null) {
        const date = moment().utc().startOf('minute').format('YYYY-MM-DD hh:mm:ss')
            latestVersionDatecheck.push(date)
        deviceOsVersioncheck.push(appVersion)
    }

    const userDevice = await UserDevice.findOne({ where: { user_id: userId, device_id: deviceId, device_type: deviceType } });
    const date = moment().utc().startOf('minute').format('YYYY-MM-DD hh:mm:ss')
    if (userDevice === null) {
        await UserDevice.create({
            device_id: deviceId,
            device_type: deviceType,
            device_os: deviceOs,
            user_id: userId,
            last_login: new Date(),
            latest_version: appVersion,
            first_install_date: installDate,
            latest_version_date: latestVersionDatecheck[0],
            uninstall_date: uninstallDate,
            first_install_date: date
        });
    } else {
      
        if (userDevice.device_type == deviceType && userDevice.device_id == deviceId && userDevice.latest_version == appVersion) {
            await UserDevice.update({ latest_version: appVersion, latest_version_date: latestVersionDatecheck[0], device_os: deviceOs, last_login: new Date() }, {
                where: {
                    user_id: userId,
                    device_id: deviceId,
                    device_type: deviceType
                },
                order: [["updatedAt", "DESC"]],
                limit: 1,
            });
        } else {
            await UserDevice.update({ latest_version: appVersion, latest_version_date: latestVersionDatecheck[0], device_os: deviceOs, last_login: new Date() }, {
                where: {
                    user_id: userId,
                    device_id: deviceId,
                    device_type: deviceType
                },
                order: [["updatedAt", "DESC"]],
                limit: 1,
            });
        }
    }
}

module.exports = {
    updateUserDeviceDetails
}