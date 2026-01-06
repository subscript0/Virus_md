const axios = require("axios");

module.exports = [
{
    command: ["spotify"],
    alias: ["spot", "spplay"],
    description: "Download and play a song from Spotify",
    category: "Downloader",
    filename: __filename,
    async execute(m, { ednut, text, reply }) {
      try {
        if (!text) return reply("❌ Please provide a Spotify song name to search.");

        await reply(`⏳ Searching on Spotify...\n🎵 Query: *${text}*`);

        // 🔎 Search on Spotify
        const searchUrl = `https://delirius-apiofc.vercel.app/search/spotify?q=${encodeURIComponent(text)}&limit=1`;
        const { data: searchRes } = await axios.get(searchUrl);

        if (!searchRes?.status || !searchRes.data?.length) {
          return reply("❌ No results found on Spotify.");
        }

        const song = searchRes.data[0];
        const trackUrl = song.url;

        await reply(`📥 Found: *${song.title}* by *${song.artist}*\n▶️ Downloading...`);

        // 🌐 Updated API
        const dlUrl = `https://delirius-apiofc.vercel.app/download/spotifydl?url=${encodeURIComponent(trackUrl)}`;
        const { data: dlRes } = await axios.get(dlUrl);

        if (!dlRes?.status || !dlRes.data?.url) {
          return reply("❌ Failed to download song.");
        }

        const audioUrl = dlRes.data.url;

        // 🎶 Send audio file
        await ednut.sendMessage(
          m.chat,
          {
            audio: { url: audioUrl },
            mimetype: "audio/mpeg",
            fileName: `${dlRes.data.title} - ${dlRes.data.author}.mp3`,
            ptt: false
          },
          { quoted: m }
        );

      } catch (err) {
        await reply(`⚠️ Error: ${err.message || err}`);
      }
    }
  },
  {
    command: ["capcut"],
    description: "🎬 Download Capcut video by URL",
    category: "Downloader",
    ban: false,
    gcban: false,
    async execute(m, { ednut, text, reply }) {
      try {
        if (!text || !/^https?:\/\/.*capcut\.com/.test(text))
          return reply("❌ Please provide a valid Capcut template URL.");

        const res = await fetch(`https://api.yogik.id/downloader/capcut?url=${encodeURIComponent(text)}`);
        const json = await res.json();

        if (!json.status || !json.result?.videoUrl)
          return reply("❌ Failed to fetch Capcut video.");

        await ednut.sendMessage(m.chat, {
          video: { url: json.result.videoUrl },
          caption: global.footer,
        }, { quoted: m });

      } catch (err) {
        global.log("ERROR", `Capcut plugin failed: ${err.message || err}`);
        reply("❌ Error occurred while processing the Capcut link.");
      }
    }
  },
 {
    command: ["twitter"],
    alias: ["x"],
    description: "📹 Download Twitter/X video",
    category: "Downloader",
    ban: false,
    gcban: false,
    async execute(m, { ednut, text, fetch, reply }) {
      if (!text || (!text.includes("twitter.com") && !text.includes("x.com"))) {
        return reply("❌ Please send a valid Twitter/X link.");
      }

      try {
        const res = await fetch(`https://archive.lick.eu.org/api/download/twitterx?url=${encodeURIComponent(text)}`);
        const json = await res.json();

        if (!json.status || !json.result?.downloads?.length) {
          return reply("❌ Failed to fetch Twitter video.");
        }

        const video = json.result.downloads.find(v => v.quality.includes("MP4")) || json.result.downloads[0];

        if (!video.url) return reply("❌ No valid video found.");

        await ednut.sendMessage(m.chat, {
          video: { url: video.url },
          caption: global.footer
        }, { quoted: m });

      } catch (err) {
        global.log("ERROR", `Twitter plugin failed: ${err.message || err}`);
        reply("❌ An error occurred while processing the Twitter link.");
      }
    }
  }
];