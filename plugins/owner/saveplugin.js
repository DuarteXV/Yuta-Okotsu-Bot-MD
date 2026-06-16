import { db } from '../../database/db.js'
import fs from 'fs'
import path from 'path'

export default {
  name: 'saveplugin', // Nombre plano para evitar fallos en el handler
  description: 'Guarda un archivo de plugin de forma dinámica respondiendo a su código.',
  category: 'owner',

  async run({ sock, from, msg, senderNum, args, usedPrefix, react, reply }) {
    try {
      const botJid = sock.user.id.split(':')[0] + '@s.whatsapp.net'

      // Verificar permisos usando tu db.js
      const isOwner = db.hasRole(senderNum, 'owner') || db.hasRole(senderNum, 'coowner')
      const isSelf = senderNum === botJid

      if (!isOwner && !isSelf) {
        await react('❌')
        return await reply({ text: '❌ Este comando solo puede ser usado por el Owner o Co-Owner.' })
      }

      // Verificar si responde a un mensaje
      const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
      if (!quotedMsg) {
        await react('❌')
        return await reply({ text: `⚠️ Debes *responder al mensaje que contiene el código* del plugin.` })
      }

      // Extraer texto
      const codigo = quotedMsg.conversation || quotedMsg.extendedTextMessage?.text
      if (!codigo) {
        await react('❌')
        return await reply({ text: `❌ El mensaje respondido no contiene texto válido.` })
      }

      // Validar argumentos
      if (!args[0]) {
        await react('💡')
        return await reply({ 
          text: `💡 *Uso correcto:* 💡\n` +
                `Responde al código y usa: *${usedPrefix}saveplugin [carpeta]/[nombre].js*\n\n` +
                `*Ejemplos:*\n` +
                `• ${usedPrefix}saveplugin owner/prueba.js\n` +
                `• ${usedPrefix}saveplugin herramientas/calculadora.js\n` +
                `• ${usedPrefix}saveplugin miplugin.js`
        })
      }

      await react('🕒')

      const baseDir = process.cwd()
      let inputPath = args[0].replace(/\.\.\//g, '')
      if (!inputPath.endsWith('.js')) inputPath += '.js'

      const targetPath = path.join(baseDir, 'plugins', inputPath)
      const targetDir = path.dirname(targetPath)

      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true })
      }

      fs.writeFileSync(targetPath, codigo, 'utf8')
      await react('✅')
      
      return await reply({
        text: `✅ *¡Plugin guardado con éxito!*\n\n` +
              `📂 *Carpeta:* \`plugins/${path.relative(path.join(baseDir, 'plugins'), targetDir) || 'Raíz'}\`\n` +
              `📄 *Archivo:* \`${path.basename(targetPath)}\``
      })

    } catch (error) {
      await react('❌')
      await reply({ text: `❌ Error en saveplugin: ${error.message}` })
      console.error(error)
    }
  }
}
