import { Emotion, MindMapNode, Objective } from './journal.types';

export interface EmotionAnalysisResult {
  emotions: Emotion[];
  dominantEmotion?: string;
  emotionalIntensity: number;
}

export interface KeywordExtractionResult {
  keywords: string[];
  themes: string[];
  relevance: {
    [keyword: string]: number;
  };
}

export interface ObjectiveExtractionResult {
  objectives: Objective[];
  suggestedPriorities: {
    [objectiveId: string]: number;
  };
}

export interface MindMapGenerationResult {
  nodes: MindMapNode[];
  centralTheme: string;
  branchCount: number;
}

export interface AIProcessingOptions {
  includeEmotions?: boolean;
  includeKeywords?: boolean;
  includeObjectives?: boolean;
  includeMindMap?: boolean;
  generateEmbeddings?: boolean;
}