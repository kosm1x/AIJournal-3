const { Configuration, OpenAIApi } = require('openai');

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

class AIService {
  /**
   * Analyze text for emotional content
   */
  async detectEmotions(text) {
    try {
      const response = await openai.createCompletion({
        model: "text-davinci-003",
        prompt: `Analyze the following text for emotions and return a JSON array of emotions with intensity (0-10):\n\n${text}`,
        max_tokens: 150,
        temperature: 0.3,
      });

      return JSON.parse(response.data.choices[0].text.trim());
    } catch (error) {
      console.error('Error detecting emotions:', error);
      return [];
    }
  }

  /**
   * Extract keywords and themes from text
   */
  async extractKeywords(text) {
    try {
      const response = await openai.createCompletion({
        model: "text-davinci-003",
        prompt: `Extract the main keywords and themes from the following text as a JSON array:\n\n${text}`,
        max_tokens: 150,
        temperature: 0.3,
      });

      return JSON.parse(response.data.choices[0].text.trim());
    } catch (error) {
      console.error('Error extracting keywords:', error);
      return [];
    }
  }

  /**
   * Generate text embeddings for semantic search
   */
  async generateEmbeddings(text) {
    try {
      const response = await openai.createEmbedding({
        model: "text-embedding-ada-002",
        input: text,
      });

      return response.data.data[0].embedding;
    } catch (error) {
      console.error('Error generating embeddings:', error);
      return null;
    }
  }

  /**
   * Classify entry type based on content
   */
  async classifyEntryType(text) {
    try {
      const response = await openai.createCompletion({
        model: "text-davinci-003",
        prompt: `Classify the following journal entry into one of these categories: context, objectives, mindmap, ideate, track. Return only the category name:\n\n${text}`,
        max_tokens: 10,
        temperature: 0.3,
      });

      return response.data.choices[0].text.trim().toLowerCase();
    } catch (error) {
      console.error('Error classifying entry:', error);
      return 'context'; // Default to context if classification fails
    }
  }

  /**
   * Extract objectives and tasks from text
   */
  async extractObjectives(text) {
    try {
      const response = await openai.createCompletion({
        model: "text-davinci-003",
        prompt: `Extract objectives and tasks from the following text as a JSON array with title, priority (1-5), and status fields:\n\n${text}`,
        max_tokens: 250,
        temperature: 0.3,
      });

      return JSON.parse(response.data.choices[0].text.trim());
    } catch (error) {
      console.error('Error extracting objectives:', error);
      return [];
    }
  }

  /**
   * Generate mind map structure from text
   */
  async generateMindMap(text) {
    try {
      const response = await openai.createCompletion({
        model: "text-davinci-003",
        prompt: `Create a mind map structure from the following text as a JSON array of nodes with id, content, and parentId fields:\n\n${text}`,
        max_tokens: 300,
        temperature: 0.3,
      });

      return JSON.parse(response.data.choices[0].text.trim());
    } catch (error) {
      console.error('Error generating mind map:', error);
      return [];
    }
  }
}

module.exports = new AIService();