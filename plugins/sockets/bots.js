import { db } from '../../database/db.js'
import config from '../../config.js'
import fs from 'fs'

export default {
  name: ['bots', 'listbots'],
  description: 'Muestra los bots conectados en el grupo actual',
  category: 'sockets',
  groupOnly: true, // Asegura que solo se use en grupos

  async run({ sock, from, msg, react, reply }) {
    try {
      await react('🤖')

      const limpiarNumero = (jid = '') =>
        jid.split('@')[0].split(':')[0].replace(/\D/g, '')

      const obtenerNombre = (numero) => {
        try {
          const bot = db.getBot(`${numero}@s.whatsapp.net`)

          if (
            bot?.label &&
            bot.label !== 'Subbot' &&
            bot.label !== 'MAIN' &&
            !bot.label.startsWith('SUB_')
          ) {
            return bot.label
          }

          return bot?.pushName || bot?.name || config.botName
        } catch {
          return config.botName
        }
      }

      // 1. Obtener todos los participantes reales del grupo actual
      const metadata = await sock.groupMetadata(from)
      const participantesGrupo = metadata.participants.map(p => limpiarNumero(p.id))

      // 2. Obtener datos del bot Principal
      const todosLosBots = db.getAllBots ? db.getAllBots() : []
      const registroMain = todosLosBots.find(b => (b.isMain === true || b.isMain === 1) && b.jid)

      const numeroPrincipal = registroMain
        ? limpiarNumero(registroMain.jid)
        : (global.mainBotNum || limpiarNumero(sock?.user?.id))

      const nombrePrincipal = obtenerNombre(numeroPrincipal)

      // 3. Leer sub-bots de la carpeta y FILTRAR solo los que están en el grupo
      const subbotsDir = './sessions/subbots'
      let subbotsEnGrupo = []

      if (fs.existsSync(subbotsDir)) {
        subbotsEnGrupo = fs
          .readdirSync(subbotsDir, { withFileTypes: true })
          .filter(dir => dir.isDirectory())
          .map(dir => dir.name)
          .filter(name => name.startsWith('sub_'))
          .map(name => name.replace('sub_', ''))
          .filter(numero => numero !== numeroPrincipal)
          // El filtro clave: ¿El número del subbot está en la lista de participantes del grupo?
          .filter(numero => participantesGrupo.includes(numero))
      }

      const participantsMentions = []

      // Estructura del mensaje principal
      let report = `•.°· ◇ \`ᒪIՏTᗩ ᗪᗴ ᗷOTՏ ᗩᑕTIᐯOՏ\` ◇ ·°.•\n`
      report += `〔💎〕Principal: ${nombrePrincipal}\n`
      report += `〔🌀〕Sub-bots: ${subbotsEnGrupo.length}\n`
      report += `〔🌱〕En este grupo: \n\n`

      // Validar si el Principal está en el grupo (por si acaso)
      if (participantesGrupo.includes(numeroPrincipal)) {
        const jidPrincipal = `${numeroPrincipal}@s.whatsapp.net`
        participantsMentions.push(jidPrincipal)
        
        report += `> *𖠌 ʙᴏᴛ::* @${numeroPrincipal} (${nombrePrincipal})\n`
        report += `> *⚝ ᴛɪᴘᴏ::* Principal 👑\n\n`
      }

      // Agregar los Sub-bots filtrados a la lista
      if (subbotsEnGrupo.length > 0) {
        for (const numero of subbotsEnGrupo) {
          const nombreSub = obtenerNombre(numero)
          const jidSub = `${numero}@s.whatsapp.net`
          
          participantsMentions.push(jidSub)
          
          report += `> *𖠌 ʙᴏᴛ::* @${numero} (${nombreSub})\n`
          report += `> *⚝ ᴛɪᴘᴏ::* Sub-bot 🌀\n\n`
        }
      } else if (!participantesGrupo.includes(numeroPrincipal)) {
        report += `⚠️ No se detectaron bots de este sistema en el grupo.\n\n`
      }

      report += `🪼 _Powered by DuarteXV_`

      // Envío con menciones activas
      await sock.sendMessage(
        from,
        {
          text: report,
          mentions: participantsMentions.filter(Boolean),
        },
        { quoted: msg }
      )

      await react('✅')

    } catch (e) {
      console.error(e)
      await react('❌')
      if (reply) {
        await reply({ text: `Failed` })
      }
    }
  }
}
