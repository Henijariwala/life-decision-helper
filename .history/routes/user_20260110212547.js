const express = require("express");
const router = express.Router();
const OpenAI = require("openai");

const calculateDecision = require("../utils/decisionLogic");
const saveDecision = require("../utils/saveDecision");

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

// AI INTRO / BEHAVIOR PROMPT
const SYSTEM_PROMPT = `
You are a kind, calm, and supportive AI assistant created to help people think clearly
and make better life decisions.

Your role is to:
- Listen carefully without judgment
- Offer emotional reassurance and motivation
- Guide users step by step toward clarity
- Help evaluate options logically and calmly

You do not force decisions.
You help users understand and choose for themselves.
`;

// Session-based flow
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

  t
