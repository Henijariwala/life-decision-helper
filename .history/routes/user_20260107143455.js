const express = require("express");
const router = express.Router();
const OpenAI = require("openai");

const calculateDecision = require("../utils/decisionLogic");
const saveDecision = require("../utils/saveDecision");

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
  session.messages.push({ role: "User", text: userMsg });

  let botReply = "";

  if (session.step === "EMOTIONAL") {
    const ai = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a calm, supportive life guide." },
        { role: "user", content: userMsg }
      ]
    });

    botReply = ai.choices[0].message.content;
    session.step = "OPTIONS";
  }

  else if (session.step === "OPTIONS") {
    botReply = "Enter your decision options separated by commas.";
    session.step = "CRITERIA";
  }

  else if (session.step === "CRITERIA") {
    session.options = userMsg.split(",").map(o => o.trim());
    botReply = "Enter decision criteria separated by commas.";
    session.step = "WEIGHTS";
  }

  else if (session.step === "WEIGHTS") {
    session.criteria = userMsg.split(",").map(c => c.trim());
    botReply = 'Enter weights as JSON. Example: {"Salary":5,"Growth":4}';
    session.step = "RATINGS";
  }

  else if (session.step === "RATINGS") {
    session.weights = JSON.parse(userMsg);
    botReply =
      'Enter ratings as JSON. Example: {"Job A":{"Salary":4,"Growth":5}}';
    session.step = "CALCULATE";
  }

  else if (session.step === "CALCULATE") {
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

    session = {
      step: "EMOTIONAL",
      messages: [],
      options: [],
      criteria: [],
      weights: {},
      ratings: {}
    };

    return res.render("result", result);
  }

  session.messages.push({ role: "Bot", text: botReply });
  res.render("chat", { messages: session.messages });
});

module.exports = router;
