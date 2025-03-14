module.exports = {
  // Authentication
  JWT_EXPIRATION: '7d',
  PASSWORD_MIN_LENGTH: 8,
  
  // Entry Types
  ENTRY_TYPES: {
    CONTEXT: 'context',
    OBJECTIVES: 'objectives',
    MINDMAP: 'mindmap',
    IDEATE: 'ideate',
    TRACK: 'track'
  },
  
  // AI Analysis
  EMOTION_INTENSITY_SCALE: {
    MIN: 0,
    MAX: 10
  },
  
  // Pagination
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 50,
  
  // Rate Limiting
  RATE_LIMIT: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100
  },
  
  // Vector Embedding
  VECTOR_DIMENSION: 1536, // OpenAI's embedding dimension
  
  // Error Messages
  ERRORS: {
    AUTH: {
      INVALID_CREDENTIALS: 'Invalid email or password',
      TOKEN_EXPIRED: 'Token has expired',
      UNAUTHORIZED: 'Unauthorized access'
    },
    ENTRY: {
      NOT_FOUND: 'Entry not found',
      INVALID_TYPE: 'Invalid entry type'
    }
  }
};