import { db } from '../../database/db.js'
import config from '../../config.js'
import fs from 'fs'
import path from 'path'

export default {
  name: ['bots', 'listbots'],
  description: 'Muestra los bots con datos reales extraídos directamente de SQLite.',
  category: 'sockets',
  ownerOnly: false,

  async run({ sock, react, reply, mainBotNum, activeBotsLive }) {
    await react('🤖')

    const obtenerNumeroLimpio = (jid) => {
      if (!jid) return null
      return jid.split('@')[0].split(':')[0].replace(/\D/g, '')
    }

    const esLabelAutomatico = (label) =>
      label?.startsWith('SUB_') || label === 'Subbot' || label === 'MAIN' || !label

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

    // 1. OBTENER TODOS LOS BOTS DESDE SQLITE
    // Intentamos usar el método del wrapper o una consulta directa si expone el objeto driver
    let todosLosBots = []
    try {
      if (typeof db.getAllBots === 'function') {
        todosLosBots = db.getAllBots()
      } else if (db.client && typeof db.client.prepare === 'function') {
        // Fallback si usas un driver directo como better-sqlite3
        todosLosBots = db.client.prepare('SELECT * FROM bots').all()
      } else if (global.db?.data?.bots) {
        todosLosBots = Object.values(global.db.data.bots)
      }
    } catch (e) {
      console.error('Error al leer tabla SQLite:', e)
    }

    let numeroMainReal = null
    if (mainBotNum) {
      numeroMainReal = mainBotNum
    } else if (global.mainBotNum) {
      numeroMainReal = global.mainBotNum
    } else {
      const registroMain = todosLosBots.find(b => b.isMain === true || b.isMain === 1 || b.id === 'main')
      numeroMainReal = registroMain ? obtenerNumeroLimpio(registroMain.jid || registroMain.id) : obtenerNumeroLimpio(sock.user?.id)
    }

    let listaFiltrada = []
    const numerosVistos = new Set()

    // 2. Insertar Bot Principal usando datos de SQLite
    if (numeroMainReal) {
      const datosMain = todosLosBots.find(b => obtenerNumeroLimpio(b.jid || b.id) === numeroMainReal || b.id === 'main')
      const nombreMain = esLabelAutomatico(datosMain?.label || datosMain?.name) ? config.botName : (datosMain?.label || datosMain?.name)
      
      if (!global.botStartTime) global.botStartTime = Date.now()
      const uptimeMain = calcularTiempoActivo(global.botStartTime)

      listaFiltrada.push({
        label: nombreMain,
        jid: numeroMainReal,
        isMain: true,
        uptime: uptimeMain
      })
      numerosVistos.add(numeroMainReal)
    }

    // Mapeo del snapshot en vivo (Memoria RAM del Manager)
    const liveSnapshot = Array.isArray(activeBotsLive) ? activeBotsLive : []
    const liveMap = new Map()
    for (const b of liveSnapshot) {
      const num = obtenerNumeroLimpio(b.jid)
      if (num) liveMap.set(num, b)
    }

    // 3. ESCANEO DE CARPETAS DE SUBBOTS CRUZADO CON SQLITE
    const SUBBOTS_DIR = './sessions/subbots'
    if (fs.existsSync(SUBBOTS_DIR)) {
      const carpetasSesion = fs.readdirSync(SUBBOTS_DIR, { withFileTypes: true })
        .filter(dir => dir.isDirectory())
        .map(dir => dir.name)

      for (const idCarpeta of carpetasSesion) {
        const subNum = idCarpeta.replace('sub_', '')
        
        if (!subNum || subNum === numeroMainReal) continue
        if (numerosVistos.has(subNum)) continue

        // 🔍 Búsqueda exacta en el array extraído de la tabla de SQLite
        const datosDb = todosLosBots.find(b => {
          const idLimpio = obtenerNumeroLimpio(b.id || b.jid)
          return idLimpio === subNum || b.id === idCarpeta
        })

        // Obtener el nombre personalizado real guardado en la base de datos
        const labelCandidato = (datosDb?.label && !esLabelAutomatico(datosDb.label))
          ? datosDb.label
          : (datosDb?.name && !esLabelAutomatico(datosDb.name) ? datosDb.name : idCarpeta.toUpperCase())

        // Obtener la marca de tiempo de conexión real
        const botEnVivo = liveMap.get(subNum)
        // SQLite suele guardar los timestamps como números enteros o texto ISO. 
        // Validamos dinámicamente qué formato viene desde tu tabla (connected_at / connectedAt)
        let uptimeRaw = botEnVivo?.connectedAt || datosDb?.connectedAt || datosDb?.connected_at || null
        
        // Si SQLite no tenía el registro de tiempo por un reinicio, leemos el archivo físico interno
        if (!uptimeRaw) {
          try {
            const rutaCredsJson = path.join(SUBBOTS_DIR, idCarpeta, 'creds.json')
            if (fs.existsSync(rutaCredsJson)) {
              uptimeRaw = fs.statSync(rutaCredsJson).birthtimeMs
            }
          } catch (_) {}
        }

        numerosVistos.add(subNum)

        listaFiltrada.push({
          label: labelCandidato,
          jid: subNum,
          isMain: false,
          uptime: calcularTiempoActivo(uptimeRaw)
        })
      }
    }

    // 4. Construcción del Mensaje
    const nombreBotEncabezado = listaFiltrada[0]?.label || config.botName

    let text = `✨ ═══ 🫧 *${nombreBotEncabezado.toUpperCase()}* 🫧 ═══ ✨\n`
    text += `🤖 _Lista de conexiones y tiempo de actividad real_\n\n`

    let i = 1
    for (const bot of listaFiltrada) {
      const tipo = bot.isMain ? '👑 *PRINCIPAL*' : '🤖 Subbot'
      text += `🟢 *${i}. ${bot.label}*\n`
      text += `   ✦ Tipo: ${tipo}\n`
      text += `   ✦ Número: +${bot.jid}\n`
      text += `   ✦ Conectado hace: \`${bot.uptime}\`\n\n`
      i++
    }

    text += `🪼 _Powered by DuarteXV_`

    await reply({ text })
    await react('✅')
  }
}
