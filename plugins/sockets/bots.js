import { db } from '../../database/db.js'
import config from '../../config.js'
import fs from 'fs'
import path from 'path'

export default {
  name: ['bots', 'listbots'],
  description: 'Muestra la lista de bots realmente conectados con tiempo de actividad blindado.',
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

    // Formateador dinámico de tiempo transcurrido
    const calcularTiempoActivo = (uptimeTimestamp) => {
      if (!uptimeTimestamp) return null
      const ahora = Date.now()
      const diferencia = ahora - new Date(uptimeTimestamp).getTime()
      if (diferencia < 0) return 'Recién conectado'

      const minutos = Math.floor((diferencia / (1000 * 60)) % 60)
      const horas = Math.floor((diferencia / (1000 * 60 * 60)) % 24)
      const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24))

      let tiempoStr = ''
      if (dias > 0) tiempoStr += `${dias}d `
      if (horas > 0 || dias > 0) tiempoStr += `${horas}h `
      tiempoStr += `${minutos}m`
      return tiempoStr || '1m'
    }

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

    // 1. Añadir Bot Principal
    if (numeroMainReal) {
      const datosMain = db.getBot(`${numeroMainReal}@s.whatsapp.net`) || db.getBot('main')
      const nombreMain = esLabelAutomatico(datosMain?.label) ? config.botName : (datosMain?.label || config.botName)
      
      const uptimeMain = global.botStartTime ? calcularTiempoActivo(global.botStartTime) : 'Activo'

      listaFiltrada.push({
        label: nombreMain,
        jid: numeroMainReal,
        isMain: true,
        uptime: uptimeMain
      })
      numerosVistos.add(numeroMainReal)
    }

    // 2. Resolver Subbots en línea desde Snapshot y DB
    const liveSnapshot = Array.isArray(activeBotsLive) ? activeBotsLive : []
    const liveOnline = liveSnapshot.filter(b => b.status === 'online')
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

      // 🛠️ ESTRATEGIA DE TIEMPO BLINDADA:
      // Buscamos en el subbot en vivo -> En la DB -> Y si todo falla, leemos la carpeta de sesión del sistema operativo.
      let uptimeRaw = subBot.connectedAt || subBot.uptime || datosDb?.connectedAt || null
      
      if (!uptimeRaw && subBot.id) {
        const folderPath = path.resolve(`./sessions/subbots/${subBot.id}`)
        if (fs.existsSync(folderPath)) {
          try {
            const stats = fs.statSync(folderPath)
            uptimeRaw = stats.mtimeMs // Fecha de última modificación/conexión del archivo de sesión
          } catch {
            uptimeRaw = null
          }
        }
      }

      const tiempoCalculado = calcularTiempoActivo(uptimeRaw) || 'Conectado'

      listaFiltrada.push({
        label: labelCandidato,
        jid: subNum,
        isMain: false,
        uptime: tiempoCalculado
      })
    }

    const nombreBotEncabezado = listaFiltrada[0]?.label || config.botName

    // 3. Renderizar Mensaje
    let text = `✨ ═══ 🫧 *${nombreBotEncabezado.toUpperCase()}* 🫧 ═══ ✨\n`
    text += `🤖 _Lista de conexiones y tiempo de actividad_\n\n`

    let i = 1
    for (const bot of listaFiltrada) {
      const tipo = bot.isMain ? '👑 *PRINCIPAL*' : '🤖 Subbot'
      text += `🟢 *${i}. ${bot.label}*\n`
      text += `   ✦ Tipo: ${tipo}\n`
      text += `   ✦ Número: +${bot.jid}\n`
      text += `   ✦ Activo hace: \`${bot.uptime}\`\n\n`
      i++
    }

    text += `🪼 _Powered by DuarteXV_`

    await reply({ text })
    await react('✅')
  }
}
