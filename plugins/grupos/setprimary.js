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

    // ─── RESPONDIENDO → DIAGNÓSTICO EN EL CHAT ───────
    const whoNum = quotedSender

    // Obtenemos cómo están guardados los bots en activeBots
    const botsActivosRaw = [...activeBots.entries()]
      .filter(([, bot]) => bot.status === 'online')
      .map(([, bot]) => bot.jid)

    const botsActivosNums = botsActivosRaw.map(jid => parseJid(jid)).filter(Boolean)

    // Si no lo encuentra, te escupe toda la información en el chat para ver el fallo
    if (!botsActivosNums.includes(whoNum)) {
      let debugTexto = `❌ *Ese usuario no es un bot activo.*\n\n`
      debugTexto += `🔍 *DIAGNÓSTICO DEL CHAT:*\n`
      debugTexto += `• ID del mensaje citado: \`${whoNum}\`\n`
      debugTexto += `• IDs en activeBots (procesados): \`${JSON.stringify(botsActivosNums)}\`\n`
      debugTexto += `• JIDs originales en memoria: \`${JSON.stringify(botsActivosRaw)}\`\n\n`
      debugTexto += `💡 Compara los números para ver cuál no cuadra.`

      return await reply({ text: debugTexto })
    }

    const current = db.getPrimary(from)
    if (current === whoNum) {
      return await reply({
        text: `⚠️ *Ese bot ya es el primario de este grupo.*\n\n⚔️ _Yuta Okotsu MD | DuarteXV_`
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
