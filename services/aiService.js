// services/aiService.js - OpenAI Integration
const { openai, CONFIG, SYSTEM_PROMPT } = require("../config/openai");

class AIService {
  static async chat(messages) {
    try {
      const response = await openai.chat.completions.create({
        model: CONFIG.MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages.map(msg => ({
            role: msg.role,
            content: msg.text
          }))
        ],
        temperature: CONFIG.TEMPERATURE,
        max_tokens: CONFIG.MAX_TOKENS,
        top_p: CONFIG.TOP_P
      });

      return response.choices[0].message.content.trim();
    } catch (error) {
      console.error("❌ OpenAI Error:", error.message);
      
      if (error.code === 'insufficient_quota') {
        throw new Error("AI service quota exceeded. Please try again later.");
      } else if (error.status === 429) {
        throw new Error("Too many requests. Please wait a moment.");
      }
      
      throw new Error("Failed to get AI response. Please try again.");
    }
  }
}

module.exports = AIService;