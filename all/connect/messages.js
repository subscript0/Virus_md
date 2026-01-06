const { smsg } = require("../myfunc");
const QuickLRU = require("quick-lru").default;
const handledMessages = new QuickLRU({ maxSize: 1000 });


module.exports = function handleMessages(ednut, store) {
  ednut.ev.removeAllListeners("messages.upsert");

  ednut.ev.on("messages.upsert", async (chatUpdate) => {
    try {
      const mek = chatUpdate.messages?.[0];
      if (!mek?.message) return;

      const msgId = mek.key?.id;
      if (!msgId || handledMessages.has(msgId)) return;
      handledMessages.set(msgId, true);

      // unwrap ephemeral safely
      mek.message = mek.message?.ephemeralMessage?.message || mek.message;

      const jid = mek.key.remoteJid || "";
      const fromBot = mek.key.fromMe;
      const isGroup = jid.endsWith("@g.us");

      // ⚡ Quick fast parse for LID/group
      const text =
        mek.message.conversation ||
        mek.message.extendedTextMessage?.text ||
        mek.message.imageMessage?.caption ||
        mek.message.videoMessage?.caption ||
        "";
      if (!text && isGroup) return; // skip empty group notices fast

      // 🧩 Use smsg for deeper parse (command-ready)
      const m = smsg(ednut, mek, store);

      // ✅ Auto View Status
      if (jid === "status@broadcast") {
        const statusEnabled = process.env.STATUS === "true" || global.db.settings?.readsw === true;
        if (statusEnabled) await ednut.readMessages([mek.key]).catch(() => {});
        return;
      }

      // ✅ Auto Read
      if (process.env.READ === "true" || global.db.settings?.autoread === true)
        ednut.readMessages([mek.key]).catch(() => {});

      // ✅ Presence Updates
      if (!fromBot && global.db.settings?.autotyping === true)
        ednut.sendPresenceUpdate("composing", jid).catch(() => {});
      if (!fromBot && global.db.settings?.autorecording === true)
        ednut.sendPresenceUpdate("recording", jid).catch(() => {});
      if (!fromBot) {
        const online = process.env.ONLINE === "true" || global.db.settings?.available === true;
        ednut.sendPresenceUpdate(online ? "available" : "unavailable", jid).catch(() => {});
      }

      // ✅ Command Handler (async batch for groups)
      if (isGroup) {
        setImmediate(() => require("../../handler")(ednut, m, chatUpdate, mek, store));
      } else {
        require("../../handler")(ednut, m, chatUpdate, mek, store);
      }
    } catch (err) {
      if (!ednut.user?.id) return;
      console.error("Message Handler Error:", err.stack || err.message);
    }
  });
};
