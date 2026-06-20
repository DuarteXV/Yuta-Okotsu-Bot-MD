import { db } from "../../database/db.js";

export default {
  name: ['warn', 'advertir'],
  description: 'Advierte a un miembro del grupo',
  category: 'grupos',
  groupOnly: true,

  async run({ sock, from, msg, args, reply }) {
    try {
      const groupMetaReal = await sock.groupMetadata(from)
      const participants = groupMetaReal.participants || []
      const cleanJid = (id) => id ? id.split('@')[0].split(':')[0] + '@s.whatsapp.net' : ''

      const senderJid = cleanJid(msg.key.participant || msg.participant || from)
      const senderParticipant = participants.find(p => cleanJid(p.id) === senderJid)
      const isSenderAdmin = senderParticipant?.admin === 'admin' || senderParticipant?.admin === 'superadmin'

      if (!isSenderAdmin) return await reply({ text: "❌ Solo admins del grupo pueden usar este comando." })

      const contextInfo = msg.message?.extendedTextMessage?.contextInfo || msg.message?.imageMessage?.contextInfo || msg.message?.videoMessage?.contextInfo
      const mentioned = contextInfo?.mentionedJid || []
      let target = contextInfo?.participant || mentioned[0]

      if (!target) return await reply({ text: `⚠️ Menciona o responde al usuario que deseas advertir.` })
      const targetJid = cleanJid(target)

      const targetParticipant = participants.find(p => cleanJid(p.id) === targetJid)
      if (targetParticipant?.admin === 'admin' || targetParticipant?.admin === 'superadmin') {
        return await reply({ text: `❌ No puedes advertir a otro administrador.` })
      }

      // Intentar obtener el pushname de la persona advertida
      // Buscamos en el mensaje citado si existe, o en el store del bot si está disponible
      let targetName = contextInfo?.quotedMessage ? contextInfo?.pushName : null
      if (!targetName) {
        targetName = sock.store?.contacts?.[targetJid]?.name || sock.store?.contacts?.[targetJid]?.verifiedName || `@${targetJid.split('@')[0]}`
      }

      const groupData = db.getGroup(from) || {}
      const currentWarns = groupData.warns || {}
      if (!currentWarns[targetJid]) currentWarns[targetJid] = []

      const adminName = msg.pushName || "Admin"
      const razon = args.join(" ") || "No se especificó una razón."
      
      currentWarns[targetJid].push({
        razon,
        fecha: new Date().toLocaleDateString("es-CO"),
        by: adminName,
        userSavedName: targetName.startsWith('@') ? targetName : targetName
      })

      db.setGroup(from, { ...groupData, warns: currentWarns })

      const totalWarns = currentWarns[targetJid].length

      let texto = `⚠️ *¡USUARIO ADVERTIDO!* ⚠️\n\n`
      texto += `👤 *Usuario:* ${targetName.startsWith('@') ? targetName : `${targetName} (@${targetJid.split('@')[0]})`}\n`
      texto += `👮‍♂️ *Por:* ${adminName}\n`
      texto += `📝 *Razón:* ${razon}\n`
      texto += `📊 *Advertencias:* ${totalWarns}/3\n\n`
      
      if (totalWarns >= 3) {
        texto += `❗ *Nota:* Este usuario ha alcanzado el límite de 3 advertencias.`
      }

      await reply({ text: texto, mentions: [targetJid] })
    } catch (err) {
      console.error("Error en comando warn:", err)
      await reply({ text: "❌ Ocurrió un error interno al ejecutar el comando." })
    }
  }
}
