const axios = require("axios");

module.exports = [
  {
    command: ["instagram"],
alias: ["igdl", "ig", "insta"],
description: "Download Instagram media",
category: "Downloader",
ban: true,
gcban: true,
execute: async (m, { ednut, text, reply }) => {
  if (!text) return reply("❎ Please input an Instagram link.");
  if (!text.includes("instagram.com")) return reply("❎ Input a valid Instagram link!");

  try {
    const apiUrl = `https://delirius-apiofc.vercel.app/download/instagram?url=${encodeURIComponent(text)}`;
    const { data } = await axios.get(apiUrl);

    if (!data || !data.status || !data.data || !data.data.length) {
      return reply("⚠️ Could not retrieve any media.");
    }

    // Notify user
    reply(`⏳ Downloading... Please wait 🚀\n\n📥 Found ${data.data.length} file(s)`);

    for (let i = 0; i < data.data.length; i++) {
      let media = data.data[i];

      let caption =
        media.type === "video"
          ? `🎬 Video ${i + 1}/${data.data.length}`
          : `📸 Image ${i + 1}/${data.data.length}`;

      // Send using sendMessage
      await ednut.sendMessage(
        m.chat,
        {
          [media.type === "video" ? "video" : "image"]: { url: media.url },
          caption
        },
        { quoted: m }
      );
    }
  } catch (err) {
    global.log("ERROR", `Instagram downloader: ${err.message || err}`);
    reply("❎ Instagram download failed.");
  }
}},
  {
    command: ["facebook"],
    alias: ["fb", "fbvid", "fbvideo"],
    description: "Download Facebook media",
    category: "Downloader",
    ban: true,
    gcban: true,
    execute: async (m, { ednut, axios, text, reply }) => {
      try {
        if (!text) return reply("Please provide a Facebook video link.");
        if (!/(facebook\.com|fb\.watch)/.test(text)) return reply("Invalid Facebook link!");

        const apiUrl = `https://fb.bdbots.xyz/dl?url=${encodeURIComponent(text)}`;
        const { data } = await axios.get(apiUrl);

        if (data.status !== "success" || !data.downloads || !data.downloads.length) {
          return reply(`❌ Failed to fetch download links.`);
        }

        // Prefer HD link if available
        const videoLink = data.downloads.find(d => d.quality === 'HD')?.url
                        || data.downloads[0].url;

        const title = data.title || "Facebook Video";

        // Send video
        await ednut.sendMessage(
          m.chat,
          { video: { url: videoLink }, caption: `🎥 *${title}*\n${global.footer}` },
          { quoted: m }
        );
      } catch (err) {
        global.log("ERROR", `Facebook downloader failed: ${err.message}`);
        reply("❌ Facebook download failed.");
      }
    }
  },
  {
    command: ["tiktok"],
    alias: ["tt", "ttvid"],
    description: "Download TikTok video",
    category: "Downloader",
    ban: false,
    execute: async (m, { ednut, api, text, reply }) => {
      if (!text) return reply("Please input a TikTok link.");
      if (!text.includes("tiktok.com") && !text.includes("vm.tiktok.com")) return reply("Invalid TikTok link!");
      try {
        let res = await api.tiktok(text);
        let cap = global.footer;
        if (res.result.duration === 0) {
          for (let a of res.result.images) {
            await ednut.sendMessage(m.chat, { image: { url: a }, caption: cap }, { quoted: m });
          }
        } else {
          await ednut.sendMessage(m.chat, {
            video: { url: res.result.play },
            mimetype: "video/mp4",
            caption: cap
          }, { quoted: m });
        }
      } catch (err) {
        global.log("ERROR", `TikTok downloader: ${err.message || err}`);
        reply("TikTok download failed.");
      }
    }
  },

  {
    command: ["tiktoksound"],
    alias: ["ttmp3", "tiktokmp3"],
    description: "Download TikTok audio",
    category: "Downloader",
    ban: true,
    gcban: true,
    execute: async (m, { ednut, tiktokDl, text, reply }) => {
      if (!text) return reply("Please input a TikTok link.");
      if (!text.startsWith("https://")) return reply("Invalid TikTok link.");
      try {
        let res = await tiktokDl(text);
        if (!res?.status) return reply("Audio not found.");
        await ednut.sendMessage(m.chat, {
          audio: { url: res.music_info.url },
          mimetype: "audio/mpeg"
        }, { quoted: m });
      } catch (err) {
        global.log("ERROR", `TikTok MP3: ${err.message || err}`);
        reply("TikTok audio download failed.");
      }
    }
  },

  {
    command: ["shortlink-dl"],
    description: "Download media from a shortened link",
    category: "Downloader",
    ban: true,
    gcban: true,
    execute: async (m, { ednut, fetch, text, isUrl, reply }) => {
      if (!text) return reply("Please input a URL.");
      if (!isUrl(text)) return reply("Invalid URL.");
      try {
        let api = await fetch(`https://moneyblink.com/st/?api=524de9dbd18357810a9e6b76810ace32d81a7d5f&url=${text}`);
        let res = await api.json();
        await ednut.sendMessage(m.chat, { text: res.url }, { quoted: m });
      } catch (err) {
        global.log("ERROR", `Shortlink-DL: ${err.message || err}`);
        reply("Failed to process shortlink.");
      }
    }
  }
];