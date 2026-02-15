// config/openai.js - OpenAI Configuration
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const CONFIG = {
  MODEL: "gpt-4o-mini",
  TEMPERATURE: 0.7,
  MAX_TOKENS: 500,
  TOP_P: 0.95
};

const SYSTEM_PROMPT = `You are a helpful, friendly AI assistant. Your responses should be:
1. Conversational and natural
2. Brief but informative (2-4 sentences usually)
3. Supportive and encouraging
4. Clear and easy to understand

You help users think through decisions, provide information, and offer guidance. Be warm and personable.`;

module.exports = {
  openai,
  CONFIG,
  SYSTEM_PROMPT
};