import { db } from '../../database/db.js'
import config from '../../config.js'
import fs from 'fs'
import path from 'path'

export default {
  name: ['bots', 'listbots'],
  description: 'Muestra absolutamente todos los bots conectados escaneando el almacenamiento real.',
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

    const calcularTiempoActivo = (uptimeTimestamp) => {
      if (!uptimeTimestamp) return 'Conectado'
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

    // 1. Añadir forzosamente al Bot Principal en la posición #1
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

    // 2. ESCANEO INTEGRAL DE DISCO (Mapea carpetas reales de subbots activos)
    const SUBBOTS_DIR = './sessions/subbots'
    if (fs.existsSync(SUBBOTS_DIR)) {
      const carpetasSesion = fs.readdirSync(SUBBOTS_DIR, { withFileTypes: true })
        .filter(dir => dir.isDirectory())
        .map(dir => dir.name)

      for (const idCarpeta of carpetasSesion) {
        // Buscamos los datos del bot en base a su ID de carpeta o su JID en la DB
        let datosDb = db.getBot(idCarpeta)
        
        // Si no se encuentra por ID, escaneamos la DB buscando coincidencias
        if (!datosDb) {
          datosDb = todosLosBots.find(b => b.jid && (b.jid.includes(idCarpeta.replace('sub_', '')) || obtenerNumeroLimpio(b.jid) === idCarpeta.replace('sub_', '')))
        }

        const subNum = datosDb?.jid ? obtenerNumeroLimpio(datosDb.jid) : idCarpeta.replace('sub_', '')
        
        if (!subNum || subNum === numeroMainReal) continue
        if (numerosVistos.has(subNum)) continue

        // Validar si el bot de verdad está activo en la DB o si la carpeta tiene modificaciones recientes
        const estaOnlineEnDb = datosDb?.status === 'online'
        const folderPath = path.join(SUBBOTS_DIR, idCarpeta)
        let uptimeRaw = datosDb?.connectedAt || null
        let mtimeMs = 0

        try {
          const stats = fs.statSync(folderPath)
          mtimeMs = stats.mtimeMs
          if (!uptimeRaw) uptimeRaw = mtimeMs
        } catch (_) {}

        // FILTRO DE SEGURIDAD: Solo agregar si la DB dice que está online, u operó hace menos de 10 minutos en disco
        const activoPorDisco = (Date.now() - mtimeMs) < 10 * 60 * 1000
        if (!estaOnlineEnDb && !activoPorDisco) continue

        numerosVistos.add(subNum)

        const labelCandidato = (datosDb?.label && !esLabelAutomatico(datosDb.label))
          ? datosDb.label
          : idCarpeta.toUpperCase()

        listaFiltrada.push({
          label: labelCandidato,
          jid: subNum,
          isMain: false,
          uptime: calcularTiempoActivo(uptimeRaw)
        })
      }
    }

    // 3. Renderizado y armado del mensaje final
    const nombreBotEncabezado = listaFiltrada[0]?.label || config.botName

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
