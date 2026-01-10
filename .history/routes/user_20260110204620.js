const express = require("express");
const router = express.Router();
const OpenAI = require("openai");

const calculateDecision = require("../utils/decisionLogic");
const saveDecision = require("../utils/saveDecision");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

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
  const flow = getFlow(req);
  res.render("chat", { messages: flow.messages });
});

router.post("/chat", async (req, res) => {
  const flow = getFlow(req);
  const userMsg = req.body.message;

  flow.messages.push({ role: "User", text: userMsg });
  let botReply = "";

  switch (flow.step) {

    case "EMOTIONAL":
      const ai = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a calm, supportive life guide." },
          { role: "user", content: userMsg }
        ]
      });
      botReply = ai.choices[0].message.content;
      flow.step = "OPTIONS";
      break;

    case "OPTIONS":
      botReply = "Please enter your decision options (comma separated).";
      flow.step = "CRITERIA";
      break;

    case "CRITERIA":
      flow.options = userMsg.split(",").map(v => v.trim());
      botReply = "Enter decision criteria (comma separated).";
      flow.step = "WEIGHTS";
      break;

    case "WEIGHTS":
      flow.criteria = userMsg.split(",").map(v => v.trim());
      botReply = 'Enter weights as JSON. Example: {"Salary":5,"Growth":4}';
      flow.step = "RATINGS";
      break;

    case "RATINGS":
      flow.weights = JSON.parse(userMsg);
      botReply =
        'Enter ratings as JSON. Example: {"Option A":{"Salary":4,"Growth":5}}';
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

      await saveDecision({
        options: flow.options,
        criteria: flow.criteria,
        scores: result.scores,
        bestOption: result.bestOption
      });

      req.session.flow = null;
      return res.render("result", result);
  }

  flow.messages.push({ role: "Bot", text: botReply });
  res.render("chat", { messages: flow.messages });
});

router.get("/history", async (req, res) => {
  const { db } = require("../firebase/admin");
  const snap = await db.collection("decisions")
    .orderBy("createdAt", "desc")
    .get();

  const decisions = snap.docs.map(d => d.data());
  res.render("history", { decisions });
});

module.exports = router;
