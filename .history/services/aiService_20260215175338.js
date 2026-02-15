// services/aiService.js - AI Service Layer
const { openai, SYSTEM_PROMPTS, CONFIG } = require("../config/openai");

class AIService {
  /**
   * Get AI response for emotional support chat
   * @param {Array} messageHistory - Array of previous messages
   * @returns {Promise<string>} AI response
   */
  static async getEmotionalSupport(messageHistory) {
    try {
      const response = await openai.chat.completions.create({
        model: CONFIG.MODEL,
        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPTS.EMOTIONAL_SUPPORT
          },
          ...messageHistory.map(msg => ({
            role: msg.role === "user" ? "user" : "assistant",
            content: msg.text
          }))
        ],
        temperature: CONFIG.TEMPERATURE,
        max_tokens: CONFIG.MAX_TOKENS,
        top_p: CONFIG.TOP_P
      });

      return response.choices[0].message.content.trim();
    } catch (error) {
      console.error("❌ OpenAI API Error:", error.message);
      
      // Handle specific error types
      if (error.code === 'insufficient_quota') {
        throw new Error("OpenAI API quota exceeded. Please check your billing.");
      } else if (error.code === 'invalid_api_key') {
        throw new Error("Invalid OpenAI API key. Please check your configuration.");
      } else if (error.status === 429) {
        throw new Error("Rate limit exceeded. Please try again in a moment.");
      }
      
      throw new Error("Failed to get AI response. Please try again.");
    }
  }

  /**
   * Get AI response for decision-making guidance
   * @param {Array} messageHistory - Array of previous messages
   * @returns {Promise<string>} AI response
   */
  static async getDecisionGuidance(messageHistory) {
    try {
      const response = await openai.chat.completions.create({
        model: CONFIG.MODEL,
        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPTS.DECISION_SUPPORT
          },
          ...messageHistory.map(msg => ({
            role: msg.role === "user" ? "user" : "assistant",
            content: msg.text
          }))
        ],
        temperature: CONFIG.TEMPERATURE,
        max_tokens: CONFIG.MAX_TOKENS,
        top_p: CONFIG.TOP_P
      });

      return response.choices[0].message.content.trim();
    } catch (error) {
      console.error("❌ OpenAI API Error:", error.message);
      throw new Error("Failed to get AI response. Please try again.");
    }
  }

  /**
   * Generate explanation for decision result
   * @param {string} bestOption - The winning option
   * @param {Object} scores - All option scores
   * @param {Object} criteria - Criteria used
   * @returns {Promise<string>} AI explanation
   */
  static async explainDecision(bestOption, scores, criteria) {
    try {
      const prompt = `The user was deciding between: ${Object.keys(scores).join(", ")}.
Based on their criteria (${Object.keys(criteria).join(", ")}), the best option is: ${bestOption}.
The scores were: ${JSON.stringify(scores)}.
Explain why this is the best choice in 2-3 encouraging sentences.`;

      const response = await openai.chat.completions.create({
        model: CONFIG.MODEL,
        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPTS.RESULT_EXPLANATION
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: CONFIG.TEMPERATURE,
        max_tokens: CONFIG.MAX_TOKENS,
        top_p: CONFIG.TOP_P
      });

      return response.choices[0].message.content.trim();
    } catch (error) {
      console.error("❌ OpenAI API Error:", error.message);
      return "This is your best choice based on what matters most to you. Trust your thoughtful analysis!";
    }
  }

  /**
   * Check if user is ready to start decision-making
   * @param {string} message - User's message
   * @returns {boolean} True if ready
   */
  static isReadyForDecision(message) {
    const readyPatterns = [
      /help me decide/i,
      /make a decision/i,
      /i'?m ready/i,
      /let'?s start/i,
      /need to choose/i,
      /start decision/i,
      /decision time/i,
      /ready to decide/i
    ];

    return readyPatterns.some(pattern => pattern.test(message));
  }

  /**
   * Stream AI response (for future implementation)
   * @param {Array} messageHistory - Array of previous messages
   * @param {string} systemPrompt - System prompt to use
   * @returns {Promise<AsyncIterator>} Streaming response
   */
  static async streamResponse(messageHistory, systemPrompt) {
    try {
      const stream = await openai.chat.completions.create({
        model: CONFIG.MODEL,
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          ...messageHistory.map(msg => ({
            role: msg.role === "user" ? "user" : "assistant",
            content: msg.text
          }))
        ],
        temperature: CONFIG.TEMPERATURE,
        max_tokens: CONFIG.MAX_TOKENS,
        top_p: CONFIG.TOP_P,
        stream: true
      });

      return stream;
    } catch (error) {
      console.error("❌ OpenAI Streaming Error:", error.message);
      throw new Error("Failed to stream AI response.");
    }
  }
}

module.exports = AIService;