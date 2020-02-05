module.exports = (app) => {
  const mongoose = require('mongoose');
  const requireAll = require('require-all');
  const path = require('path');

  mongoose.connect('mongodb://localhost:27017/express-react-lol', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  requireAll(path.resolve(__dirname, '../models'));
};
