import axios from "axios";
import { generateWAMessageFromContent, generateWAMessage, delay } from "@whiskeysockets/baileys";

async function sendAlbumMessage(sock, jid, medias, options = {}) {
  if (medias.length < 2) throw new RangeError("Se necesitan al menos 2 imágenes para un álbum")
  const caption = options.caption || ""
  const quoted  = options.quoted || null

  const album = generateWAMessageFromContent(
    jid,
    { messageContextInfo: {}, albumMessage: { expectedImageCount: medias.length } },
    quoted ? { quoted } : {}
  )

  await sock.relayMessage(album.key.remoteJid, album.message, { messageId: album.key.id })

  for (let i = 0; i < medias.length; i++) {
    const { type, data } = medias[i]
    const img = await generateWAMessage(
      album.key.remoteJid,
      { [type]: data, ...(i === 0 ? { caption } : {}) },
      { upload: sock.waUploadToServer }
    )
    img.message.messageContextInfo = {
      messageAssociation: { associationType: 1, parentMessageKey: album.key }
    }
    await sock.relayMessage(img.key.remoteJid, img.message, { messageId: img.key.id })
    await delay(500)
  }

  return album
}

export default {
  name: ["pinterest", "pin"],
  description: "Busca imágenes en Pinterest",
  category: "dl",
  ownerOnly: false,

  async run({ sock, from, msg, text, usedPrefix, react, reply }) {
    try {
      await react("⏳")

      if (!text) return await reply({
        text:
          `✨ ═══ 🫧 *PINTEREST* 🫧 ═══ ✨\n\n` +
          `❌ Debes escribir qué buscar.\n\n` +
          `💡 *Uso:*\n` +
          `  ✦ ${usedPrefix}pinterest goku\n` +
          `  ✦ ${usedPrefix}pin anime wallpaper\n\n` +
          `⚔️ _Yuta Okotsu MD | DuarteXV_`
      })

      await reply({
        text:
          `✨ ═══ 🫧 *PINTEREST* 🫧 ═══ ✨\n\n` +
          `🔍 _Buscando imágenes de_ *${text}*...\n` +
          `⏳ _Espera un momento..._`
      })

      const res = await axios.get(`https://api.alyacore.xyz/search/pinterest`, {
        params: { query: text, key: "Duarte-zz12" },
        timeout: 10000
      })

      const data = res.data

      if (!data.status || !Array.isArray(data.data) || data.data.length < 2) {
        return await reply({
          text:
            `✨ ═══ 🫧 *PINTEREST* 🫧 ═══ ✨\n\n` +
            `❌ No se encontraron imágenes para *${text}*.\n\n` +
            `⚔️ _Yuta Okotsu MD | DuarteXV_`
        })
      }

      const total  = Math.min(data.data.length, 10)
      const images = data.data.slice(0, total).map(img => ({
        type: "image",
        data: { url: img.hd }
      }))

      const caption =
        `✨ ═══ 🫧 *PINTEREST* 🫧 ═══ ✨\n\n` +
        `🔎 *Búsqueda:* ${text}\n` +
        `🖼️ *Imágenes:* ${total}\n\n` +
        `⚔️ _Yuta Okotsu MD | DuarteXV_`

      await sendAlbumMessage(sock, from, images, { caption, quoted: msg })

      await react("✅")

    } catch (error) {
      await react("❌")
      await reply({
        text:
          `✨ ═══ 🫧 *PINTEREST* 🫧 ═══ ✨\n\n` +
          `❌ *Error:* ${error.message}\n\n` +
          `⚔️ _Yuta Okotsu MD | DuarteXV_`
      })
      console.error("Error en pinterest:", error)
    }
  }
}