const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  clubId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Club',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  eventDate: {
    type: Date,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  isPaid: {
    type: Boolean,
    default: false
  },
  eventFee: {
    type: Number,
    default: 0,
    min: 0
  },
  maxAttendees: {
    type: Number,
    default: null
  },
  currentAttendees: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Event', eventSchema);