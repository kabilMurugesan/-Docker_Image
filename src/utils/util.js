/**
 * Create an object composed of the picked object properties
 * @param {Object} object
 * @param {string[]} keys
 * @returns {Object}
 */
const pick = (object, keys) => {
  return keys.reduce((obj, key) => {
    if (object && Object.prototype.hasOwnProperty.call(object, key)) {
      // eslint-disable-next-line no-param-reassign
      obj[key] = object[key];
    }
    return obj;
  }, {});
};
const omit = (obj, ...props) => {
  const result = { ...obj };
  props.forEach(function (prop) {
    if (Object.keys(prop).length) {
      Object.keys(prop).forEach((p) => {
        delete result[p];
      });
    } else {
      delete result[prop];
    }
  });
  return result;
};
module.exports = { pick, omit };
