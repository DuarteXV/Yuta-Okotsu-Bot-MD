import { db } from '../../database/db.js'
import { activeBots } from '../../core/subbotManager.js'

export default {
  name: ['setprimary', 'botprincipal'],
  description: 'Establece un bot como primario del grupo',
  category: 'grupos',
  groupOnly: true,
  adminOnly: true,

  async run({ sock, from, msg, botJid, react, reply }) {
    await react('⚙️')

    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
    const quoted    = msg.message?.extendedTextMessage?.contextInfo?.participant

    const who = mentioned[0] || quoted || null

    // Obtener bots activos
    const botsActivos = [...activeBots.entries()]
      .filter(([, bot]) => bot.status === 'online')
      .map(([, bot]) => bot.jid?.split(':')[0] + '@s.whatsapp.net')
      .filter(Boolean)

    if (!who) {
      // Si no menciona a nadie, establecer el bot actual
      const botId = botJid.split(':')[0].split('@')[0]
      db.setPrimary(from, botId)
      return await reply({
        text:
          `✅ *Bot primario establecido*\n\n` +
          `🤖 Ahora solo *${botId}* responderá en este grupo.\n\n` +
          `⚔️ _Yuta Okotsu MD | DuarteXV_`
      })
    }

    const whoNum = who.split(':')[0].split('@')[0]
    const whoJid = whoNum + '@s.whatsapp.net'

    // Verificar que sea un bot activo
    const esBot = botsActivos.some(j => j.includes(whoNum))
    if (!esBot) {
      return await reply({
        text:
          `❌ *@${whoNum} no es un bot activo o no está conectado.*\n\n` +
          `💡 Usa *.bots* para ver los bots disponibles.\n\n` +
          `⚔️ _Yuta Okotsu MD | DuarteXV_`,
        mentions: [whoJid]
      })
    }

    // Verificar si ya es el primario
    const current = db.getPrimary(from)
    if (current === whoNum) {
      return await reply({
        text:
          `⚠️ *@${whoNum} ya es el bot primario de este grupo.*\n\n` +
          `⚔️ _Yuta Okotsu MD | DuarteXV_`,
        mentions: [whoJid]
      })
    }

    db.setPrimary(from, whoNum)
    await reply({
      text:
        `✅ *Bot primario actualizado*\n\n` +
        `🤖 Ahora @${whoNum} es el bot principal de este grupo.\n` +
        `Los demás bots no responderán aquí.\n\n` +
        `⚔️ _Yuta Okotsu MD | DuarteXV_`,
      mentions: [whoJid]
    })
  }
}