const mongoose = require('mongoose');

const ideaSchema = new mongoose.Schema({
  bookName: String,
  idea: String,
  user: String, // username of creator
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Idea', ideaSchema);
