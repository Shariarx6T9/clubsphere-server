const mongoose = require('mongoose');

const membershipSchema = new mongoose.Schema({
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
    enum: ['active', 'expired', 'pendingPayment'],
    default: 'active'
  },
  paymentId: {
    type: String,
    default: null
  },
  expiresAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Compound index to ensure one membership per user per club
membershipSchema.index({ userEmail: 1, clubId: 1 }, { unique: true });

module.exports = mongoose.model('Membership', membershipSchema);