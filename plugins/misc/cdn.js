import { downloadMediaMessage } from '@whiskeysockets/baileys'
import axios from 'axios'

const CDN_URL = 'https://cdn.adoolab.xyz'

const MEDIA_TYPES = {
  imageMessage:    { ext: 'jpg',  mime: 'image/jpeg' },
  videoMessage:    { ext: 'mp4',  mime: 'video/mp4' },
  audioMessage:    { ext: 'm4a',  mime: 'audio/mp4' },
  documentMessage: { ext: 'bin',  mime: 'application/octet-stream' },
  stickerMessage:  { ext: 'webp', mime: 'image/webp' },
  ptvMessage:      { ext: 'mp4',  mime: 'video/mp4' },
}

async function subirCDN(buffer, filename, mimetype, expiration = 'never') {
  const blob = new Blob([buffer], { type: mimetype })
  const form = new FormData()
  form.append('file', blob, filename)
  form.append('expiration', expiration)

  const res = await axios.post(`${CDN_URL}/api/upload`, form, {
    timeout: 120000,
    maxContentLength: Infinity,
    maxBodyLength: Infinity
  })

  return res.data
}

export default {
  name: ['cdn', 'subir', 'upload'],
  description: 'Sube un archivo al CDN y te da el enlace',
  category: 'misc',
  ownerOnly: false,

  async run({ sock, from, msg, args, usedPrefix, react, reply }) {
    try {
      await react('⏳')

      const expiraciones = {
        'nunca': 'never', 'never': 'never',
        '1m': '1m', '5m': '5m', '10m': '10m', '30m': '30m',
        '1h': '1h', '6h': '6h', '12h': '12h',
        '1d': '1d', '3d': '3d', '7d': '7d', '30d': '30d'
      }

      const expArg     = args[0]?.toLowerCase()
      const expiration = expiraciones[expArg] || 'never'

      const msgType    = Object.keys(msg.message || {})[0]
      const quoted     = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
      const quotedType = quoted ? Object.keys(quoted)[0] : null

      let targetMsg = null
      let mediaInfo = null

      if (MEDIA_TYPES[msgType]) {
        targetMsg = msg
        mediaInfo = { type: msgType, ...MEDIA_TYPES[msgType] }
      } else if (quoted && MEDIA_TYPES[quotedType]) {
        targetMsg = {
          key: {
            remoteJid: from,
            id: msg.message.extendedTextMessage.contextInfo.stanzaId,
            participant: msg.message.extendedTextMessage?.contextInfo?.participant,
          },
          message: quoted,
        }
        mediaInfo = { type: quotedType, ...MEDIA_TYPES[quotedType] }
      } else if (quoted) {
        for (const [key, info] of Object.entries(MEDIA_TYPES)) {
          if (quoted[key] || quoted.buttonsMessage?.[key] || quoted.templateMessage?.hydratedTemplate?.[key]) {
            targetMsg = {
              key: {
                remoteJid: from,
                id: msg.message.extendedTextMessage.contextInfo.stanzaId,
                participant: msg.message.extendedTextMessage?.contextInfo?.participant,
              },
              message: quoted,
            }
            mediaInfo = { type: key, ...info }
            break
          }
        }
      }

      if (!targetMsg || !mediaInfo) {
        return await reply({
          text:
            `❌ Responde o envía un archivo para subirlo al CDN.\n\n` +
            `💡 *${usedPrefix}cdn* ➔ subir permanente\n` +
            `💡 *${usedPrefix}cdn 1d* ➔ expira en 1 día\n` +
            `💡 *${usedPrefix}cdn 7d* ➔ expira en 7 días\n\n` +
            `⏱️ *Expiraciones:* never, 1m, 5m, 10m, 30m, 1h, 6h, 12h, 1d, 3d, 7d, 30d`
        })
      }

      const buffer   = await downloadMediaMessage(targetMsg, 'buffer', {}, { sock })
      const filename = `${Date.now()}.${mediaInfo.ext}`

      const resultado = await subirCDN(buffer, filename, mediaInfo.mime, expiration)

      const url = resultado?.url || resultado?.data?.url || resultado?.file?.url

      if (!url) throw new Error('No se obtuvo URL del CDN')

      const exp = expiration === 'never' ? '♾️ Permanente' : `⏱️ Expira en: ${expiration}`

      await reply({
        text:
          `✅ *Archivo subido al CDN*\n\n` +
          `📎 *Tipo:* ${mediaInfo.type.replace('Message', '')}\n` +
          `📏 *Tamaño:* ${(buffer.length / 1024).toFixed(1)} KB\n` +
          `${exp}\n\n` +
          `🔗 *URL:*\n${url}`
      })

      await react('✅')

    } catch (error) {
      await react('❌')
      await reply({ text: `❌ Error: ${error.message}` })
      console.error('Error en cdn:', error)
    }
  }
}