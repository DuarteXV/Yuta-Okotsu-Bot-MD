import axios from 'axios'

function validateTikTokUrl(url) {
  try {
    url = url.trim().replace(/[^\x00-\x7F]/g, "")

    const patterns = [
      /(?:https?:\/\/)?(?:www\.)?tiktok\.com\/@([^\/]+)\/video\/(\d+)/,
      /(?:https?:\/\/)?vm\.tiktok\.com\/([A-Za-z0-9]+)/,
      /(?:https?:\/\/)?vt\.tiktok\.com\/([A-Za-z0-9]+)/,
      /(?:https?:\/\/)?m\.tiktok\.com\/v\/(\d+)/,
      /(?:https?:\/\/)?www\.tiktok\.com\/t\/([A-Za-z0-9]+)/
    ]

    for (const pattern of patterns) {
      if (pattern.test(url)) {
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          url = 'https://' + url
        }
        return url
      }
    }

    return null
  } catch (error) {
    console.error('Error validating TikTok URL:', error)
    return null
  }
}

function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function formatFecha(timestamp) {
  if (!timestamp) return 'Desconocida'
  const fecha = new Date(timestamp * 1000)
  return fecha.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'America/Bogota'
  })
}

async function downloadFromMultipleAPIs(url) {
  const apis = [
    { name: 'TikWM', func: () => tiktokTikWM(url) },
    { name: 'Eliasar', func: () => tiktokEliasar(url) },
    { name: 'SSSTik', func: () => tiktokSSSTik(url) },
    { name: 'TikDown', func: () => tiktokTikDown(url) }
  ]

  for (const api of apis) {
    try {
      console.log(`🔍 Intentando con ${api.name}...`)
      const result = await api.func()

      if (result && result.videoUrl) {
        console.log(`✅ ${api.name} exitoso`)
        return result
      }
    } catch (error) {
      console.log(`❌ ${api.name} falló: ${error.message}`)
      continue
    }
  }

  return null
}

async function tiktokTikWM(url) {
  try {
    const apiUrl = `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}&hd=1`

    const { data } = await axios.get(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Referer': 'https://www.tikwm.com/',
        'Origin': 'https://www.tikwm.com'
      },
      timeout: 15000
    })

    if (data.code === 0 && data.data && data.data.play) {
      const d = data.data

      return {
        videoUrl: d.play,
        id: d.id,
        title: d.title,
        duration: d.duration,
        region: d.region,
        createTime: d.create_time,
        authorNick: d.author?.nickname || 'Desconocido',
        authorUser: d.author?.unique_id || 'desconocido',
        musicTitle: d.music_info?.title || '',
        musicAuthor: d.music_info?.author || '',
        musicDuration: d.music_info?.duration,
        playCount: d.play_count,
        likes: d.digg_count,
        comments: d.comment_count,
        shares: d.share_count,
        downloads: d.download_count
      }
    }

    throw new Error('No video data found')
  } catch (error) {
    throw new Error(`TikWM API error: ${error.message}`)
  }
}

async function tiktokEliasar(url) {
  try {
    const apiUrl = `https://eliasar-yt-api.vercel.app/api/search/tiktok?query=${encodeURIComponent(url)}`

    const { data } = await axios.get(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 15000
    })

    if (data.results && data.results.video) {
      return {
        videoUrl: data.results.video,
        title: data.results.title || '',
        authorUser: data.results.author || 'Desconocido'
      }
    }

    throw new Error('No video data found')
  } catch (error) {
    throw new Error(`Eliasar API error: ${error.message}`)
  }
}

async function tiktokSSSTik(url) {
  try {
    const apiUrl = `https://ssstik.io/abc?url=dl`

    const formData = new URLSearchParams()
    formData.append('id', url)
    formData.append('locale', 'en')
    formData.append('tt', 'RFBiZ3Bi')

    const { data: html } = await axios.post(apiUrl, formData.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Origin': 'https://ssstik.io',
        'Referer': 'https://ssstik.io/'
      },
      timeout: 15000
    })

    const videoMatch = html.match(/href="([^"]*\.mp4[^"]*)"/)
    const titleMatch = html.match(/<p class="maintext">([^<]+)</)

    if (videoMatch && videoMatch[1]) {
      return {
        videoUrl: videoMatch[1],
        title: titleMatch ? titleMatch[1] : '',
        authorUser: 'Desconocido'
      }
    }

    throw new Error('No video URL found in response')
  } catch (error) {
    throw new Error(`SSSTik API error: ${error.message}`)
  }
}

