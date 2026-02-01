const express = require('express');
const router = express.Router();

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

// Chat page - GET
router.get('/chat', (req, res) => {
  res.render('chat', { messages: [] });
});

// Chat submit - POST
router.post('/chat', async (req, res) => {
  const { message, messages = '[]' } = req.body;
  
  let chatMessages = [];
  try {
    chatMessages = JSON.parse(messages);
  } catch (error) {
    console.error('Error parsing messages:', error);
    chatMessages = [];
  }

  // Add user message
  chatMessages.push({ role: 'User', text: message });

  try {
    // Make API request to Gemini
    const response = await fetch(
      `${GEMINI_URL}?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: message }]
            }
          ]
        })
      }
    );

    // Check if response is ok
    if (!response.ok) {
      const errorData = await response.json();
      console.error('🔴 GEMINI API ERROR:', JSON.stringify(errorData, null, 2));
      throw new Error(`API Error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    console.log('🟢 GEMINI RAW RESPONSE:', JSON.stringify(data, null, 2));

    // Extract reply from response
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || 
                  '🤖 Gemini did not return a response. Please try again.';

    // Add bot message
    chatMessages.push({ role: 'Bot', text: reply });

    // Render chat page with updated messages
    res.render('/chat', { messages: chatMessages });

  } catch (error) {
    console.error('🔴 GEMINI ERROR:', error.message);

    // Add error message
    chatMessages.push({
      role: 'Bot',
      text: `⚠️ Error: ${error.message}. Please check your API key and try again.`
    });

    res.render('/chat', { messages: chatMessages });
  }
});

module.exports = router;