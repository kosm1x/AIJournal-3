import { ObjectId } from 'mongodb';

export type EntryType = 'context' | 'objectives' | 'mindmap' | 'ideate' | 'track';

export interface Emotion {
  emotion: string;
  intensity: number;
}

export interface Objective {
  title: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: number;
  dueDate?: Date;
}

export interface MindMapNode {
  id: string;
  content: string;
  parentId?: string;
}

export interface TrackingMetric {
  name: string;
  value: any;
  unit: string;
}

export interface Habit {
  name: string;
  completed: boolean;
  notes?: string;
}

export interface JournalEntry {
  _id?: ObjectId;
  user: ObjectId;
  content: string;
  type: EntryType;
  metadata: {
    emotions: Emotion[];
    keywords: string[];
    aiTags: string[];
    vectorEmbedding?: number[];
  };
  relationships: {
    parentEntry?: ObjectId;
    relatedEntries: ObjectId[];
  };
  objectives: Objective[];
  mindmap: {
    nodes: MindMapNode[];
  };
  tracking: {
    metrics: TrackingMetric[];
    habits: Habit[];
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateJournalEntryDTO {
  content: string;
  type: EntryType;
  metadata?: Partial<JournalEntry['metadata']>;
  relationships?: Partial<JournalEntry['relationships']>;
  objectives?: Objective[];
  mindmap?: {
    nodes: MindMapNode[];
  };
  tracking?: {
    metrics: TrackingMetric[];
    habits: Habit[];
  };
}