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
      if (!jid) return null
      return jid.split('@')[0].split(':')[0]
    }

    // Obtener el número real de la sesión que está ejecutando el comando ahora mismo
    const miNumeroReal = obtenerNumeroLimpio(sock.user?.id)

    // Obtener os dados de todos os bots registrados no sistema
    const todosLosBots = db.getAllBots ? db.getAllBots() : []
    const subbotsActivos = db.getOnlineBots()

    // Intentar buscar el Bot Principal real en la base de datos
    const mainBotDb = todosLosBots.find(b => b.isMain === true || b.isMain === 1)

    let listaCompleta = []

    // 1. Añadir el Bot Principal (Main) siempre de primero con prioridad en su número real
    const mainNum = obtenerNumeroLimpio(mainBotDb?.jid) || miNumeroReal || 'N/A'
    const mainLabel = mainBotDb?.label || 'MAIN'

    listaCompleta.push({
      label: mainLabel,
      jid: mainNum,
      isMain: true
    })

    // 2. Agregar los Subbots activos filtrando estrictamente para que no se duplique el Main
    for (const sub of subbotsActivos) {
      const subNum = obtenerNumeroLimpio(sub.jid)

      if (!subNum) continue
      // Si coincide con el número del Main o con la sesión actual, no se agrega como subbot
      if (subNum === mainNum || subNum === miNumeroReal) continue

      // Limpiamos los nombres automáticos tipo SUB_ para que se vea más limpio
      const esLabelAutomatico = sub.label?.startsWith('SUB_')
      const nombreSub = esLabelAutomatico ? 'Subbot' : (sub.label || 'Subbot')

      listaCompleta.push({
        label: nombreSub,
        jid: subNum,
        isMain: false
      })
    }

    // Nombre para el encabezado del mensaje basado en el bot que responde
    const miJid = miNumeroReal ? miNumeroReal + '@s.whatsapp.net' : ''
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
