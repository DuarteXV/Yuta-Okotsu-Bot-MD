import { db } from '../../database/db.js'
import config from '../../config.js'

export default {
  name: ['bots', 'listbots'],
  description: 'Muestra la lista de bots realmente conectados ahora mismo',
  category: 'sockets',
  ownerOnly: false,

  async run({ sock, react, reply, mainBotNum, activeBotsLive }) {
    await react('🤖')

    const obtenerNumeroLimpio = (jid) => {
      if (!jid) return null
      return jid.split('@')[0].split(':')[0].replace(/\D/g, '')
    }

    const esLabelAutomatico = (label) =>
      label?.startsWith('SUB_') || label === 'Subbot' || label === 'MAIN'

    // 1. Determinar el número del verdadero Bot Principal
    const todosLosBots = db.getAllBots ? db.getAllBots() : []
    let numeroMainReal = null

    if (mainBotNum) {
      numeroMainReal = mainBotNum
    } else if (global.mainBotNum) {
      numeroMainReal = global.mainBotNum
    } else {
      const registroMain = todosLosBots.find(b => b.isMain === true || b.isMain === 1)
      numeroMainReal = registroMain ? obtenerNumeroLimpio(registroMain.jid) : obtenerNumeroLimpio(sock.user?.id)
    }

    let listaFiltrada = []
    const numerosVistos = new Set()

    // 2. Insertar SIEMPRE al Bot Principal real en el puesto #1
    if (numeroMainReal) {
      const datosMain = db.getBot(`${numeroMainReal}@s.whatsapp.net`) || db.getBot('main')
      const nombreMain = esLabelAutomatico(datosMain?.label) ? config.botName : (datosMain?.label || config.botName)

      listaFiltrada.push({
        label: nombreMain,
        jid: numeroMainReal,
        isMain: true
      })

      numerosVistos.add(numeroMainReal)
    }

    // 3. Obtener la lista de subbots (Snapshot en vivo o Base de Datos como respaldo)
    const liveSnapshot = Array.isArray(activeBotsLive) ? activeBotsLive : []
    const liveOnline = liveSnapshot.filter(b => b.status === 'online')

    // 🛠️ ¡ESTE ES EL FIX!: Si el snapshot en vivo viene vacío (común en subbots), 
    // usamos db.getOnlineBots() para que aparezcan los 10 bots reales.
    const fuentesDeBots = liveOnline.length > 0 ? liveOnline : (db.getOnlineBots() || [])

    for (const subBot of fuentesDeBots) {
      const subNum = obtenerNumeroLimpio(subBot.jid)
      if (!subNum || subNum === numeroMainReal) continue
      if (numerosVistos.has(subNum)) continue
      numerosVistos.add(subNum)

      const datosDb = db.getBot(`${subNum}@s.whatsapp.net`)
      const labelCandidato = (datosDb?.label && !esLabelAutomatico(datosDb.label))
        ? datosDb.label
        : (subBot.label && !esLabelAutomatico(subBot.label) ? subBot.label : config.botName)

      listaFiltrada.push({
        label: labelCandidato,
        jid: subNum,
        isMain: false
      })
    }

    const nombreBotEncabezado = listaFiltrada[0]?.label || config.botName

    // 4. Construcción del mensaje final
    let text = `✨ ═══ 🫧 *${nombreBotEncabezado.toUpperCase()}* 🫧 ═══ ✨\n`
    text += `🤖 _Bots conectados al sistema_\n\n`

    let i = 1
    for (const bot of listaFiltrada) {
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
