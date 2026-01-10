const express = require("express");
const router = express.Router();
const OpenAI = require("openai");

const calculateDecision = require("../utils/decisionLogic");
const saveDecision = require("../utils/saveDecision");

// ---------- OPENAI SETUP ----------
if (!process.env.OPENAI_API_KEY) {
  console.error("❌ OPENAI_API_KEY IS MISSING");
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// ---------- AI SYSTEM PROMPT ----------
const SYSTEM_PROMPT = `
You are a calm, kind, and supportive AI created to help people think clearly
and make better life decisions.

You listen carefully, reduce confusion, and guide users step by step.
You never judge or force decisions.
`;

// ---------- SESSION FLOW ----------
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

// ---------- ROUTES ----------
router.get("/", (req, res) => {
  res.render("index");
});

router.get("/chat", (req, res) => {
  res.render("chat", { messages: getFlow(req).messages });
});

router.post("/chat", async (req, res) => {
  const flow = getFlow(req);
  const userMsg = req.body.message;

  flow.messages.push({ role: "User", text: userMsg });
  let reply = "";

  try {
    switch (flow.step) {

      case "EMOTIONAL": {
        const ai = await openai.chat.completions.create({
          model: "gpt-4o-mini-2024-07-18",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userMsg }
          ]
        });

        reply = ai.choices[0].message.content;
        flow.step = "OPTIONS";
        break;
      }

      case "OPTIONS":
        reply = "Please enter your options separated by commas.";
        flow.step = "CRITERIA";
        break;

      case "CRITERIA":
        flow.options = userMsg.split(",").map(v => v.trim());
        reply = "Enter decision criteria separated by commas.";
        flow.step = "WEIGHTS";
        break;

      case "WEIGHTS":
        flow.criteria = userMsg.split(",").map(v => v.trim());
        reply = `Enter weights as JSON (example: {"Salary":5,"Growth":4})`;
        flow.step = "RATINGS";
        break;

      case "RATINGS":
        flow.weights = JSON.parse(userMsg);
        reply = `Enter ratings as JSON (example: {"Option A":{"Salary":4}})`;
        flow.step = "CALCULATE";
        break;

      case "CALCULATE":
        flow.ratings = JSON.parse(userMsg);

        const result = calculateDecision(
          flow.options,
          flow.criteria,
          flow.weights,
          flow.ratings
        );

        await saveDecision(result);
        req.session.flow = null;
        return res.render("result", result);
    }

  } catch (err) {
    console.error("AI ERROR:", err.message);
    reply = "⚠️ AI is temporarily unavailable. Please try again.";
  }

  flow.messages.push({ role: "Bot", text: reply });
  res.render("chat", { messages: flow.messages });
});

router.get("/history", (req, res) => {
  res.render("history", { decisions: [] });
});

module.exports = router;
