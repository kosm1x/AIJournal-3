import { JournalEntry, CreateJournalEntryDTO } from '@/types';

export interface IJournalService {
  createEntry(userId: string, entryData: CreateJournalEntryDTO): Promise<JournalEntry>;
  getEntry(userId: string, entryId: string): Promise<JournalEntry | null>;
  updateEntry(userId: string, entryId: string, entryData: Partial<CreateJournalEntryDTO>): Promise<JournalEntry>;
  deleteEntry(userId: string, entryId: string): Promise<boolean>;
  listEntries(userId: string, options: {
    type?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }): Promise<{
    entries: JournalEntry[];
    total: number;
    page: number;
    pages: number;
  }>;
  searchEntries(userId: string, query: string): Promise<JournalEntry[]>;
  getRelatedEntries(userId: string, entryId: string): Promise<JournalEntry[]>;
  analyzeEntries(userId: string, startDate: Date, endDate: Date): Promise<{
    emotionalTrends: any;
    completedObjectives: number;
    habitConsistency: any;
  }>;
}