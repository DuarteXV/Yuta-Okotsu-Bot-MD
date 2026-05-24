import axios from 'axios'
import yts from 'yt-search'

const API_KEY = 'free_key' // API KEY

export default {
  name: ['play'],
  description: 'Descarga música de YouTube',
  category: 'downloader',
  ownerOnly: false,

  async run({ sock, from, msg, react, reply, text }) {
    try {
      if (!text) return reply({ text: '✧ Ingresa un nombre o link' })

      await react('🔍')

      let videoUrl = text

      if (!text.includes('youtube.com') && !text.includes('youtu.be')) {
        const search = await yts(text)
        if (!search.videos.length) return reply({ text: '❌ Sin resultados' })
        videoUrl = search.videos[0].url
      }

      const apis = [
        `https://yosoyyo-api-ofc.onrender.com/api/youtube?q=${encodeURIComponent(videoUrl)}&apiKey=${API_KEY}`,
      ]

      let data = null

      for (const api of apis) {
        for (let i = 0; i < 3; i++) {
          try {
            const res = await axios.get(api, { timeout: 30000 })
            if (res.data?.result?.length) {
              data = res.data.result[0]
              break
            }
          } catch {}
        }
        if (data) break
      }

      if (!data) return reply({ text: '❌ Error API' })

      const title = data.title
      const mp3 = data.download?.mp3 || data.downloads?.mp3?.url

      await sock.sendMessage(from, {
        text: `🎵 ${title}`
      }, { quoted: msg })

      await sock.sendMessage(from, {
        audio: { url: mp3 },
        mimetype: 'audio/mpeg',
        fileName: `${title}.mp3`
      }, { quoted: msg })

      await react('✅')

    } catch (error) {
      await react('❌')
      await reply({ text: `❌ Error: ${error.message}` })
    }
  }
}
