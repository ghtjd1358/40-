const session = require('express-session');
const MySQLStore = require('express-mysql-session');
const MySQLStoreSession = MySQLStore(session);
require('dotenv').config();

const options = {
  host: process.env.SERVERIPNO,
  port: process.env.MYSQLPORT,
  user: process.env.MYSQLUSERNAME,
  password: process.env.MYSQLUSERPASSWORD,
  database: '40_db'
}

const sessionStore = new MySQLStoreSession(options);

function getSessionConfig() {
  return {
    secret: process.env.SECRETKEY,
    resave: false,
    saveUninitialized: false,
    store : sessionStore,
    cookie: {
      httpOnly: true,
      maxAge:  14 * 24 * 60 * 60 * 1000,
    },
  };
}

module.exports = getSessionConfig;

