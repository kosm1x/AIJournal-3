import { Configuration, OpenAIApi } from 'openai';
import { injectable } from 'typedi';
import {
  EmotionAnalysisResult,
  KeywordExtractionResult,
  ObjectiveExtractionResult,
  MindMapGenerationResult,
  AIProcessingOptions
} from '@/types';
import { IAIService } from './interfaces/IAIService';
import { logger } from '@/utils/logger';

@injectable()
export class AIService implements IAIService {
  private openai: OpenAIApi;

  constructor() {
    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.openai = new OpenAIApi(configuration);
  }

  async processEntry(text: string, options: AIProcessingOptions) {
    const results: any = {};
    const maxRetries = 3;
    const retryDelay = 1000; // 1 second

    const retryOperation = async (operation: () => Promise<any>, retries: number = 0): Promise<any> => {
      try {
        return await operation();
      } catch (error: any) {
        if (error?.response?.status === 429 && retries < maxRetries) {
          // Rate limit hit, wait and retry
          await new Promise(resolve => setTimeout(resolve, retryDelay * (retries + 1)));
          return retryOperation(operation, retries + 1);
        }
        throw error;
      }
    };

    try {
      // Chunk text if it's too long (OpenAI has a 4096 token limit)
      const chunkSize = 3000;
      const textChunks = text.length > chunkSize 
        ? [text.slice(0, chunkSize)] 
        : [text];

      const promises: Promise<any>[] = [];

      if (options.includeEmotions) {
        promises.push(retryOperation(() => 
          this.detectEmotions(textChunks[0]).then(r => results.emotions = r))
        );
      }
      if (options.includeKeywords) {
        promises.push(retryOperation(() => 
          this.extractKeywords(textChunks[0]).then(r => results.keywords = r))
        );
      }
      if (options.includeObjectives) {
        promises.push(retryOperation(() => 
          this.extractObjectives(textChunks[0]).then(r => results.objectives = r))
        );
      }
      if (options.includeMindMap) {
        promises.push(retryOperation(() => 
          this.generateMindMap(textChunks[0]).then(r => results.mindMap = r))
        );
      }
      if (options.generateEmbeddings) {
        promises.push(retryOperation(() => 
          this.generateEmbeddings(textChunks[0]).then(r => results.embedding = r))
        );
      }

      await Promise.all(promises);
      return results;
    } catch (error) {
      logger.error('Error in AI processing:', error);
      // Return partial results if available instead of throwing
      return results;
  }

  async detectEmotions(text: string): Promise<EmotionAnalysisResult> {
    try {
      const response = await this.openai.createCompletion({
        model: "text-davinci-003",
        prompt: `Analyze the following text for emotions and return a JSON object with emotions array, dominant emotion, and overall intensity:\n\n${text}`,
        max_tokens: 150,
        temperature: 0.3,
      });

      const result = response.data.choices[0].text?.trim() || '{}';
      try {
        return JSON.parse(result);
      } catch (parseError) {
        logger.error('Error parsing emotion detection response:', parseError);
        return { emotions: [], emotionalIntensity: 0, dominantEmotion: null };
      }
    } catch (error: any) {
      if (error?.response?.status === 429) {
        logger.warn('Rate limit reached in emotion detection');
      } else {
        logger.error('Error detecting emotions:', error);
      }
      return { emotions: [], emotionalIntensity: 0, dominantEmotion: null };
    }
  }

  async extractKeywords(text: string): Promise<KeywordExtractionResult> {
    try {
      const response = await this.openai.createCompletion({
        model: "text-davinci-003",
        prompt: `Extract keywords, themes, and their relevance from the following text as a JSON object:\n\n${text}`,
        max_tokens: 150,
        temperature: 0.3,
      });

      return JSON.parse(response.data.choices[0].text?.trim() || '{}');
    } catch (error) {
      logger.error('Error extracting keywords:', error);
      return { keywords: [], themes: [], relevance: {} };
    }
  }

  async extractObjectives(text: string): Promise<ObjectiveExtractionResult> {
    try {
      const response = await this.openai.createCompletion({
        model: "text-davinci-003",
        prompt: `Extract objectives and suggested priorities from the following text as a JSON object:\n\n${text}`,
        max_tokens: 250,
        temperature: 0.3,
      });

      return JSON.parse(response.data.choices[0].text?.trim() || '{}');
    } catch (error) {
      logger.error('Error extracting objectives:', error);
      return { objectives: [], suggestedPriorities: {} };
    }
  }

  async generateMindMap(text: string): Promise<MindMapGenerationResult> {
    try {
      const response = await this.openai.createCompletion({
        model: "text-davinci-003",
        prompt: `Create a mind map structure from the following text as a JSON object with nodes, central theme, and branch count:\n\n${text}`,
        max_tokens: 300,
        temperature: 0.3,
      });

      return JSON.parse(response.data.choices[0].text?.trim() || '{}');
    } catch (error) {
      logger.error('Error generating mind map:', error);
      return { nodes: [], centralTheme: '', branchCount: 0 };
    }
  }

  async generateEmbeddings(text: string): Promise<number[] | null> {
    try {
      const response = await this.openai.createEmbedding({
        model: "text-embedding-ada-002",
        input: text,
      });

      return response.data.data[0].embedding;
    } catch (error) {
      logger.error('Error generating embeddings:', error);
      return null;
    }
  }

  async classifyEntryType(text: string): Promise<string> {
    try {
      const response = await this.openai.createCompletion({
        model: "text-davinci-003",
        prompt: `Classify the following journal entry into one of these categories: context, objectives, mindmap, ideate, track. Return only the category name:\n\n${text}`,
        max_tokens: 10,
        temperature: 0.3,
      });

      return response.data.choices[0].text?.trim().toLowerCase() || 'context';
    } catch (error) {
      logger.error('Error classifying entry:', error);
      return 'context';
    }
  }
}