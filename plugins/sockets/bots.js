import { db } from '../../database/db.js'

export default {
  name: ['bots', 'listbots'],
  description: 'Muestra la lista exacta de bots conectados separando el Main de los Subbots',
  category: 'sockets',
  ownerOnly: false,

  async run({ sock, react, reply }) {
    await react('🤖')

    // Función para limpiar los JIDs de WhatsApp y obtener solo el número limpio
    const obtenerNumeroLimpio = (jid) => {
      if (!jid) return 'N/A'
      return jid.split('@')[0].split(':')[0]
    }

    // Obtener los datos de todos los bots registrados en el sistema
    const todosLosBots = db.getAllBots ? db.getAllBots() : []
    const subbotsActivos = db.getOnlineBots()

    // Encontrar el Bot Principal real buscando en la base de datos el que tenga isMain de verdad
    const mainBotDb = todosLosBots.find(b => b.isMain === true || b.isMain === 1)

    let listaCompleta = []

    // 1. Si encontramos el Main real en la base de datos, lo ponemos de primero
    if (mainBotDb) {
      listaCompleta.push({
        label: mainBotDb.label || 'MAIN',
        jid: obtenerNumeroLimpio(mainBotDb.jid),
        isMain: true
      })
    } else {
      // Si no está marcado en la DB, asumimos el bot actual como Main temporal para no dejar la lista vacía
      const currentBotNum = obtenerNumeroLimpio(sock.user?.id)
      const currentBotJid = currentBotNum + '@s.whatsapp.net'
      const currentBotData = db.getBot(currentBotJid)
      
      listaCompleta.push({
        label: currentBotData?.label || 'MAIN',
        jid: currentBotNum,
        isMain: true
      })
    }

    // Obtener el número del Main que acabamos de guardar para no duplicarlo abajo
    const numeroDelMainReal = listaCompleta[0].jid

    // 2. Agregar los Subbots activos filtrando por completo el número del Principal real
    for (const sub of subbotsActivos) {
      const subNum = obtenerNumeroLimpio(sub.jid)

      // Si coincide con el número del Main real, se salta (así no se duplica como subbot)
      if (subNum === numeroDelMainReal) continue

      // Limpiamos los nombres automáticos tipo SUB_591... para que diga "Subbot"
      const esLabelAutomatico = sub.label?.startsWith('SUB_')
      const nombreSub = esLabelAutomatico ? 'Subbot' : (sub.label || 'Subbot')

      listaCompleta.push({
        label: nombreSub,
        jid: subNum,
        isMain: false
      })
    }

    // Nombre para el encabezado del mensaje (del bot actual que ejecuta el comando)
    const miJid = obtenerNumeroLimpio(sock.user?.id) + '@s.whatsapp.net'
    const misDatos = db.getBot(miJid)
    const nombreBotEncabezado = (misDatos?.label || "MULTIDEVICE BOT").toUpperCase()

    let text = `✨ ═══ 🫧 *${nombreBotEncabezado}* 🫧 ═══ ✨\n`
    text += `🤖 _Bots conectados al sistema_\n\n`

    let i = 1
    for (const bot of listaCompleta) {
      const tipo = bot.isMain ? '👑 *PRINCIPAL*' : '🤖 Subbot'
      
      text += `🟢 *${i}. ${bot.label}*\n`
      text += `   ✦ Tipo: ${tipo}\n`
      text += `   ✦ Número: ${bot.jid}\n\n`
      i++
    }

    text += `🪼 _Powered by DuarteXV_`

    await reply({ text })
    await react('✅')
  }
}
