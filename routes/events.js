const express = require('express');
const Event = require('../models/Event');
const Club = require('../models/Club');
const EventRegistration = require('../models/EventRegistration');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get all events (public) with search and sort
router.get('/', async (req, res) => {
  try {
    const { search, sort = 'eventDate', order = 'asc', page = 1, limit = 12 } = req.query;
    
    let query = {};
    
    // Only show events from approved clubs
    const approvedClubs = await Club.find({ status: 'approved' }).select('_id');
    const clubIds = approvedClubs.map(club => club._id);
    query.clubId = { $in: clubIds };
    
    // Search by event title
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }
    
    // Sort options
    const sortOptions = {};
    sortOptions[sort] = order === 'asc' ? 1 : -1;
    
    const events = await Event.find(query)
      .populate('clubId', 'clubName location')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Event.countDocuments(query);
    
    res.json({
      events,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ message: 'Failed to fetch events' });
  }
});

// Get upcoming events (for homepage)
router.get('/upcoming', async (req, res) => {
  try {
    const approvedClubs = await Club.find({ status: 'approved' }).select('_id');
    const clubIds = approvedClubs.map(club => club._id);
    
    const events = await Event.find({
      clubId: { $in: clubIds },
      eventDate: { $gte: new Date() }
    })
      .populate('clubId', 'clubName location')
      .sort({ eventDate: 1 })
      .limit(6);
    
    res.json(events);
  } catch (error) {
    console.error('Get upcoming events error:', error);
    res.status(500).json({ message: 'Failed to fetch upcoming events' });
  }
});

// Get single event
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('clubId', 'clubName location managerEmail');
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    res.json(event);
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({ message: 'Failed to fetch event' });
  }
});

// Create event (Club Manager only)
router.post('/', verifyToken, requireRole(['clubManager']), async (req, res) => {
  try {
    const { clubId, title, description, eventDate, location, isPaid, eventFee, maxAttendees } = req.body;
    
    // Verify club ownership
    const club = await Club.findById(clubId);
    if (!club || club.managerEmail !== req.user.email) {
      return res.status(403).json({ message: 'You can only create events for your own clubs' });
    }
    
    const event = new Event({
      clubId,
      title,
      description,
      eventDate,
      location,
      isPaid: isPaid || false,
      eventFee: isPaid ? eventFee : 0,
      maxAttendees
    });
    
    await event.save();
    
    res.status(201).json({
      message: 'Event created successfully',
      event
    });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ message: 'Failed to create event' });
  }
});

// Update event (Club Manager only)
router.put('/:id', verifyToken, requireRole(['clubManager']), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('clubId');
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    if (event.clubId.managerEmail !== req.user.email) {
      return res.status(403).json({ message: 'You can only update events for your own clubs' });
    }
    
    const { title, description, eventDate, location, isPaid, eventFee, maxAttendees } = req.body;
    
    event.title = title || event.title;
    event.description = description || event.description;
    event.eventDate = eventDate || event.eventDate;
    event.location = location || event.location;
    event.isPaid = isPaid !== undefined ? isPaid : event.isPaid;
    event.eventFee = isPaid ? eventFee : 0;
    event.maxAttendees = maxAttendees || event.maxAttendees;
    
    await event.save();
    
    res.json({
      message: 'Event updated successfully',
      event
    });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ message: 'Failed to update event' });
  }
});

// Delete event (Club Manager only)
router.delete('/:id', verifyToken, requireRole(['clubManager']), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('clubId');
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    if (event.clubId.managerEmail !== req.user.email) {
      return res.status(403).json({ message: 'You can only delete events for your own clubs' });
    }
    
    await Event.findByIdAndDelete(req.params.id);
    await EventRegistration.deleteMany({ eventId: req.params.id });
    
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ message: 'Failed to delete event' });
  }
});

// Get events for manager's clubs
router.get('/manager/my-events', verifyToken, requireRole(['clubManager']), async (req, res) => {
  try {
    const clubs = await Club.find({ managerEmail: req.user.email }).select('_id');
    const clubIds = clubs.map(club => club._id);
    
    const events = await Event.find({ clubId: { $in: clubIds } })
      .populate('clubId', 'clubName')
      .sort({ eventDate: -1 });
    
    res.json(events);
  } catch (error) {
    console.error('Get manager events error:', error);
    res.status(500).json({ message: 'Failed to fetch your events' });
  }
});

// Register for event (Members only)
router.post('/:id/register', verifyToken, requireRole(['member']), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('clubId');
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Check if event is in the past
    if (new Date(event.eventDate) < new Date()) {
      return res.status(400).json({ message: 'Cannot register for past events' });
    }
    
    // Check if event is full
    if (event.maxAttendees) {
      const currentRegistrations = await EventRegistration.countDocuments({ 
        eventId: req.params.id, 
        status: 'registered' 
      });
      
      if (currentRegistrations >= event.maxAttendees) {
        return res.status(400).json({ message: 'Event is full' });
      }
    }
    
    // Check if user is already registered
    const existingRegistration = await EventRegistration.findOne({
      eventId: req.params.id,
      userEmail: req.user.email
    });
    
    if (existingRegistration) {
      return res.status(400).json({ message: 'You are already registered for this event' });
    }
    
    // Create registration
    const registration = new EventRegistration({
      eventId: req.params.id,
      userEmail: req.user.email,
      clubId: event.clubId._id
    });
    
    await registration.save();
    
    // Update event's current attendees count
    const newCount = await EventRegistration.countDocuments({ 
      eventId: req.params.id, 
      status: 'registered' 
    });
    
    await Event.findByIdAndUpdate(req.params.id, { 
      currentAttendees: newCount 
    });
    
    res.status(201).json({
      message: 'Successfully registered for event',
      registration
    });
  } catch (error) {
    console.error('Event registration error:', error);
    res.status(500).json({ message: 'Failed to register for event' });
  }
});

// Unregister from event (Members only)
router.delete('/:id/register', verifyToken, requireRole(['member']), async (req, res) => {
  try {
    const registration = await EventRegistration.findOne({
      eventId: req.params.id,
      userEmail: req.user.email
    });
    
    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }
    
    await EventRegistration.findByIdAndDelete(registration._id);
    
    // Update event's current attendees count
    const newCount = await EventRegistration.countDocuments({ 
      eventId: req.params.id, 
      status: 'registered' 
    });
    
    await Event.findByIdAndUpdate(req.params.id, { 
      currentAttendees: newCount 
    });
    
    res.json({ message: 'Successfully unregistered from event' });
  } catch (error) {
    console.error('Event unregistration error:', error);
    res.status(500).json({ message: 'Failed to unregister from event' });
  }
});

// Check registration status for event
router.get('/:id/registration-status', verifyToken, async (req, res) => {
  try {
    const registration = await EventRegistration.findOne({
      eventId: req.params.id,
      userEmail: req.user.email,
      status: 'registered'
    });
    
    res.json(registration);
  } catch (error) {
    console.error('Check registration status error:', error);
    res.status(500).json({ message: 'Failed to check registration status' });
  }
});

module.exports = router;