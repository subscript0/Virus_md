const { proto, getContentType } = require('@whiskeysockets/baileys')
const util = require('util')

module.exports = function setupAntidelete(ednut, store) {
  const handled = new Set()
  const recentCache = new Map()
  const CACHE_PER_CHAT = 80

  const cacheMessage = (chatId, message) => {
    if (!chatId || !message || !message.key?.id) return
    let map = recentCache.get(chatId)
    if (!map) {
      map = new Map()
      recentCache.set(chatId, map)
    }
    if (map.has(message.key.id)) map.delete(message.key.id)
    map.set(message.key.id, message)
    while (map.size > CACHE_PER_CHAT) {
      const firstKey = map.keys().next().value
      map.delete(firstKey)
    }
  }

  // Cache every message
  ednut.ev.on('messages.upsert', async ({ messages }) => {
    try {
      for (const msg of messages) {
        if (msg?.key?.id && msg?.message) cacheMessage(msg.key.remoteJid, msg)
      }
    } catch {}
  })

  // Detect deletions
  ednut.ev.on('messages.upsert', async ({ messages }) => {
    for (const msg of messages) {
      try {
        const protoMsg = msg?.message?.protocolMessage
        if (!protoMsg) continue
        if (protoMsg.type !== proto.Message.ProtocolMessage.Type.REVOKE) continue

        const key = protoMsg.key
        const chatId = key.remoteJid
        const msgId = key.id
        if (!chatId || !msgId) continue

        if (handled.has(msgId)) continue
        handled.add(msgId)
        setTimeout(() => handled.delete(msgId), 10 * 1000)

        // If global.db.settings is not present (e.g. running on Render/Heroku
        // without the control panel), do NOT enable antidelete by default.
        // DB settings may be present but not include the antidelete key. We want
        // to prefer an explicit DB value (true/false) when provided. If the DB
        // value is undefined, fall back to environment variables.
        const hasSettings = !!global?.db?.settings && typeof global.db.settings === 'object'

        const parseEnvBool = (v) => {
          if (!v) return false
          return /^(1|true|yes)$/i.test(String(v).trim())
        }

        // allow ANTIDELETE or antidelete env var names
        const envEnabled = parseEnvBool(process.env.ANTIDELETE || process.env.antidelete)

        // Determine enabled: prefer explicit DB value if the key exists; else env; else false
        let enabled = false
        if (hasSettings && Object.prototype.hasOwnProperty.call(global.db.settings, 'antidelete')) {
          enabled = Boolean(global.db.settings.antidelete)
        } else {
          enabled = envEnabled
        }

        // Diagnostic logging once when DB settings are missing or did not define the key
        if ((!hasSettings || !Object.prototype.hasOwnProperty.call(global.db.settings || {}, 'antidelete')) && !global._antidelete_warned) {
          // Suppress diagnostic logging; preserve single-time warning flag so this branch
          // only runs once even though we no longer print messages to the console.
          global._antidelete_warned = true
        }

        if (!enabled) continue

        const ownerJid =
          (ednut.decodeJid && ednut.decodeJid(ednut.user?.id)) ||
          (ednut.user && ednut.user.id)

        // Ignore messages deleted by the bot itself
        if (key.participant && ownerJid.includes(key.participant.split('@')[0]))
          continue

        let deleted = null
        if (typeof store.loadMessage === 'function') {
          try {
            deleted = await store.loadMessage(chatId, msgId, ednut)
          } catch {
            deleted = null
          }
        }

        if (!deleted) {
          const map = recentCache.get(chatId)
          deleted = map?.get(msgId)
        }

        if (!deleted) {
          for (const [jid, map] of recentCache.entries()) {
            if (map.has(msgId)) {
              deleted = map.get(msgId)
              break
            }
          }
        }

        if (!deleted) continue

        const m = require('../myfunc').smsg(ednut, deleted, store)
        const who =
          (m.sender?.split('@')[0] ||
            key.participant?.split('@')[0] ||
            'unknown')

        // Get chat name
        let chatName
        try {
          chatName = ednut.getName ? await ednut.getName(chatId) : chatId
        } catch {
          chatName = chatId
        }

        const isGroup = chatId.endsWith('@g.us')
        const chatLabel = isGroup ? `${chatName} group` : chatName

        // 🛰️ Futuristic Notice
        const headerText = `🛰️ *[DATA RESTORED]*  
> _Intercepted Deleted Transmission_  
━━━━━━━━━━━━━━━━━━  
👤 *Sender:* @${who}  
💬 *Chat:* ${chatLabel}  
━━━━━━━━━━━━━━━━━━`

        const sendTo = ownerJid

        if (m.msg?.url) {
          try {
            const buff = await ednut.downloadMediaMessage(m.msg)
            const mtype =
              getContentType(deleted.message) ||
              getContentType(m.message || {})

            // Send the deleted media first (without caption)
            if (/image/i.test(mtype)) {
              await ednut.sendMessage(sendTo, { image: buff })
            } else if (/video/i.test(mtype)) {
              await ednut.sendMessage(sendTo, { video: buff })
            } else if (/audio/i.test(mtype)) {
              await ednut.sendMessage(sendTo, {
                audio: buff,
                mimetype: 'audio/mp4',
                ptt: false,
              })
            } else if (/sticker/i.test(mtype)) {
              await ednut.sendMessage(sendTo, { sticker: buff })
            } else {
              await ednut.sendMessage(sendTo, {
                document: buff,
                fileName: 'restored.bin',
                mimetype: m.msg.mimetype || 'application/octet-stream',
              })
            }

            // Then send the futuristic delete notice after the media
            await ednut.sendMessage(sendTo, {
              text: `${headerText}\n⚙️ *Media Recovered Successfully.*`,
              mentions: [m.sender],
            })
          } catch {
            await ednut.sendMessage(sendTo, {
              text: `${headerText}\n⚠️ *Deleted media could not be recovered.*`,
              mentions: [m.sender],
            })
          }
        } else {
          const text =
            m.text ||
            m.body ||
            m.msg?.text ||
            m.msg?.caption ||
            '[No text content]'
          await ednut.sendMessage(sendTo, {
            text: `${headerText}\n🧠 *Recovered Message:*  \n${text}`,
            mentions: [m.sender],
          })
        }
      } catch (err) {
        console.error('Antidelete processing error:', err)
      }
    }
  })
}
