const express = require('express');
const Membership = require('../models/Membership');
const Club = require('../models/Club');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Join club (create membership)
router.post('/join/:clubId', verifyToken, async (req, res) => {
  try {
    const { clubId } = req.params;
    const { paymentId } = req.body;
    
    const club = await Club.findById(clubId);
    if (!club || club.status !== 'approved') {
      return res.status(404).json({ message: 'Club not found or not approved' });
    }
    
    // Check if already a member
    const existingMembership = await Membership.findOne({
      userEmail: req.user.email,
      clubId
    });
    
    if (existingMembership) {
      return res.status(400).json({ message: 'Already a member of this club' });
    }
    
    // For paid clubs, require payment
    if (club.membershipFee > 0 && !paymentId) {
      return res.status(400).json({ message: 'Payment required for this club' });
    }
    
    const membership = new Membership({
      userEmail: req.user.email,
      clubId,
      paymentId,
      status: 'active'
    });
    
    await membership.save();
    
    // Update club member count
    await Club.findByIdAndUpdate(clubId, { $inc: { memberCount: 1 } });
    
    res.status(201).json({
      message: 'Successfully joined the club',
      membership
    });
  } catch (error) {
    console.error('Join club error:', error);
    res.status(500).json({ message: 'Failed to join club' });
  }
});

// Get user's memberships
router.get('/my-memberships', verifyToken, async (req, res) => {
  try {
    const memberships = await Membership.find({ userEmail: req.user.email })
      .populate('clubId', 'clubName location category bannerImage membershipFee')
      .sort({ createdAt: -1 });
    
    res.json(memberships);
  } catch (error) {
    console.error('Get memberships error:', error);
    res.status(500).json({ message: 'Failed to fetch memberships' });
  }
});

// Get club members (for club managers)
router.get('/club/:clubId', verifyToken, async (req, res) => {
  try {
    const { clubId } = req.params;
    
    // Verify club ownership or admin role
    const club = await Club.findById(clubId);
    if (!club) {
      return res.status(404).json({ message: 'Club not found' });
    }
    
    if (club.managerEmail !== req.user.email && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const memberships = await Membership.find({ clubId })
      .sort({ createdAt: -1 });
    
    res.json(memberships);
  } catch (error) {
    console.error('Get club members error:', error);
    res.status(500).json({ message: 'Failed to fetch club members' });
  }
});

module.exports = router;