const yts = require("youtube-yts");
const axios = require("axios");

module.exports = [
  {
    command: ["yta"],
    alias: ["ytmp3", "ytaudio"],
    description: "Download YouTube audio (MP3)",
    category: "Downloader",
    ban: true,
    gcban: true,
    execute: async (m, { ednut, text, reply }) => {
      if (!text) return reply("❌ Please provide a YouTube video link.");
      if (!text.includes("youtube.com") && !text.includes("youtu.be")) {
        return reply("❌ Invalid YouTube link!");
      }

      try {
        await reply("⏳ Processing your request...");

        // 🌐 Updated API
        const api = `https://api-rebix.vercel.app/api/yta?url=${encodeURIComponent(text)}`;
        const { data } = await axios.get(api);

        if (!data?.status || !data?.downloadUrl) {
          console.log("Failed API response:", data);
          return reply("❌ Failed to fetch audio from Rebix API.");
        }

        const audioUrl = data.downloadUrl;

        // ✅ Send the audio file
        await ednut.sendMessage(
          m.chat,
          {
            audio: { url: audioUrl },
            mimetype: "audio/mpeg",
            fileName: `YouTube-Audio.mp3`,
            ptt: false
          },
          { quoted: m }
        );

      } catch (err) {
        console.log("yta command error:", err.response?.data || err.message || err);
        reply("❌ An error occurred while downloading the audio.");
      }
    },
  },

 {
    command: ["ytv"],
    alias: ["ytmp4", "ytvideo", "mp4"],
    description: "Download YouTube video as MP4",
    category: "Downloader",
    ban: true,
    gcban: true,
    async execute(m, { ednut, text, reply }) {
      if (!text) return reply("❌ Please provide a YouTube video link.");
      if (!text.includes("youtube.com") && !text.includes("youtu.be")) {
        return reply("❌ Invalid YouTube link!");
      }

      try {
        await reply("⏳ Processing your request...");

        // 🌐 Updated API (Izumi / PxSx)
        const api = `https://izumiiiiiiii.dpdns.org/downloader/youtube?url=${encodeURIComponent(
          text
        )}&format=720`;
        const { data } = await axios.get(api);

        if (!data?.status || !data?.result?.download) {
          console.log("Failed API response:", data);
          return reply("❌ Failed to fetch video download link.");
        }

        const info = data.result;

        // ✅ Send video
        await ednut.sendMessage(
          m.chat,
          {
            video: { url: info.download },
            mimetype: "video/mp4",
            caption: `🎬 *${info.title}*\n📺 Channel: *${info.author?.channelTitle || "Unknown"}*\n🕒 Duration: *${info.metadata?.duration || "N/A"}*\n👁️ Views: *${info.metadata?.view || "N/A"}*`,
          },
          { quoted: m }
        );
      } catch (err) {
        console.log("ytv command error:", err.response?.data || err.message || err);
        reply("❌ An error occurred while downloading the video.");
      }
    },
  },

{
  command: ["video"],
  alias: ["ytgrab"],
  description: "Search and download YouTube video",
  category: "Downloader",
  ban: true,
  gcban: true,
  async execute(m, { ednut, text, reply }) {
    if (!text) return reply("❌ Please provide a video name to search.");

    try {
      const search = await yts(text);
      const result = search.all?.[0];
      if (!result) return reply("❌ No video found.");

      const videoUrl = result.url;
      await reply(`🔍 Found: *${result.title}*\n▶️ Fetching download link...`);

      const apiUrl = `https://izumiiiiiiii.dpdns.org/downloader/youtube?url=${encodeURIComponent(videoUrl)}&format=720`;
      const { data } = await axios.get(apiUrl);

      if (!data?.status || !data?.result?.download) {
        console.log("Failed API response:", data);
        return reply("❌ Failed to fetch video download link.");
      }

      const info = data.result;

      await ednut.sendMessage(
        m.chat,
        {
          video: { url: info.download },
          mimetype: "video/mp4",
          caption: `🎬 *${info.title}*\n📺 Channel: *${info.author?.channelTitle || "Unknown"}*\n🕒 Duration: *${info.metadata?.duration || "N/A"}*\n👁️ Views: *${info.metadata?.view || "N/A"}*`,
        },
        { quoted: m }
      );

    } catch (err) {
      console.log("video command error:", err.response?.data || err.message || err);
      reply("❌ An error occurred while downloading the video.");
    }
  },
}
];