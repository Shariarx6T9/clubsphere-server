const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Payment = require('../models/Payment');
const Club = require('../models/Club');
const Event = require('../models/Event');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Create payment intent for membership
router.post('/create-membership-payment', verifyToken, async (req, res) => {
  try {
    const { clubId } = req.body;
    
    const club = await Club.findById(clubId);
    if (!club || club.status !== 'approved') {
      return res.status(404).json({ message: 'Club not found or not approved' });
    }
    
    if (club.membershipFee === 0) {
      return res.status(400).json({ message: 'This club is free to join' });
    }
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(club.membershipFee * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        type: 'membership',
        clubId: clubId,
        userEmail: req.user.email
      }
    });
    
    // Save payment record
    const payment = new Payment({
      userEmail: req.user.email,
      amount: club.membershipFee,
      type: 'membership',
      clubId,
      stripePaymentIntentId: paymentIntent.id,
      status: 'pending'
    });
    
    await payment.save();
    
    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentId: payment._id
    });
  } catch (error) {
    console.error('Create membership payment error:', error);
    res.status(500).json({ message: 'Failed to create payment' });
  }
});

// Create payment intent for event
router.post('/create-event-payment', verifyToken, async (req, res) => {
  try {
    const { eventId } = req.body;
    
    const event = await Event.findById(eventId).populate('clubId');
    if (!event || event.clubId.status !== 'approved') {
      return res.status(404).json({ message: 'Event not found or club not approved' });
    }
    
    if (!event.isPaid || event.eventFee === 0) {
      return res.status(400).json({ message: 'This event is free' });
    }
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(event.eventFee * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        type: 'event',
        eventId: eventId,
        clubId: event.clubId._id.toString(),
        userEmail: req.user.email
      }
    });
    
    // Save payment record
    const payment = new Payment({
      userEmail: req.user.email,
      amount: event.eventFee,
      type: 'event',
      clubId: event.clubId._id,
      eventId,
      stripePaymentIntentId: paymentIntent.id,
      status: 'pending'
    });
    
    await payment.save();
    
    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentId: payment._id
    });
  } catch (error) {
    console.error('Create event payment error:', error);
    res.status(500).json({ message: 'Failed to create payment' });
  }
});

// Confirm payment
router.post('/confirm-payment', verifyToken, async (req, res) => {
  try {
    const { paymentIntentId } = req.body;
    
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status === 'succeeded') {
      await Payment.findOneAndUpdate(
        { stripePaymentIntentId: paymentIntentId },
        { status: 'succeeded' }
      );
      
      res.json({ message: 'Payment confirmed successfully' });
    } else {
      res.status(400).json({ message: 'Payment not successful' });
    }
  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({ message: 'Failed to confirm payment' });
  }
});

// Get user's payment history
router.get('/my-payments', verifyToken, async (req, res) => {
  try {
    const payments = await Payment.find({ userEmail: req.user.email })
      .populate('clubId', 'clubName')
      .populate('eventId', 'title')
      .sort({ createdAt: -1 });
    
    res.json(payments);
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ message: 'Failed to fetch payments' });
  }
});

// Get all payments (Admin only)
router.get('/admin/all', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    const payments = await Payment.find({})
      .populate('clubId', 'clubName')
      .populate('eventId', 'title')
      .sort({ createdAt: -1 });
    
    res.json(payments);
  } catch (error) {
    console.error('Get all payments error:', error);
    res.status(500).json({ message: 'Failed to fetch payments' });
  }
});

module.exports = router;