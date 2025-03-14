import { Service } from 'typedi';
import { ObjectId } from 'mongodb';
import { JournalEntry, CreateJournalEntryDTO } from '@/types';
import { IJournalService } from './interfaces/IJournalService';
import { EntryModel } from '@/models/Entry';
import { AIService } from './AIService';
import { AppError, ErrorType } from '@/utils/errors';
import { logger } from '@/utils/logger';
import { Cache } from '@/utils/cache';

@Service()
export class JournalService implements IJournalService {
  constructor(
    private aiService: AIService,
    private cache: Cache
  ) {}

  async createEntry(userId: string, entryData: CreateJournalEntryDTO): Promise<JournalEntry> {
    try {
      // Process entry with AI
      const aiResults = await this.aiService.processEntry(entryData.content, {
        includeEmotions: true,
        includeKeywords: true,
        includeObjectives: entryData.type === 'objectives',
        includeMindMap: entryData.type === 'mindmap',
        generateEmbeddings: true
      });

      const entry = new EntryModel({
        user: new ObjectId(userId),
        ...entryData,
        metadata: {
          ...entryData.metadata,
          emotions: aiResults.emotions?.emotions || [],
          keywords: aiResults.keywords?.keywords || [],
          aiTags: aiResults.keywords?.themes || [],
          vectorEmbedding: aiResults.embedding
        },
        objectives: entryData.type === 'objectives' ? 
          aiResults.objectives?.objectives || [] : 
          entryData.objectives || [],
        mindmap: entryData.type === 'mindmap' ?
          aiResults.mindMap || { nodes: [] } :
          entryData.mindmap || { nodes: [] }
      });

      await entry.save();

      // Invalidate relevant caches
      await this.cache.del(`user:${userId}:entries`);
      await this.cache.del(`user:${userId}:analysis`);

      return entry;
    } catch (error) {
      logger.error('Error creating journal entry:', error);
      throw error;
    }
  }

  async getEntry(userId: string, entryId: string): Promise<JournalEntry | null> {
    try {
      const cacheKey = `entry:${entryId}`;
      const cached = await this.cache.get(cacheKey);
      if (cached) return JSON.parse(cached);

      const entry = await EntryModel.findOne({
        _id: new ObjectId(entryId),
        user: new ObjectId(userId)
      });

      if (entry) {
        await this.cache.set(cacheKey, JSON.stringify(entry), 3600); // Cache for 1 hour
      }

      return entry;
    } catch (error) {
      logger.error('Error getting journal entry:', error);
      throw error;
    }
  }

  async updateEntry(
    userId: string,
    entryId: string,
    entryData: Partial<CreateJournalEntryDTO>
  ): Promise<JournalEntry> {
    try {
      let aiResults;
      if (entryData.content) {
        aiResults = await this.aiService.processEntry(entryData.content, {
          includeEmotions: true,
          includeKeywords: true,
          includeObjectives: entryData.type === 'objectives',
          includeMindMap: entryData.type === 'mindmap',
          generateEmbeddings: true
        });
      }

      const entry = await EntryModel.findOneAndUpdate(
        {
          _id: new ObjectId(entryId),
          user: new ObjectId(userId)
        },
        {
          $set: {
            ...entryData,
            ...(aiResults && {
              metadata: {
                ...entryData.metadata, // Preserve existing metadata
                emotions: aiResults.emotions?.emotions || [],
                keywords: aiResults.keywords?.keywords || [],
                aiTags: aiResults.keywords?.themes || [],
                vectorEmbedding: aiResults.embedding
              }
            }),
            updatedAt: new Date()
          }
        },
        { new: true }
      );

      if (!entry) {
        throw new AppError(ErrorType.NotFound, 'Entry not found');
      }

      // Invalidate caches
      await this.cache.del(`entry:${entryId}`);
      await this.cache.del(`user:${userId}:entries`);
      await this.cache.del(`user:${userId}:analysis`);

      return entry;
    } catch (error) {
      logger.error('Error updating journal entry:', error);
      throw error;
    }
  }

  async deleteEntry(userId: string, entryId: string): Promise<boolean> {
    try {
      const result = await EntryModel.findOneAndDelete({
        _id: new ObjectId(entryId),
        user: new ObjectId(userId)
      });

      if (result) {
        // Invalidate caches
        await this.cache.del(`entry:${entryId}`);
        await this.cache.del(`user:${userId}:entries`);
        await this.cache.del(`user:${userId}:analysis`);
      }

      return !!result;
    } catch (error) {
      logger.error('Error deleting journal entry:', error);
      throw error;
    }
  }

