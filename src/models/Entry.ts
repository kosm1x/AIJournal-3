import { Schema, model } from 'mongoose';
import { JournalEntry } from '@/types';

const entrySchema = new Schema<JournalEntry>({
  user: {
    type: Schema.Types.ObjectId,
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
    vectorEmbedding: [Number]
  },
  relationships: {
    parentEntry: {
      type: Schema.Types.ObjectId,
      ref: 'Entry'
    },
    relatedEntries: [{
      type: Schema.Types.ObjectId,
      ref: 'Entry'
    }]
  },
  objectives: [{
    title: {
      type: String,
      required: true
    },
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
      id: {
        type: String,
        required: true
      },
      content: {
        type: String,
        required: true
      },
      parentId: String
    }]
  },
  tracking: {
    metrics: [{
      name: {
        type: String,
        required: true
      },
      value: Schema.Types.Mixed,
      unit: String
    }],
    habits: [{
      name: {
        type: String,
        required: true
      },
      completed: {
        type: Boolean,
        default: false
      },
      notes: String
    }]
  }
}, {
  timestamps: true
});

// Create indexes
entrySchema.index({ user: 1, createdAt: -1 });
entrySchema.index({ user: 1, type: 1 });
entrySchema.index({ content: 'text', 'metadata.keywords': 'text' });
entrySchema.index({ 'metadata.vectorEmbedding': '2dsphere' });

// Add hooks for related entries
entrySchema.pre('remove', async function(next) {
  try {
    // Remove references from other entries
    await this.model('Entry').updateMany(
      { 'relationships.relatedEntries': this._id },
      { $pull: { 'relationships.relatedEntries': this._id } }
    );
    next();
  } catch (error) {
    next(error as Error);
  }
});

export const EntryModel = model<JournalEntry>('Entry', entrySchema);