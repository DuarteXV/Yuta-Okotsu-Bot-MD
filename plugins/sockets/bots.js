import { db } from '../../database/db.js'

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

    // 2. Insertar SIEMPRE al Bot Principal real en el puesto #1 con su corona
    if (numeroMainReal) {
      const datosMain = db.getBot(`${numeroMainReal}@s.whatsapp.net`) || db.getBot('main')
      let labelMain = datosMain?.label || 'MAIN'

      if (labelMain.startsWith('SUB_') || labelMain === 'Subbot') {
        labelMain = 'MAIN'
      }

      listaFiltrada.push({
        label: labelMain.toUpperCase(),
        jid: numeroMainReal,
        isMain: true
      })

      numerosVistos.add(numeroMainReal)
    }

    // 3. Agregar el resto de subbots en línea, eliminando duplicados mediante el Set
    for (const sub of subbotsActivos) {
      const subNum = obtenerNumeroLimpio(sub.jid)
      if (!subNum) continue

      if (numerosVistos.has(subNum) || subNum === numeroMainReal) continue
      numerosVistos.add(subNum)

      const esLabelAutomatico = sub.label?.startsWith('SUB_') || sub.label === 'Subbot' || sub.label === 'MAIN'
      const nombreSub = esLabelAutomatico ? 'Subbot' : sub.label

      listaFiltrada.push({
        label: nombreSub,
        jid: subNum,
        isMain: false
      })
    }

    // El encabezado SIEMPRE refleja al bot Principal, sin importar qué bot
    // (main o subbot) sea el que está respondiendo este comando
    const nombreBotEncabezado = listaFiltrada[0]?.label || "MAIN"

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