  async listEntries(userId: string, options: {
    type?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }) {
    try {
      const {
        type,
        startDate,
        endDate,
        page = 1,
        limit = 10
      } = options;

      const query: any = {
        user: new ObjectId(userId)
      };

      if (type) query.type = type;
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = startDate;
        if (endDate) query.createdAt.$lte = endDate;
      }

      const total = await EntryModel.countDocuments(query);
      const pages = Math.ceil(total / limit);
      const skip = (page - 1) * limit;

      const entries = await EntryModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      return {
        entries,
        total,
        page,
        pages
      };
    } catch (error) {
      logger.error('Error listing journal entries:', error);
      throw error;
    }
  }

  async searchEntries(userId: string, query: string): Promise<JournalEntry[]> {
    try {
      // First try text search as it's faster
      const textSearchResults = await EntryModel.find({
        user: new ObjectId(userId),
        $text: { $search: query }
      }).sort({ score: { $meta: "textScore" } }).limit(10);

      // If text search yields results, return them
      if (textSearchResults.length > 0) {
        return textSearchResults;
      }

      // If text search fails, try semantic search
      const embedding = await this.aiService.generateEmbeddings(query);
      if (!embedding || embedding.length === 0) {
        // Fallback to basic search if embedding fails
        return EntryModel.find({
          user: new ObjectId(userId),
          content: { $regex: query, $options: 'i' }
        }).sort({ createdAt: -1 }).limit(10);
      }

      // Semantic search using vector similarity
      const entries = await EntryModel.aggregate([
        {
          $match: {
            user: new ObjectId(userId),
            'metadata.vectorEmbedding': { $exists: true, $ne: null }
          }
        },
        {
          $addFields: {
            similarity: {
              $reduce: {
                input: { $zip: { inputs: ['$metadata.vectorEmbedding', embedding] } },
                initialValue: 0,
                in: { $add: ['$value', { $multiply: ['$this.0', '$this.1'] }] }
              }
            }
          }
        },
        { $match: { similarity: { $gt: 0 } } }, // Filter out non-matching entries
        { $sort: { similarity: -1 } },
        { $limit: 10 }
      ]);

      return entries;
    } catch (error) {
      logger.error('Error searching journal entries:', error);
      // Fallback to basic search on error
      return EntryModel.find({
        user: new ObjectId(userId),
        content: { $regex: query, $options: 'i' }
      }).sort({ createdAt: -1 }).limit(10);
    }
  }

  async getRelatedEntries(userId: string, entryId: string): Promise<JournalEntry[]> {
    try {
      const entry = await this.getEntry(userId, entryId);
      if (!entry) {
        throw new AppError(ErrorType.NotFound, 'Entry not found');
      }

      const embedding = entry.metadata.vectorEmbedding;
      if (!embedding) {
        return [];
      }

      const relatedEntries = await EntryModel.aggregate([
        {
          $match: {
            user: new ObjectId(userId),
            _id: { $ne: new ObjectId(entryId) },
            'metadata.vectorEmbedding': { $exists: true }
          }
        },
        {
          $addFields: {
            similarity: {
              $reduce: {
                input: { $zip: { inputs: ['$metadata.vectorEmbedding', embedding] } },
                initialValue: 0,
                in: { $add: ['$$value', { $multiply: ['$$this.0', '$$this.1'] }] }
              }
            }
          }
        },
        { $sort: { similarity: -1 } },
        { $limit: 5 }
      ]);

      return relatedEntries;
    } catch (error) {
      logger.error('Error getting related entries:', error);
      throw error;
    }
  }

  async analyzeEntries(userId: string, startDate: Date, endDate: Date) {
    try {
      const cacheKey = `user:${userId}:analysis:${startDate.toISOString()}-${endDate.toISOString()}`;
      const cached = await this.cache.get(cacheKey);
      if (cached) return JSON.parse(cached);

      const entries = await EntryModel.find({
        user: new ObjectId(userId),
        createdAt: { $gte: startDate, $lte: endDate }
      });

      const analysis = {
        emotionalTrends: this.analyzeEmotionalTrends(entries),
        completedObjectives: this.countCompletedObjectives(entries),
        habitConsistency: this.analyzeHabitConsistency(entries)
      };

      await this.cache.set(cacheKey, JSON.stringify(analysis), 3600); // Cache for 1 hour
      return analysis;
    } catch (error) {
      logger.error('Error analyzing entries:', error);
      throw error;
    }
  }

  private analyzeEmotionalTrends(entries: JournalEntry[]) {
    // Implementation of emotional trend analysis
    return {};
  }

  private countCompletedObjectives(entries: JournalEntry[]) {
    return entries.reduce((count, entry) => {
      return count + (entry.objectives || [])
        .filter(obj => obj.status === 'completed').length;
    }, 0);
  }

  private analyzeHabitConsistency(entries: JournalEntry[]) {
    // Implementation of habit consistency analysis
    return {};
  }
}