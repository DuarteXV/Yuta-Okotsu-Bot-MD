import { db } from '../../database/db.js'
import config from '../../config.js'

export default {
  name: ['bots', 'listbots'],
  description: 'Muestra la lista de bots conectados filtrando duplicados de la base de datos',
  category: 'sockets',
  ownerOnly: false,

  async run({ sock, react, reply, mainBotNum }) {
    await react('🤖')

    const obtenerNumeroLimpio = (jid) => {
      if (!jid) return null
      return jid.split('@')[0].split(':')[0].replace(/\D/g, '')
    }

    const esLabelAutomatico = (label) =>
      label?.startsWith('SUB_') || label === 'Subbot' || label === 'MAIN'

    const subbotsActivos = db.getOnlineBots() || []
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

    // 2. Insertar SIEMPRE al Bot Principal real en el puesto #1 con su corona.
    // El "Tipo" siempre dirá PRINCIPAL, pero el nombre sigue la misma regla
    // que los subbots: si tiene label editado lo muestra, si no, usa config.botName.
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

    // 3. Deduplicar subbots por número real.
    // Un mismo número puede tener varios registros en la DB (basura de JIDs
    // sucios o reconexiones viejas). Si hay más de uno, se prioriza siempre
    // el que tenga un nombre personalizado (no automático) sobre el genérico.
    const subbotsPorNumero = new Map()

    for (const sub of subbotsActivos) {
      const subNum = obtenerNumeroLimpio(sub.jid)
      if (!subNum || subNum === numeroMainReal) continue

      const candidatoActual = subbotsPorNumero.get(subNum)

      if (!candidatoActual) {
        subbotsPorNumero.set(subNum, sub)
        continue
      }

      const candidatoEsAutomatico = esLabelAutomatico(candidatoActual.label)
      const nuevoEsAutomatico = esLabelAutomatico(sub.label)

      if (candidatoEsAutomatico && !nuevoEsAutomatico) {
        subbotsPorNumero.set(subNum, sub)
      }
    }

    for (const [subNum, sub] of subbotsPorNumero) {
      if (numerosVistos.has(subNum)) continue
      numerosVistos.add(subNum)

      const nombreSub = esLabelAutomatico(sub.label) ? config.botName : sub.label

      listaFiltrada.push({
        label: nombreSub,
        jid: subNum,
        isMain: false
      })
    }

    // El encabezado SIEMPRE refleja al bot Principal
    const nombreBotEncabezado = listaFiltrada[0]?.label || config.botName

    // 4. Construcción del mensaje estético final
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