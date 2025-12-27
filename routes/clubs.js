const express = require('express');
const Club = require('../models/Club');
const Membership = require('../models/Membership');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get all clubs (public) with search, filter, and sort
router.get('/', async (req, res) => {
  try {
    const { search, category, sort = 'createdAt', order = 'desc', page = 1, limit = 12 } = req.query;
    
    let query = { status: 'approved' };
    
    // Search by club name
    if (search) {
      query.clubName = { $regex: search, $options: 'i' };
    }
    
    // Filter by category
    if (category && category !== 'all') {
      query.category = category;
    }
    
    // Sort options
    const sortOptions = {};
    sortOptions[sort] = order === 'asc' ? 1 : -1;
    
    const clubs = await Club.find(query)
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Club.countDocuments(query);
    
    res.json({
      clubs,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get clubs error:', error);
    res.status(500).json({ message: 'Failed to fetch clubs' });
  }
});

// Get featured clubs (for homepage)
router.get('/featured', async (req, res) => {
  try {
    const clubs = await Club.find({ status: 'approved' })
      .sort({ memberCount: -1, createdAt: -1 })
      .limit(6);
    
    res.json(clubs);
  } catch (error) {
    console.error('Get featured clubs error:', error);
    res.status(500).json({ message: 'Failed to fetch featured clubs' });
  }
});

// Get single club
router.get('/:id', async (req, res) => {
  try {
    const club = await Club.findById(req.params.id);
    
    if (!club) {
      return res.status(404).json({ message: 'Club not found' });
    }
    
    res.json(club);
  } catch (error) {
    console.error('Get club error:', error);
    res.status(500).json({ message: 'Failed to fetch club' });
  }
});

// Create club (Club Manager only)
router.post('/', verifyToken, requireRole(['clubManager']), async (req, res) => {
  try {
    const { clubName, description, category, location, bannerImage, membershipFee } = req.body;
    
    const club = new Club({
      clubName,
      description,
      category,
      location,
      bannerImage,
      membershipFee: membershipFee || 0,
      managerEmail: req.user.email,
      status: 'pending'
    });
    
    await club.save();
    
    res.status(201).json({
      message: 'Club created successfully and pending approval',
      club
    });
  } catch (error) {
    console.error('Create club error:', error);
    res.status(500).json({ message: 'Failed to create club' });
  }
});

// Update club (Club Manager only - own clubs)
router.put('/:id', verifyToken, requireRole(['clubManager']), async (req, res) => {
  try {
    const club = await Club.findById(req.params.id);
    
    if (!club) {
      return res.status(404).json({ message: 'Club not found' });
    }
    
    if (club.managerEmail !== req.user.email) {
      return res.status(403).json({ message: 'You can only update your own clubs' });
    }
    
    const { clubName, description, category, location, bannerImage, membershipFee } = req.body;
    
    club.clubName = clubName || club.clubName;
    club.description = description || club.description;
    club.category = category || club.category;
    club.location = location || club.location;
    club.bannerImage = bannerImage || club.bannerImage;
    club.membershipFee = membershipFee !== undefined ? membershipFee : club.membershipFee;
    
    await club.save();
    
    res.json({
      message: 'Club updated successfully',
      club
    });
  } catch (error) {
    console.error('Update club error:', error);
    res.status(500).json({ message: 'Failed to update club' });
  }
});

// Get clubs for manager
router.get('/manager/my-clubs', verifyToken, requireRole(['clubManager']), async (req, res) => {
  try {
    const clubs = await Club.find({ managerEmail: req.user.email });
    res.json(clubs);
  } catch (error) {
    console.error('Get manager clubs error:', error);
    res.status(500).json({ message: 'Failed to fetch your clubs' });
  }
});

// Admin routes
router.get('/admin/all', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const { status } = req.query;
    let query = {};
    
    if (status) {
      query.status = status;
    }
    
    const clubs = await Club.find(query).sort({ createdAt: -1 });
    res.json(clubs);
  } catch (error) {
    console.error('Get all clubs error:', error);
    res.status(500).json({ message: 'Failed to fetch clubs' });
  }
});

// Approve/Reject club (Admin only)
router.patch('/:id/status', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    const club = await Club.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    
    if (!club) {
      return res.status(404).json({ message: 'Club not found' });
    }
    
    res.json({
      message: `Club ${status} successfully`,
      club
    });
  } catch (error) {
    console.error('Update club status error:', error);
    res.status(500).json({ message: 'Failed to update club status' });
  }
});

module.exports = router;