const mongoose = require('mongoose');

const clubSchema = new mongoose.Schema({
  clubName: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Photography', 'Sports', 'Tech', 'Arts', 'Music', 'Books', 'Travel', 'Food', 'Fitness', 'Other']
  },
  location: {
    type: String,
    required: true
  },
  bannerImage: {
    type: String,
    default: ''
  },
  membershipFee: {
    type: Number,
    default: 0,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  managerEmail: {
    type: String,
    required: true
  },
  memberCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Club', clubSchema);