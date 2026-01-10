const express = require("express");
const router = express.Router();
const OpenAI = require("openai");

const calculateDecision = require("../utils/decisionLogic");
const saveDecision = require("../utils/saveDecision");

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

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

      case "EMOTIONAL":
        if (!openai) {
          reply = "I’m here to help. Let’s calmly think this through together.";
        } else {
          const ai = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: "You are a calm, supportive life coach." },
              { role: "user", content: userMsg }
            ]
          });
          reply = ai.choices[0].message.content;
        }
        flow.step = "OPTIONS";
        break;

      case "OPTIONS":
        reply = "Enter your options (comma separated).";
        flow.step = "CRITERIA";
        break;

      case "CRITERIA":
        flow.options = userMsg.split(",").map(v => v.trim());
        reply = "Enter decision criteria (comma separated).";
        flow.step = "WEIGHTS";
        break;

      case "WEIGHTS":
        flow.criteria = userMsg.split(",").map(v => v.trim());
        reply = `Enter weights as JSON (example: {"Salary":5})`;
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
    reply = "⚠️ Input error. Please follow the format carefully.";
  }

  flow.messages.push({ role: "Bot", text: reply });
  res.render("chat", { messages: flow.messages });
});

router.get("/history", async (req, res) => {
  const { db } = require("../firebase/admin");
  const snap = await db.collection("decisions").orderBy("createdAt", "desc").get();
  res.render("history", { decisions: snap.docs.map(d => d.data()) });
});

module.exports = router;
