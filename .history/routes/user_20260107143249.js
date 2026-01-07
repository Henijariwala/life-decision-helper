const express = require("express");
const router = express.Router();
const OpenAI = require("openai");
const calculateDecision = require("../utils/decisionLogic");
const saveDecision = require("../utils/saveDecision");
const { db } = require("../firebase/admin");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

let session = {
  step: "EMOTIONAL",
  messages: [],
  options: [],
  criteria: [],
  weights: {},
  ratings: {}
};

router.get("/", (req, res) => {
  res.render("index");
});

router.get("/chat", (req, res) => {
  res.render("chat", { messages: session.messages });
});

router.post("/chat", async (req, res) => {
  const userMsg = req.body.message;
  session.messages.push({ role: "user", text: userMsg });

  let botReply = "";

  if (session.step === "EMOTIONAL") {
    const ai = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a calm emotional support assistant." },
        { role: "user", content: userMsg }
      ]
    });

    botReply = ai.choices[0].message.content;
    session.step = "DECISION";
  }

  else if (session.step === "DECISION") {
    botReply = "What decision are you trying to make?";
    session.step = "OPTIONS";
  }

  else if (session.step === "OPTIONS") {
    session.options = userMsg.split(",").map(o => o.trim());
    botReply = "Enter decision criteria (comma separated)";
    session.step = "CRITERIA";
  }

  else if (session.step === "CRITERIA") {
    session.criteria = userMsg.split(",").map(c => c.trim());
    botReply = "Enter weights as JSON (example: {\"Salary\":5})";
    session.step = "WEIGHTS";
  }

  else if (session.step === "WEIGHTS") {
    session.weights = JSON.parse(userMsg);
    botReply = "Enter ratings as JSON (example: {\"Job A\":{\"Salary\":4}})";
    session.step = "RATINGS";
  }

  else if (session.step === "RATINGS") {
    session.ratings = JSON.parse(userMsg);

    const result = calculateDecision(
      session.options,
      session.criteria,
      session.weights,
      session.ratings
    );

    await saveDecision({
      options: session.options,
      criteria: session.criteria,
      result
    });

    return res.render("result", result);
  }

  session.messages.push({ role: "bot", text: botReply });
  res.render("chat", { messages: session.messages });
});

router.get("/history", async (req, res) => {
  const snap = await db.collection("decisions").get();
  const history = snap.docs.map(d => d.data());
  res.render("history", { history });
});

module.exports = router;
