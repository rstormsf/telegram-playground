const mongoose = require('mongoose');
const Promise = require('bluebird');
const config = require('../config');


const db = mongoose.connection;

mongoose.Promise = Promise;
mongoose.connect(config.MONGODB_URL)
  .catch((err) => {
    console.log('Database connection error:', err.message);
  });

db.on('error', (err) => {
  console.log('Failed to connect to database server:', err.message);
});

db.once('open', () => {
  console.log('Connection to database established!');
});

module.exports = db;

