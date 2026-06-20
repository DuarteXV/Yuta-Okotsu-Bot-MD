import { db } from "../../database/db.js";

export default {
  name: ['listwarn', 'warns', 'advertidos'],
  description: 'Muestra la lista de miembros advertidos en el grupo',
  category: 'grupos',
  groupOnly: true,

  async run({ sock, from, msg, reply }) {
    try {
      const groupData = db.getGroup(from) || {}
      const groupWarns = groupData.warns || {}
      
      const filtrados = Object.entries(groupWarns).filter(([, lista]) => lista && lista.length > 0)

      if (filtrados.length === 0) {
        return await reply({ text: "🎉 ¡Excelente! No hay ningún usuario advertido en este grupo." })
      }

      let txt = `📋 *LISTA DE ADVERTIDOS EN ESTE GRUPO* 📋\n\n`
      const mentions = []

      filtrados.forEach(([jid, lista], index) => {
        mentions.push(jid)
        const targetNum = jid.split('@')[0]
        
        txt += `${index + 1}. 👤 *Usuario:* @${targetNum}\n`
        txt += `   📊 *Total Warns:* ${lista.length}/3\n`
        txt += `   📝 *Historial:* \n`
        lista.forEach((w) => {
          txt += `      • [${w.fecha}] ${w.razon} (por: ${w.by})\n`
        })
        txt += `\n─────────────────\n\n`
      })

      await sock.sendMessage(from, {
        text: txt.trim(),
        mentions: mentions
      }, { quoted: msg })

    } catch (err) {
      console.error("Error en comando listwarn:", err)
      await reply({ text: "❌ Ocurrió un error interno al ejecutar el comando." })
    }
  }
}
