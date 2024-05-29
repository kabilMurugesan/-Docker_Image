const Sequelize = require('sequelize');
const env = require('dotenv');

env.config();

const { DB_HOST, DB_PORT, DB_DATABASE, DB_USERNAME, DB_PASSWORD } = process.env;

const sequelize = new Sequelize(DB_DATABASE, DB_USERNAME, DB_PASSWORD, {
  dialect: 'mysql',
  host: DB_HOST,
  port: DB_PORT,
  logging: false
});

module.exports = sequelize;
