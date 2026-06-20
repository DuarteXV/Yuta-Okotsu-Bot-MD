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

    const parseJid = (jid) => jid ? jid.split(':')[0].split('@')[0] : null

    const quoted = msg.message?.extendedTextMessage?.contextInfo || msg.message?.imageMessage?.contextInfo || msg.message?.videoMessage?.contextInfo
    const quotedSender = quoted?.participant ? parseJid(quoted.participant) : null

    // ─── SIN RESPONDER → MOSTRAR BOTS DISPONIBLES ───────
    if (!quotedSender) {
      const botsActivos = [...activeBots.entries()]
        .filter(([, bot]) => bot.status === 'online')

      if (botsActivos.length === 0) {
        return await reply({
          text: `❌ *No hay bots activos disponibles.*\n\n⚔️ _Yuta Okotsu MD | DuarteXV_`
        })
      }

      let texto = `🤖 *¿A qué bot quieres como primario?*\n\n`
      for (const [, bot] of botsActivos) {
        const num = parseJid(bot.jid) || 'N/A'
        texto += `  ✦ *${bot.label || 'Sub-Bot'}* → @${num}\n`
      }
      texto += `\n💡 Responde a un mensaje de ese bot y ejecuta *.setprimary* de nuevo.\n\n`
      texto += `⚔️ _Yuta Okotsu MD | DuarteXV_`

      return await reply({ text: texto })
    }

    // ─── RESPONDIENDO → ESTABLECER COMO PRIMARIO ───────
    const whoNum = quotedSender

    const current = db.getPrimary(from)
    if (current === whoNum) {
      return await reply({
        text: `⚠️ *Ese bot ya es el primario de este grupo.*\n\n⚔️ _Yuta Okotsu MD | DuarteXV_`
      })
    }

    // Guardamos directamente en la base de datos del grupo
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
