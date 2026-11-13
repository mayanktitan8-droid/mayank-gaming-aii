require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");

const app = express();
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "30kb" }));
app.use(express.static(path.join(__dirname, "public")));
app.use("/api/", rateLimit({ windowMs: 60 * 1000, limit: 20 }));

const SYSTEM_PROMPT = `You are Mayank Gaming AI, a helpful assistant focused on Free Fire and Craftland.
Help with Craftland map concepts, mobile-friendly building plans, game logic explanations,
Free Fire gameplay tips, and YouTube gaming titles/descriptions/hashtags.
Reply in the language the user uses (Hindi, Hinglish, or English).
Be practical, concise, and honest. Never claim to know whether a particular in-game
object or feature exists unless verified by the user. Do not help cheat, hack, exploit,
steal accounts, or bypass game security.`;

app.post("/api/chat", async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({ error: "AI is not connected yet. Add your API key in the hosting provider's server secrets." });
    }
    const messages = Array.isArray(req.body.messages) ? req.body.messages.slice(-12) : [];
    if (!messages.length || messages.some(m => !["user", "assistant"].includes(m.role) || typeof m.content !== "string")) {
      return res.status(400).json({ error: "Please send a valid chat message." });
    }
    const input = messages.map(m => ({ role: m.role, content: [{ type: "input_text", text: m.content.slice(0, 4000) }] }));
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
        instructions: SYSTEM_PROMPT,
        input,
        max_output_tokens: 700
      })
    });
    const data = await response.json();
    if (!response.ok) {
      console.error("OpenAI API error:", data);
      return res.status(502).json({ error: "AI service error. Check your API billing, key, and model settings." });
    }
    const answer = (data.output || [])
      .flatMap(item => item.content || [])
      .filter(item => item.type === "output_text")
      .map(item => item.text)
      .join("\n").trim();
    res.json({ reply: answer || "I couldn't generate a reply. Please try again." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});

app.get("*", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Mayank Gaming AI running on port ${port}`));
