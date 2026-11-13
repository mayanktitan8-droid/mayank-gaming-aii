module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({ error: "AI is not connected yet. Add OPENAI_API_KEY in Vercel project environment variables." });
    }
    const messages = Array.isArray(req.body?.messages) ? req.body.messages.slice(-12) : [];
    if (!messages.length || messages.some(m => !["user", "assistant"].includes(m.role) || typeof m.content !== "string")) {
      return res.status(400).json({ error: "Please send a valid chat message." });
    }
    const input = messages.map(m => ({
      role: m.role,
      content: [{ type: "input_text", text: m.content.slice(0, 4000) }]
    }));
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
        instructions: `You are Mayank Gaming AI, focused on Free Fire and Craftland. Help with Craftland map concepts, mobile-friendly building plans, game logic explanations, gameplay tips, and YouTube gaming content. Reply in the user's language (Hindi, Hinglish, or English). Be practical and honest. Never claim an in-game object exists unless verified. Do not help cheat, hack, exploit, steal accounts, or bypass game security.`,
        input,
        max_output_tokens: 700
      })
    });
    const data = await response.json();
    if (!response.ok) {
      console.error("OpenAI API error", data);
      return res.status(502).json({ error: "AI service error. Check API billing, key, and model settings." });
    }
    const reply = (data.output || []).flatMap(x => x.content || [])
      .filter(x => x.type === "output_text").map(x => x.text).join("\n").trim();
    return res.status(200).json({ reply: reply || "Please try again." });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Server error. Please try again." });
  }
};
