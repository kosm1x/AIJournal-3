const mongoose = require('mongoose');

const entrySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['context', 'objectives', 'mindmap', 'ideate', 'track'],
    required: true
  },
  metadata: {
    emotions: [{
      emotion: String,
      intensity: Number
    }],
    keywords: [String],
    aiTags: [String],
    vectorEmbedding: [Number] // For semantic search capabilities
  },
  relationships: {
    parentEntry: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Entry'
    },
    relatedEntries: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Entry'
    }]
  },
  objectives: [{
    title: String,
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'cancelled'],
      default: 'pending'
    },
    priority: {
      type: Number,
      min: 1,
      max: 5
    },
    dueDate: Date
  }],
  mindmap: {
    nodes: [{
      id: String,
      content: String,
      parentId: String
    }]
  },
  tracking: {
    metrics: [{
      name: String,
      value: mongoose.Schema.Types.Mixed,
      unit: String
    }],
    habits: [{
      name: String,
      completed: Boolean,
      notes: String
    }]
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
entrySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Index for text search
entrySchema.index({ content: 'text' });

// Index for user + date queries
entrySchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Entry', entrySchema);