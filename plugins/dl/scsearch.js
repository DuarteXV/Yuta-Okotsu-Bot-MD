import axios from 'axios'

let cachedClientId = null
let cacheTime = 0

async function getClientId() {
  if (cachedClientId && Date.now() - cacheTime < 3600000) return cachedClientId

  const html = await axios.get('https://soundcloud.com', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    timeout: 10000
  }).then(r => r.data)

  const scripts = [...html.matchAll(/src="(https:\/\/a-v2\.sndcdn\.com\/assets\/[^"]+\.js)"/g)].map(m => m[1])

  for (const script of scripts.slice(-3)) {
    try {
      const js = await axios.get(script).then(r => r.data)
      const match = js.match(/client_id:"([a-zA-Z0-9]+)"/)
      if (match) {
        cachedClientId = match[1]
        cacheTime = Date.now()
        return cachedClientId
      }
    } catch {}
  }
  throw new Error('No se pudo obtener el client_id de SoundCloud')
}

function msToTime(ms) {
  const m = Math.floor(ms / 60000)
  const s = Math.floor((ms % 60000) / 1000).toString().padStart(2, '0')
  return `${m}:${s}`
}

export default {
  name: ['scsearch', 'scbuscar', 'scb'],
  description: 'Busca canciones en SoundCloud y devuelve los links',
  category: 'dl',
  ownerOnly: false,

  async run({ text, usedPrefix, react, reply }) {
    try {
      await react('🔍')

      if (!text) return await reply({
        text: `❌ Escribe el nombre a buscar.\n\n💡 *${usedPrefix}scsearch bad bunny*`
      })

      const clientId = await getClientId()
      const r = await axios.get('https://api-v2.soundcloud.com/search/tracks', {
        params: { q: text, client_id: clientId, limit: 5 },
        timeout: 10000
      })

      const results = r.data.collection
      if (!results?.length) throw new Error('No se encontraron resultados')

      let txt = `🎵 *Resultados para:* _${text}_\n\n`

      results.forEach((t, i) => {
        txt += `*${i + 1}.* *${t.title}*\n`
        txt += `   👤 ${t.user.username}\n`
        txt += `   ⏱️ ${msToTime(t.duration)}\n`
        txt += `   🔗 ${t.permalink_url}\n\n`
      })

      txt += `💡 Descarga con *${usedPrefix}scdl <url>*\n`
      txt += `⚔️ _Yuta Okotsu MD | DuarteXV_`

      await reply({ text: txt })
      await react('✅')

    } catch (error) {
      await react('❌')
      await reply({ text: `❌ Error: ${error.message}` })
    }
  }
}