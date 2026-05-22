import { activeBots } from '../../core/subbotManager.js'

export default {
  name: ['bots', 'listbots'],
  description: 'Muestra todos los bots conectados',
  category: 'misc',
  ownerOnly: false,

  async run({ react, reply }) {
    await react('🤖')

    const hora  = new Date().toLocaleTimeString('es-CO', { hour12: false })
    const fecha = new Date().toLocaleDateString('es-CO')

    let text = `✨ ═══ 🫧 *YUTA OKOTSU* 🫧 ═══ ✨\n`
    text += `🤖 _Bots conectados al sistema_\n\n`

    if (activeBots.size === 0) {
      text += `❌ No hay bots registrados.\n`
    } else {
      let i = 1
      for (const [id, bot] of activeBots) {
        const status = bot.status === 'online' ? '🟢' : '🔴'
        const tipo   = bot.isMain ? '👑 *PRINCIPAL*' : '🤖 Subbot'
        const num    = bot.jid?.split(':')[0] || bot.jid?.split('@')[0] || 'N/A'
        text += `${status} *${i}. ${bot.label}*\n`
        text += `   ✦ Tipo: ${tipo}\n`
        text += `   ✦ Número: ${num}\n`
        text += `   ✦ Estado: ${bot.status}\n\n`
        i++
      }
    }

    text += `_${hora} • ${fecha}_\n`
    text += `⚔️ _Yuta Okotsu MD | DuarteXV_`

    await reply({ text })
  }
}