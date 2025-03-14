import {
  EmotionAnalysisResult,
  KeywordExtractionResult,
  ObjectiveExtractionResult,
  MindMapGenerationResult,
  AIProcessingOptions
} from '@/types';

export interface IAIService {
  processEntry(text: string, options: AIProcessingOptions): Promise<{
    emotions?: EmotionAnalysisResult;
    keywords?: KeywordExtractionResult;
    objectives?: ObjectiveExtractionResult;
    mindMap?: MindMapGenerationResult;
    embedding?: number[];
  }>;
  
  detectEmotions(text: string): Promise<EmotionAnalysisResult>;
  extractKeywords(text: string): Promise<KeywordExtractionResult>;
  extractObjectives(text: string): Promise<ObjectiveExtractionResult>;
  generateMindMap(text: string): Promise<MindMapGenerationResult>;
  generateEmbeddings(text: string): Promise<number[] | null>;
  classifyEntryType(text: string): Promise<string>;
}