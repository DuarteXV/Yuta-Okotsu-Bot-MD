import { downloadMediaMessage } from '@whiskeysockets/baileys'

export default {
  name: ['pvt'],
  description: 'Convierte un video respondido en nota de video',
  category: 'misc',
  ownerOnly: false,

  async run({ sock, from, msg, react, reply }) {
    const msgType = Object.keys(msg.message || {})[0]
    const contextInfo = msg.message?.extendedTextMessage?.contextInfo
    const quoted = contextInfo?.quotedMessage
    const quotedType = quoted ? Object.keys(quoted)[0] : null

    const isVideo = msgType === 'videoMessage'
    const isQuotedVideo = quotedType === 'videoMessage'

    if (!isVideo && !isQuotedVideo) {
      return reply({ text: '❌ Responde a un video para convertirlo en nota de video (pvt).' })
    }

    await react('⏳')

    const targetMsg = isVideo
      ? msg
      : {
          key: {
            remoteJid: from,
            id: contextInfo?.stanzaId,
            participant: contextInfo?.participant
          },
          message: quoted
        }

    let videoBuffer
    try {
      videoBuffer = await downloadMediaMessage(targetMsg, 'buffer', {}, { sock })
    } catch (e) {
      await react('❌')
      return reply({ text: '❌ No se pudo descargar el video.' })
    }

    await sock.sendMessage(from, {
      video: videoBuffer,
      mimetype: 'video/mp4',
      ptv: true,
      contextInfo: {
        mentionedJid: [msg.key?.participant || from],
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: '120363420979328566@newsletter',
          newsletterName: '⏤͟͞ू⃪𝐁𝕃𝐔𝔼 𝐋𝕆𝐂𝕂 𝐂𝕃𝐔𝔹 𑁯🩵ᰍ',
          serverMessageId: -1
        }
      }
    }, { quoted: msg })

    await react('✅')
  }
}