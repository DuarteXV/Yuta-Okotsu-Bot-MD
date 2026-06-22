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

    // 📸 Fuente de verdad EN VIVO: lo que reporta activeBots del manager,
    // no la DB. Solo se consideran "online" los que están en este snapshot.
    const liveSnapshot = Array.isArray(activeBotsLive) ? activeBotsLive : []
    const liveOnline = liveSnapshot.filter(b => b.status === 'online')

    const todosLosBots = db.getAllBots ? db.getAllBots() : []

    // 1. Determinar el número del verdadero Bot Principal
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
      const nombreMain = esLabelAutomatico(datosMain?.label) ? config.botName : datosMain.label

      listaFiltrada.push({
        label: nombreMain,
        jid: numeroMainReal,
        isMain: true
      })

      numerosVistos.add(numeroMainReal)
    }

    // 3. Recorrer SOLO los subbots que el snapshot en vivo confirma como online.
    // El nombre se busca en la DB (para reflejar ediciones con .setname),
    // pero la decisión de "¿está online?" depende exclusivamente del snapshot.
    for (const liveBot of liveOnline) {
      const subNum = obtenerNumeroLimpio(liveBot.jid)
      if (!subNum || subNum === numeroMainReal) continue
      if (numerosVistos.has(subNum)) continue
      numerosVistos.add(subNum)

      const datosDb = db.getBot(`${subNum}@s.whatsapp.net`)
      const labelCandidato = (datosDb?.label && !esLabelAutomatico(datosDb.label))
        ? datosDb.label
        : (liveBot.label && !esLabelAutomatico(liveBot.label) ? liveBot.label : config.botName)

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