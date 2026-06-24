import { db } from '../../database/db.js'
import config from '../../config.js'
import fs from 'fs'

export default {
  name: ['bots', 'listbots'],
  description: 'Muestra los bots conectados',
  category: 'sockets',

  async run({ sock, react, reply, m }) {
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

          return config.botName
        } catch {
          return config.botName
        }
      }

      const todosLosBots = db.getAllBots ? db.getAllBots() : []
      const registroMain = todosLosBots.find(b => (b.isMain === true || b.isMain === 1) && b.jid)

      const numeroPrincipal = registroMain
        ? limpiarNumero(registroMain.jid)
        : (global.mainBotNum || limpiarNumero(sock.user?.id))

      const nombrePrincipal = obtenerNombre(numeroPrincipal)

      const subbotsDir = './sessions/subbots'
      let subbots = []

      if (fs.existsSync(subbotsDir)) {
        subbots = fs
          .readdirSync(subbotsDir, { withFileTypes: true })
          .filter(dir => dir.isDirectory())
          .map(dir => dir.name)
          .filter(name => name.startsWith('sub_'))
          .map(name => name.replace('sub_', ''))
          .filter(numero => numero !== numeroPrincipal)
      }

      // Estructura principal del diseño solicitado
      let text = `•.°· ◇ \`ᒪIՏTᗩ ᗪᗴ ᗷOTՏ ᗩᑕTIᐯOՏ\` ◇ ·°.•\n`
      text += `〔💎〕Principal: ${nombrePrincipal}\n`
      text += `〔🌀〕Sub-bots: ${subbots.length}\n`
      text += `〔🌱〕En este grupo: \n\n`
      
      text += `@${m.sender.split('@')[0]}\n`

      // Datos del Bot Principal (Sin la línea Online)
      text += `> *𖠌 ʙᴏᴛ::* ${nombrePrincipal}\n`
      text += `> *⚝ ᴛɪᴘᴏ::* Principal 👑\n\n`

      // Datos de los Sub-bots si existen (Sin la línea Online)
      if (subbots.length > 0) {
        for (const numero of subbots) {
          const nombreSub = obtenerNombre(numero)
          text += `> *𖠌 ʙᴏᴛ::* ${nombreSub}\n`
          text += `> *⚝ ᴛɪᴘᴏ::* Sub-bot 🌀\n\n`
        }
      }

      text += `🪼 _Powered by DuarteXV_`

      await reply({ text, mentions: [m.sender] })
      await react('✅')

    } catch (e) {
      console.error(e)
      await react('❌')
      await reply({
        text: `❌ Error:\n${e.message}`
      })
    }
  }
}
