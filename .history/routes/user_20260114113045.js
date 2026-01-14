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

function getFlow(req) {
  if (!req.session.flow) {
    req.session.flow = {
      step: "EMOTIONAL",
      messages: [],
      options: [],
      criteria: [],
      weights: {},
      ratings: {}
    };
  }
  return req.session.flow;
}

router.get("/", (req, res) => res.render("index"));

router.get("/chat", requireAuth, (req, res) => {
  const flow = getFlow(req);
  res.render("chat", { messages: flow.messages, step: flow.step });
});

router.post("/chat", requireAuth, async (req, res) => {
  const flow = getFlow(req);
  const userMsg = req.body.message;
  flow.messages.push({ role: "User", text: userMsg });

  let reply = "";

  try {
    if (flow.step === "EMOTIONAL") {
      const ai = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...flow.messages.map(m => ({
            role: m.role === "User" ? "user" : "assistant",
            content: m.text
          }))
        ]
      });

      reply = ai.choices[0].message.content;

      if (/help me decide|i'm ready|start decision/i.test(userMsg)) {
        reply += "\n\n👉 Enter your options separated by commas.";
        flow.step = "OPTIONS";
      }
    }

    else if (flow.step === "OPTIONS") {
      flow.options = userMsg.split(",").map(v => v.trim());
      reply = "Enter criteria (comma-separated).";
      flow.step = "CRITERIA";
    }

    else if (flow.step === "CRITERIA") {
      flow.criteria = userMsg.split(",").map(v => v.trim());
      reply = "Enter weights as JSON.";
      flow.step = "WEIGHTS";
    }

    else if (flow.step === "WEIGHTS") {
      flow.weights = JSON.parse(userMsg);
      reply = "Enter ratings as JSON.";
      flow.step = "RATINGS";
    }

    else if (flow.step === "RATINGS") {
      flow.ratings = JSON.parse(userMsg);
      const result = calculateDecision(
        flow.options,
        flow.criteria,
        flow.weights,
        flow.ratings
      );
      await saveDecision(result, req.user.uid);
      delete req.session.flow;
      return res.render("result", result);
    }
  } catch {
    reply = "❌ Invalid input. Please try again.";
  }

  flow.messages.push({ role: "Bot", text: reply });
  res.render("chat", { messages: flow.messages, step: flow.step });
});

router.get("/history", requireAuth, async (req, res) => {
  res.render("history", { decisions: [] });
});

module.exports = router;
