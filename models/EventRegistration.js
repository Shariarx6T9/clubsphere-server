const mongoose = require('mongoose');

const eventRegistrationSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  userEmail: {
    type: String,
    required: true
  },
  clubId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Club',
    required: true
  },
  status: {
    type: String,
    enum: ['registered', 'cancelled'],
    default: 'registered'
  },
  paymentId: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Compound index to ensure one registration per user per event
eventRegistrationSchema.index({ eventId: 1, userEmail: 1 }, { unique: true });

module.exports = mongoose.model('EventRegistration', eventRegistrationSchema);