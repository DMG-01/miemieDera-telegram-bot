const mongoose = require('mongoose');

const connectDB = (url) => {
  return mongoose.connect(url); // No options needed
};

module.exports = connectDB;
