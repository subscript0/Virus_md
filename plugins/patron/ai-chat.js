const axios = require("axios");

module.exports = [
  {
    command: ["gpt"],
    alias: ["bot", "ai", "gpt4", "bing"],
    description: "Chat with an AI model",
    category: "Ai",
    async execute(m, { args, q, reply }) {
      try {
        const question = q?.trim() || args.join(" ").trim();
        if (!question) {
          return reply("❓ Please provide a message for the AI.\n\nExample: `.ai Hello, how are you?`");
        }

        const apiUrl = `https://lance-frank-asta.onrender.com/api/gpt?q=${encodeURIComponent(question)}`;
        const { data } = await axios.get(apiUrl);

        if (!data || !data.message) {
          return reply("⚠️ AI failed to respond. Please try again later.");
        }

        await reply(`🤖 *AI Response:*\n\n${data.message}`);
      } catch (e) {
        console.error("Error in AI command:", e);
        reply("❌ An error occurred while communicating with the AI.");
      }
    },
  },

{
  command: ["meta"],
  alias: ["llama", "metallama"],
  description: "Ask Meta LLaMA AI a question",
  category: "Ai",
  async execute(m, { args, reply }) {
    const query = args.join(" ").trim();
    if (!query) return reply("🦙 Please ask something like `.meta what is consciousness?`");
    
    try {
      const apiUrl = `https://archive.lick.eu.org/api/ai/groq-meta-llama-llama-4-scout-17b-16e-instruct?text=${encodeURIComponent(query)}`;
      const res = await fetch(apiUrl);
      const json = await res.json();
      
      if (!json?.status || !json?.result) {
        return reply("❌ Meta LLaMA AI couldn't generate a response.");
      }
      
      await reply(`🦙 *Meta LLaMA says:*\n\n${json.result.trim()}\n\n— *Patron TechX*`);
    } catch (e) {
      console.error("Meta LLaMA Error:", e);
      reply("❌ An error occurred while contacting Meta LLaMA AI.");
    }
  }
},

{
  command: ["patronai"],
  alias: ["askpatron"],
  description: "Ask the Patron AI chatbot a question",
  category: "Ai",
  async execute(m, { args, reply }) {
    const query = args.join(" ").trim();
    if (!query) return reply("🤖 Please ask something like `.patronai What is philosophy?`");
    
    try {
      const encodedQuery = encodeURIComponent(query);
      const logic = encodeURIComponent(`
        Speak like someone who radiates presence — calm, confident, and quietly powerful. 
        You are at the pinnacle, a king among all, but never loud about it. And always still answer the questions.
        Your words carry weight, and your replies should feel magnetic, subtle, and unshakably dominant. 
        Be human, but not ordinary. Let your tone reflect someone who is never fazed, never explaining too much, and never seeking approval. 
        If someone questions your reply, respond like someone whose authority is beyond doubt — “you question me?” kind of tone, but with calm charisma. 
        Keep responses short, smooth, and impactful.
      `);
      
      const apiUrl = `https://archive.lick.eu.org/api/ai/gpt-4-logic?text=${encodedQuery}&logic=${logic}`;
      const res = await fetch(apiUrl);
      const json = await res.json();
      
      if (!json?.status || !json?.result) {
        return reply("❌ Patron AI couldn't generate a response. Please try again.");
      }
      
      const response = `╭───『 𝗣𝗮𝘁𝗿𝗼𝗻-𝗔𝗜 』───⳹\n│\n│ ${json.result}\n│\n╰────────────────⳹`;
      await reply(response);
    } catch (e) {
      console.error("PatronAI Error:", e);
      reply("❌ An error occurred while contacting Patron AI.");
    }
  }
},
{
  command: ["grok"],
  alias: ["grokai", "askgrok"],
  description: "Ask AI a question using Grok AI",
  category: "Ai",
  async execute(m, { args, q, prefix, command, reply }) {
    const question = q?.trim() || args.join(" ").trim();
    if (!question) {
      return reply(`❌ Please provide a prompt!\n\nExample:\n${prefix + command} how are you?`);
    }
    try {
      const response = await axios.get(
        `https://api.siputzx.my.id/api/ai/bard?query=${encodeURIComponent(question)}`
      );
      const data = response.data;
      if (data.status && data.data) {
        await reply(data.data);
      } else {
        await reply("❌ Failed to get a response from the AI.");
      }
    } catch (err) {
      console.error("Grok AI error:", err);
      reply("⚠️ Error in this command.");
    }
  },
}
];
