import { db } from '../../database/db.js'

export default {
  name: ['delprimary', 'quitarprincipal'],
  description: 'Quita el bot primario del grupo',
  category: 'grupos',
  groupOnly: true,
  adminOnly: true,

  async run({ from, msg, react, reply }) {
    // Obtenemos el nombre del usuario que ejecuta el comando (si no existe, ponemos 'Usuario')
    const name = msg.pushName || 'Usuario'

    // Obtenemos el número del bot actual que está leyendo este archivo
    const miJid = msg.key.fromMe ? msg.key.participant || msg.key.remoteJid : null
    const parseNum = (jid) => jid ? jid.split(':')[0].split('@')[0] : null
    const miNumero = parseNum(miJid)

    // Obtenemos quién es el bot primario actual en la base de datos
    const primary = db.getPrimary(from)

    // Si el grupo no tiene un bot primario configurado...
    if (!primary) {
      return await reply({
        text:
          `⚠️ *Hola ${name}, este grupo no tiene bot primario establecido.*\n\n` +
          `💡 Usa *.setprimary* para establecer uno.\n\n` +
          `⚔️ _Yuta Okotsu MD | DuarteXV_`
      })
    }

    // ─── FILTRO CRÍTICO ───────────────────────────────────
    if (miNumero && primary !== miNumero) {
      return
    }

    // El bot que sí es el primario ejecuta la eliminación
    await react('🗑️')
    db.delPrimary(from)

    await reply({
      text:
        `✅ *Bot primario eliminado por ${name}*\n\n` +
        `🤖 Todos los bots responderán en este grupo ahora.\n\n` +
        `⚔️ _Yuta Okotsu MD | DuarteXV_`
    })
  }
}
