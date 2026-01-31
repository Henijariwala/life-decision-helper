const express = require("express");
const OpenAI = require("openai");
const requireAuth = require("../middleware/auth");
const calculateDecision = require("../utils/decisionLogic");
const saveDecision = require("../utils/saveDecision");

const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `
You are a calm, empathetic assistant.
You talk naturally and support emotions.
Only start decision-making when user is ready.
`;

// ---------- HOME ----------
router.get("/", (req, res) => {
  res.render("index");
});

// ---------- CHAT PAGE ----------
router.get("/chat", requireAuth, (req, res) => {
  res.render("chat", {
    messages: [],
    step: "EMOTIONAL"
  });
});

// ---------- CHAT POST ----------
router.post("/chat", requireAuth, async (req, res) => {
  const { message, step, messages, options, criteria, weights } = req.body;

  let currentStep = step || "EMOTIONAL";
  let chatMessages = messages ? JSON.parse(messages) : [];
  let reply = "";

  chatMessages.push({ role: "User", text: message });

  try {
    // ---------- EMOTIONAL ----------
    if (currentStep === "EMOTIONAL") {
      const ai = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...chatMessages.map(m => ({
            role: m.role === "User" ? "user" : "assistant",
            content: m.text
          }))
        ]
      });

      reply = ai.choices[0].message.content;

      if (/help me decide|i'm ready|start decision/i.test(message)) {
        reply += "\n\n👉 Enter your options separated by commas.";
        currentStep = "OPTIONS";
      }
    }

    // ---------- OPTIONS ----------
    else if (currentStep === "OPTIONS") {
      chatMessages.options = message.split(",").map(v => v.trim());
      reply = "Enter criteria (comma-separated).";
      currentStep = "CRITERIA";
    }

    // ---------- CRITERIA ----------
    else if (currentStep === "CRITERIA") {
      chatMessages.criteria = message.split(",").map(v => v.trim());
      reply = "Enter weights as JSON.";
      currentStep = "WEIGHTS";
    }

    // ---------- WEIGHTS ----------
    else if (currentStep === "WEIGHTS") {
      chatMessages.weights = JSON.parse(message);
      reply = "Enter ratings as JSON.";
      currentStep = "RATINGS";
    }

    // ---------- RATINGS ----------
    else if (currentStep === "RATINGS") {
      const ratings = JSON.parse(message);

      const result = calculateDecision(
        chatMessages.options,
        chatMessages.criteria,
        chatMessages.weights,
        ratings
      );

      await saveDecision(result, req.user.email);

      return res.render("result", result);
    }

  } catch (err) {
    console.error(err);
    reply = "❌ Invalid input. Please try again.";
  }

  chatMessages.push({ role: "Bot", text: reply });

  res.render("chat", {
    messages: chatMessages,
    step: currentStep
  });
});

// ---------- HISTORY ----------
router.get("/history", requireAuth, async (req, res) => {
  res.render("history", { decisions: [] });
});

module.exports = router;
