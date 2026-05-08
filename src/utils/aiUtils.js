// AI Utility Functions for Student Portfolio System
// Integrates with external AI services for advanced features

const AI_CONFIG = {
  // These would be set via environment variables in production
  OPENAI_API_KEY: process.env.REACT_APP_OPENAI_API_KEY || '',
  HUGGINGFACE_API_KEY: process.env.REACT_APP_HUGGINGFACE_API_KEY || '',
  // Using free tiers/APIs where possible for demo/educational purposes
};

/**
 * Generate tags for a file based on its content/type
 * @param {File} file - The file to analyze
 * @param {string} type - The file type (video, image, audio, text)
 * @returns {Promise<Array<string>>} - Array of suggested tags
 */
export const generateFileTags = async (file, type) => {
  try {
    // For demonstration, we'll use client-side analysis where possible
    // In production, this would call external AI APIs
    
    const tags = [];
    
    // Add basic type-based tags
    tags.push(type);
    
    // Add filename-based tags (simple keyword extraction)
    const filenameWords = file.name
      .toLowerCase()
      .replace(/\.[^/.]+$/, "") // Remove extension
      .split(/[_\s-]+/) // Split on underscores, spaces, hyphens
      .filter(word => word.length > 2); // Filter out very short words
    
    tags.push(...filenameWords.slice(0, 3)); // Take first 3 meaningful words
    
    // Type-specific tag enhancement
    switch (type) {
      case 'image':
        // In real implementation, would use image recognition API
        tags.push('visual', 'diagram', 'illustration');
        break;
      case 'video':
        tags.push('presentation', 'lecture', 'tutorial');
        break;
      case 'audio':
        tags.push('recording', 'lecture', 'speech');
        break;
      case 'text':
        // Simple text analysis would go here
        tags.push('document', 'notes', 'assignment');
        break;
      default:
        break;
    }
    
    // Remove duplicates and return
    return [...new Set(tags)];
  } catch (error) {
    console.error('Error generating file tags:', error);
    return [type, 'untagged'];
  }
};

/**
 * Extract text content from various file types for AI processing
 * @param {File} file - The file to extract text from
 * @returns {Promise<string>} - Extracted text content
 */
export const extractTextContent = async (file) => {
  try {
    // For text-based files, read directly
    if (file.type.startsWith('text/') || 
        ['application/pdf', 'application/json'].includes(file.type)) {
      
      const text = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsText(file);
      });
      
      return text;
    }
    
    // For other file types, we'd use AI APIs in production
    // For now, return metadata-based description
    return `File: ${file.name}, Type: ${file.type}, Size: ${file.size} bytes`;
  } catch (error) {
    console.error('Error extracting text content:', error);
    return '';
  }
};

/**
 * Generate a summary of file content using AI
 * @param {string} content - The text content to summarize
 * @param {number} maxLength - Maximum length of summary
 * @returns {Promise<string>} - AI-generated summary
 */
export const generateSummary = async (content, maxLength = 100) => {
  try {
    // In production, would call OpenAI or similar API
    // For demo, return a simple truncation
    
    if (!content || content.trim() === '') {
      return 'No content available for summary';
    }
    
    // Simple extractive summary (first sentence or up to maxLength)
    const sentences = content.split(/[.!?]+/);
    const firstSentence = sentences[0].trim();
    
    if (firstSentence.length <= maxLength) {
      return firstSentence + '.';
    }
    
    return firstSentence.substring(0, maxLength) + '...';
  } catch (error) {
    console.error('Error generating summary:', error);
    return 'Summary generation failed';
  }
};

/**
 * Translate text to target language using AI
 * @param {string} text - Text to translate
 * @param {string} targetLanguage - Target language code (e.g., 'es', 'fr', 'de')
 * @returns {Promise<string>} - Translated text
 */
export const translateText = async (text, targetLanguage = 'es') => {
  try {
    // In production, would call translation API
    // For demo, return original text with language marker
    
    if (!text || text.trim() === '') {
      return '';
    }
    
    // Simulate translation by adding language prefix
    const languageMap = {
      'es': 'Spanish',
      'fr': 'French', 
      'de': 'German',
      'zh': 'Chinese',
      'ja': 'Japanese'
    };
    
    const langName = languageMap[targetLanguage] || targetLanguage;
    return `[Translated to ${langName}] ${text}`;
  } catch (error) {
    console.error('Error translating text:', error);
    return text; // Return original on error
  }
};

/**
 * Analyze sentiment of text content
 * @param {string} text - Text to analyze
 * @returns {Promise<Object>} - Sentiment analysis results
 */
export const analyzeSentiment = async (text) => {
  try {
    // In production, would call sentiment analysis API
    // For demo, return mock results based on simple keyword matching
    
    if (!text || text.trim() === '') {
      return { sentiment: 'neutral', score: 0 };
    }
    
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love', 'like', 'happy', 'pleased'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'dislike', 'angry', 'sad', 'disappointed', 'frustrated', 'angry'];
    
    const lowerText = text.toLowerCase();
    let positiveCount = 0;
    let negativeCount = 0;
    
    positiveWords.forEach(word => {
      if (lowerText.includes(word)) positiveCount++;
    });
    
    negativeWords.forEach(word => {
      if (lowerText.includes(word)) negativeCount++;
    });
    
    let sentiment = 'neutral';
    let score = 0;
    
    if (positiveCount > negativeCount) {
      sentiment = 'positive';
      score = Math.min(positiveCount * 0.2, 1);
    } else if (negativeCount > positiveCount) {
      sentiment = 'negative';
      score = Math.max(-negativeCount * 0.2, -1);
    }
    
    return { sentiment, score };
  } catch (error) {
    console.error('Error analyzing sentiment:', error);
    return { sentiment: 'neutral', score: 0 };
  }
};

export default {
  generateFileTags,
  extractTextContent,
  generateSummary,
  translateText,
  analyzeSentiment
};