import { db } from '../../database/db.js'

export default {
  name: ['delprimary', 'quitarprincipal'],
  description: 'Quita el bot primario del grupo',
  category: 'grupos',
  groupOnly: true,
  adminOnly: true,

  async run({ from, msg, react, reply }) {
    // 1. Detectar de forma dinámica el número del bot que está ejecutando el código actualmente
    // Baileys guarda en msg.key.remoteJid la ID del chat, y si el mensaje proviene del bot, de ahí sacamos su JID
    const miJid = msg.key.fromMe ? msg.key.participant || msg.key.remoteJid : null
    const parseNum = (jid) => jid ? jid.split(':')[0].split('@')[0] : null
    const miNumero = parseNum(miJid)

    // 2. Obtener el bot primario actual guardado en la base de datos para este grupo
    const primary = db.getPrimary(from)

    // ─── CASO 1: NO HAY BOT PRIMARIO ASIGNADO ───────────
    if (!primary) {
      // Si no hay primario, todos los bots verán 'null' al mismo tiempo.
      // Para que no respondan todos en bloque, hacemos que solo responda el bot si el evento 
      // cumple con una condición de control o simplemente dejamos una respuesta general.
      // Un truco limpio es que solo responda el bot si coincide con un rol base en tu subbotManager,
      // o dejarlo libre si los bots ya controlan el delay de respuesta por su cuenta.
      return await reply({
        text:
          `⚠️ *Este grupo no tiene bot primario establecido.*\n\n` +
          `💡 Usa *.setprimary* para establecer uno.\n\n` +
          `⚔️ _Yuta Okotsu MD | DuarteXV_`
      })
    }

    // ─── CASO 2: SÍ HAY BOT PRIMARIO CONFIGURADO ─────────
    // Filtro maestro: Si el número de este bot NO coincide con el primario de la DB,
    // frena la ejecución de inmediato. Los demás bots ignoran el comando en silencio.
    if (miNumero && primary !== miNumero) {
      return
    }

    // El bot que coincide procede a borrar el registro y avisa al grupo
    await react('🗑️')
    db.delPrimary(from)

    await reply({
      text:
        `✅ *Bot primario eliminado*\n\n` +
        `🤖 El bot *${primary}* ya no es el principal.\n` +
        `Todos los bots y sub-bots responderán en este grupo ahora.\n\n` +
        `⚔️ _Yuta Okotsu MD | DuarteXV_`
    })
  }
}
