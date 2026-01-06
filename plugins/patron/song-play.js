const yts = require("youtube-yts");
const axios = require("axios");

module.exports = [
  {
    command: ["play"],
    alias: ["ytplay", "song", "music"],
    description: "Search and play a song from YouTube as audio",
    category: "Downloader",
    filename: __filename,
    async execute(m, { ednut, text, reply }) {
      try {
        if (!text) return reply("❌ Please provide a song name to search.");

        // 🔎 Search for video
        const search = await yts(text);
        const result = search.all?.[0];
        if (!result) return reply("❌ No video found.");

        const videoUrl = result.url;
        const title = result.title || text;

        await reply(`📥 Downloading...\n▶️ ${title}`);

        // 🌐 New API call (Rebix)
        const apiUrl = `https://api-rebix.vercel.app/api/yta?url=${encodeURIComponent(videoUrl)}`;
        const { data } = await axios.get(apiUrl);

        if (!data?.status || !data.downloadUrl) {
          return reply("❌ Failed to fetch audio from Rebix API.");
        }

        const audioUrl = data.downloadUrl;

        // ✅ Send audio
        await ednut.sendMessage(
          m.chat,
          {
            audio: { url: audioUrl },
            mimetype: "audio/mpeg",
            fileName: `${title}.mp3`,
            ptt: false,
          },
          { quoted: m }
        );

      } catch (err) {
        await reply(`⚠️ Error: ${err.message || err}`);
      }
    },
  },
];
