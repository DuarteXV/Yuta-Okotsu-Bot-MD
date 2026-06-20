import { db } from '../../database/db.js'
import { activeBots } from '../../core/subbotManager.js'

export default {
  name: ['setprimary', 'botprincipal'],
  description: 'Establece un bot como primario del grupo',
  category: 'grupos',
  groupOnly: true,
  adminOnly: true,

  async run({ from, msg, react, reply, conn }) {
    // Conseguir el número del bot actual que está ejecutando este código
    const miJid = conn.user?.id ? conn.user.id.split(':')[0].split('@')[0] : null
    
    const parseJid = (jid) => jid ? jid.split(':')[0].split('@')[0] : null

    const quoted = msg.message?.extendedTextMessage?.contextInfo || msg.message?.imageMessage?.contextInfo || msg.message?.videoMessage?.contextInfo
    const quotedSender = quoted?.participant ? parseJid(quoted.participant) : null

    // ─── SIN RESPONDER → MOSTRAR BOTS DISPONIBLES ───────
    if (!quotedSender) {
      // Solo el bot principal o el bot que use el comando primero debería listar
      const botsActivos = [...activeBots.entries()]
        .filter(([, bot]) => bot.status === 'online')

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

    // IGNORAR SI ESTE BOT NO ES EL CITADO NI EL PRINCIPAL
    // Esto evita que los dos bots respondan al mismo tiempo en el chat
    if (miJid !== whoNum && miJid === '573175149414') {
      // Si soy el bot viejo y no me estás citando a mí, me callo para no spamear el error
      return; 
    }

    const current = db.getPrimary(from)
    if (current === whoNum) {
      if (miJid === whoNum) { // Solo responde el bot afectado
        return await reply({
          text: `⚠️ *Ese bot ya es el primario de este grupo.*\n\n⚔️ _Yuta Okotsu MD | DuarteXV_`
        })
      }
      return;
    }

    // Guardamos en la base de datos
    db.setPrimary(from, whoNum)

    // Solo el bot que fue elegido como primario responde confirmando la acción
    if (miJid === whoNum) {
      await react('✅')
      await reply({
        text:
          `✅ *Bot primario establecido*\n\n` +
          `🤖 *${whoNum}* es ahora el bot principal.\n` +
          `Los demás bots no responderán en este grupo.\n\n` +
          `⚔️ _Yuta Okotsu MD | DuarteXV_`
      })
    }
  }
}
