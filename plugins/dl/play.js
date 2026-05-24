import axios from 'axios'
import yts from 'yt-search'

const API_KEY = 'free_key' // API KEY

const handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) {
    return m.reply(`✧ Ingresa el nombre o link\n\nEjemplo:\n${usedPrefix + command} hola remix`)
  }

  await m.reply('🔍 Buscando...')

  try {
    let videoUrl = text

    if (!text.includes('youtube.com') && !text.includes('youtu.be')) {
      const search = await yts(text)

      if (!search.videos.length) {
        return m.reply('❌ No encontré resultados')
      }

      videoUrl = search.videos[0].url
    }

    const apis = [
      `https://yosoyyo-api-ofc.onrender.com/api/youtube?q=${encodeURIComponent(videoUrl)}&apiKey=${API_KEY}`,
    ]

    let data = null

    for (const api of apis) {
      for (let i = 0; i < 3; i++) {
        try {
          const res = await axios.get(api, {
            timeout: 30000
          })

          if (res.data?.result?.length) {
            data = res.data.result[0]
            break
          }
        } catch {}
      }

      if (data) break
    }

    if (!data) {
      return m.reply('❌ Error al obtener el audio')
    }

    const title = data.title
    const mp3 = data.download?.mp3 || data.downloads?.mp3?.url

    await conn.sendMessage(m.chat, {
      text: `🎵 ${title}`,
      contextInfo: {
        externalAdReply: {
          title,
          body: 'YOSOYYO API',
          mediaType: 1,
          previewType: 0,
          renderLargerThumbnail: true,
          thumbnailUrl: 'https://i.imgur.com/JPXxVxN.jpeg',
          sourceUrl: videoUrl
        }
      }
    }, { quoted: m })

    await conn.sendMessage(m.chat, {
      audio: { url: mp3 },
      mimetype: 'audio/mpeg',
      fileName: `${title}.mp3`
    }, { quoted: m })

  } catch (e) {
    m.reply(`❌ ${e.message}`)
  }
}

handler.help = ['play']
handler.tags = ['downloader']
handler.command = ['play', 'ytplay', 'music']

export default handler
