const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Entry = require('../models/entry');

// Get emotional analysis for a time period
router.get('/emotions', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const entries = await Entry.find({
      user: req.user.userId,
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    }).select('metadata.emotions createdAt');

    res.json(entries);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching emotional analysis' });
  }
});

// Get objectives progress
router.get('/objectives/progress', auth, async (req, res) => {
  try {
    const entries = await Entry.find({
      user: req.user.userId,
      type: 'objectives'
    }).select('objectives createdAt');

    res.json(entries);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching objectives progress' });
  }
});

// Get habit tracking statistics
router.get('/tracking/habits', auth, async (req, res) => {
  try {
    const entries = await Entry.find({
      user: req.user.userId,
      type: 'track'
    }).select('tracking.habits createdAt');

    res.json(entries);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching habit statistics' });
  }
});

// Generate mind map from entries
router.post('/mindmap/generate', auth, async (req, res) => {
  try {
    const { entryIds } = req.body;
    
    const entries = await Entry.find({
      _id: { $in: entryIds },
      user: req.user.userId
    });

    // TODO: Implement mind map generation logic
    res.json({ message: 'Mind map generation endpoint (to be implemented)' });
  } catch (error) {
    res.status(500).json({ message: 'Error generating mind map' });
  }
});

module.exports = router;