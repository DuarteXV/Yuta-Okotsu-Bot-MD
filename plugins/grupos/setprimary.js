import { db } from '../../database/db.js'
import { activeBots } from '../../core/subbotManager.js'

export default {
  name: ['setprimary', 'botprincipal'],
  description: 'Establece un bot como primario del grupo',
  category: 'grupos',
  groupOnly: true,
  adminOnly: true,

  async run({ from, msg, react, reply }) {
    await react('⚙️')

    // Funciones para limpiar los JIDs de multidispositivo (elimina los :1, :2, etc.)
    const parseJid = (jid) => jid ? jid.split(':')[0].split('@')[0] + '@s.whatsapp.net' : null
    const parseNum = (jid) => jid ? jid.split(':')[0].split('@')[0] : 'N/A'

    const quoted = msg.message?.extendedTextMessage?.contextInfo || msg.message?.imageMessage?.contextInfo || msg.message?.videoMessage?.contextInfo
    const quotedSender = quoted?.participant ? parseJid(quoted.participant) : null

    // ─── SIN RESPONDER → MOSTRAR BOTS DISPONIBLES ───────
    if (!quotedSender) {
      const botsActivos = [...activeBots.entries()]
        .filter(([, bot]) => bot.status === 'online')

      if (botsActivos.length === 0) {
        return await reply({
          text:
            `❌ *No hay bots activos disponibles.*\n\n` +
            `⚔️ _Yuta Okotsu MD | DuarteXV_`
        })
      }

      let texto = `🤖 *¿A qué bot quieres como primario?*\n\n`
      for (const [, bot] of botsActivos) {
        const num = parseNum(bot.jid)
        texto += `  ✦ *${bot.label || 'Sub-Bot'}* → @${num}\n`
      }
      texto += `\n💡 Responde a un mensaje de ese bot y ejecuta *.setprimary* de nuevo.\n\n`
      texto += `⚔️ _Yuta Okotsu MD | DuarteXV_`

      return await reply({ text: texto })
    }

    // ─── RESPONDIENDO → ESTABLECER ESE BOT COMO PRIMARIO ─
    const whoJid = quotedSender
    const whoNum = parseNum(whoJid)

    // Mapeamos los JIDs de la lista de activos usando la misma limpieza
    const botsActivosJids = [...activeBots.entries()]
      .filter(([, bot]) => bot.status === 'online')
      .map(([, bot]) => parseJid(bot.jid))
      .filter(Boolean)

    if (!botsActivosJids.includes(whoJid)) {
      return await reply({
        text:
          `❌ *Ese usuario no es un bot activo.*\n\n` +
          `💡 Responde al mensaje de un bot activo.\n` +
          `Usa *.bots* para ver los disponibles.\n\n` +
          `⚔️ _Yuta Okotsu MD | DuarteXV_`
      })
    }

    const current = db.getPrimary(from)
    if (current === whoNum) {
      return await reply({
        text:
          `⚠️ *Ese bot ya es el primario de este grupo.*\n\n` +
          `⚔️ _Yuta Okotsu MD | DuarteXV_`
      })
    }

    db.setPrimary(from, whoNum)

    await reply({
      text:
        `✅ *Bot primario establecido*\n\n` +
        `🤖 *${whoNum}* es ahora el bot principal.\n` +
        `Los demás bots no responderán en este grupo.\n\n` +
        `⚔️ _Yuta Okotsu MD | DuarteXV_`
    })
  }
}