async function tiktokTikDown(url) {
  try {
    const apiUrl = `https://tikdown.org/api/ajaxSearch`

    const formData = new URLSearchParams()
    formData.append('q', url)
    formData.append('lang', 'en')

    const { data } = await axios.post(apiUrl, formData.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Origin': 'https://tikdown.org',
        'Referer': 'https://tikdown.org/'
      },
      timeout: 15000
    })

    if (data.status === 'ok' && data.data) {
      const videoMatch = data.data.match(/href="([^"]*\.mp4[^"]*)"/)

      if (videoMatch && videoMatch[1]) {
        return {
          videoUrl: videoMatch[1],
          title: '',
          authorUser: 'Desconocido'
        }
      }
    }

    throw new Error('No video data found')
  } catch (error) {
    throw new Error(`TikDown API error: ${error.message}`)
  }
}

export default {
  name: ['tiktok', 'tt'],
  description: 'Descarga videos de TikTok',
  category: 'dl',
  groupOnly: false,

  async run({ sock, from, msg, args, usedPrefix, cmdName, reply, react }) {
    if (!args[0]) {
      return await reply({
        text: `🎵 Por favor, ingresa un enlace de TikTok.\n\n📝 *Ejemplo:* ${usedPrefix}${cmdName} https://www.tiktok.com/@usuario/video/1234567890`
      })
    }

    const tiktokUrl = validateTikTokUrl(args[0])
    if (!tiktokUrl) {
      return await reply({
        text: `❌ URL de TikTok inválida. Por favor verifica el enlace.\n\n✅ *URLs válidas:*\n• https://www.tiktok.com/@usuario/video/...\n• https://vm.tiktok.com/...\n• https://vt.tiktok.com/...`
      })
    }

    await react('🔄')
    await reply({ text: `> ✎...Descargando video.` })

    try {
      const result = await downloadFromMultipleAPIs(tiktokUrl)

      if (!result || !result.videoUrl) {
        await react('❌')
        return await reply({ text: `❌ No se pudo descargar el video. El enlace podría ser privado o no válido.` })
      }

      const titulo = result.title?.trim() || 'Sin título'
      const musica = result.musicTitle?.trim() || ''
      const artista = result.musicAuthor?.trim() || ''
      const durAudio = result.musicDuration ? formatDuration(result.musicDuration) : ''

      let caption = `☑ *Video de TikTok descargado*\n`
      caption += `╰━━━━━━━━⁽ ☆ ⁾━━━━━━━━╯\n\n`
      caption += `👤ᴬᵘᵗᵒʳ: ${result.authorNick || 'Desconocido'}\n`
      caption += `🆔 ᴵᴰ: ${result.id || 'N/A'}\n`
      caption += `📝 ᵘˢᵘᵃʳⁱᵒ: @${result.authorUser || 'desconocido'}\n`
      caption += `⏱️ ᵘᵘᵒⁿ: ${formatDuration(result.duration)}\n`
      caption += `🌎 ʳᵉᵍⁱᵒ́ⁿ: ${result.region || 'N/A'}\n`
      caption += `📅 ᵖᵘᵇˡⁱᶜᵃᵃᵃᵒ: ${formatFecha(result.createTime)}\n`
      caption += `♡ ˡⁱᵏᵉˢ: ${result.likes ?? 'N/A'}\n`
      caption += `⌲ ˢʰᵃʳᵉˢ: ${result.shares ?? 'N/A'}\n`
      caption += `○ ᶜᵒᵐᵉⁿᵗˢ: ${result.comments ?? 'N/A'}\n`
      caption += `▶️ ᵖˡᵃʸˢ: ${result.playCount ?? 'N/A'}\n`
      if (musica) caption += `🎵 ᵐᵘ́ˢⁱᶜᵃ: ${musica}\n`
      if (artista) caption += `🎤 ᵃʳᵗⁱˢᵗᵃ: ${artista}\n`
      caption += `📹 ᵗⁱᵗᵘˡᵒ: ${titulo}`

      await sock.sendMessage(from, {
        video: { url: result.videoUrl },
        mimetype: 'video/mp4',
        fileName: 'tiktok.mp4',
        caption
      }, { quoted: msg })

      await react('✅')

    } catch (error) {
      console.error('Error en TikTok download:', error)
      await react('❌')
      await reply({
        text: `❌ Error al procesar la descarga: ${error.message}\n\n💡 *Consejos:*\n• Verifica que el video sea público\n• Intenta con un enlace diferente\n• El video podría estar restringido por región`
      })
    }
  }
}