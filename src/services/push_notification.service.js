const OneSignal = require('onesignal-node');
const config = require('../config/config');

const client = new OneSignal.Client(config.onesignal.appid, config.onesignal.restapikey);


const sendPushNotification = async (title, heading, userId, data = {}) => {
  const notification = {
    headings: {
      en: title,
    },
    contents: {
      en: heading,
    },
    data,
    include_external_user_ids: userId,
  };
  try {
    const response = await client.createNotification(notification);
    return response.body;

  } catch (e) {

    if (e instanceof OneSignal.HTTPError) {
      console.log(e.statusCode);
      console.log(e.body);
    }

  }
}

module.exports = {
  sendPushNotification,
};