const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const Entry = require('../models/entry');
const { ENTRY_TYPES, ERRORS } = require('../config/constants');

// Get all entries for a user
router.get('/', auth, async (req, res) => {
  try {
    const entries = await Entry.find({ user: req.user.userId })
      .sort({ createdAt: -1 })
      .limit(10);
    res.json(entries);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching entries' });
  }
});

// Create new entry
router.post('/',
  auth,
  [
    body('content').notEmpty(),
    body('type').isIn(Object.values(ENTRY_TYPES))
  ],
  async (req, res) => {
    try {
      const { content, type, metadata = {}, relationships = {} } = req.body;

      const entry = new Entry({
        user: req.user.userId,
        content,
        type,
        metadata,
        relationships
      });

      await entry.save();
      res.status(201).json(entry);
    } catch (error) {
      res.status(500).json({ message: 'Error creating entry' });
    }
  }
);

// Get single entry
router.get('/:id', auth, async (req, res) => {
  try {
    const entry = await Entry.findOne({
      _id: req.params.id,
      user: req.user.userId
    });

    if (!entry) {
      return res.status(404).json({ message: ERRORS.ENTRY.NOT_FOUND });
    }

    res.json(entry);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching entry' });
  }
});

// Update entry
router.put('/:id',
  auth,
  [
    body('content').optional().notEmpty(),
    body('type').optional().isIn(Object.values(ENTRY_TYPES))
  ],
  async (req, res) => {
    try {
      const entry = await Entry.findOneAndUpdate(
        {
          _id: req.params.id,
          user: req.user.userId
        },
        {
          $set: req.body,
          updatedAt: new Date()
        },
        { new: true }
      );

      if (!entry) {
        return res.status(404).json({ message: ERRORS.ENTRY.NOT_FOUND });
      }

      res.json(entry);
    } catch (error) {
      res.status(500).json({ message: 'Error updating entry' });
    }
  }
);

// Delete entry
router.delete('/:id', auth, async (req, res) => {
  try {
    const entry = await Entry.findOneAndDelete({
      _id: req.params.id,
      user: req.user.userId
    });

    if (!entry) {
      return res.status(404).json({ message: ERRORS.ENTRY.NOT_FOUND });
    }

    res.json({ message: 'Entry deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting entry' });
  }
});

module.exports = router;