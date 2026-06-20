import { db } from "../database/db.js";

export default {
  name: ['warn', 'advertir'],
  description: 'Advierte a un miembro del grupo',
  category: 'grupos',
  groupOnly: true,

  async run({ sock, from, msg, args, reply }) {
    const groupMetaReal = await sock.groupMetadata(from)
    const participants = groupMetaReal.participants || []
    const cleanJid = (id) => id ? id.split('@')[0].split(':')[0] + '@s.whatsapp.net' : ''

    // 1. Verificar si el ejecutor es admin
    const senderJid = cleanJid(msg.key.participant || msg.participant || from)
    const senderParticipant = participants.find(p => cleanJid(p.id) === senderJid)
    const isSenderAdmin = senderParticipant?.admin === 'admin' || senderParticipant?.admin === 'superadmin'

    if (!isSenderAdmin) return await reply({ text: "❌ Solo admins del grupo pueden usar este comando." })

    // 2. Identificar al objetivo
    const contextInfo = msg.message?.extendedTextMessage?.contextInfo || msg.message?.imageMessage?.contextInfo || msg.message?.videoMessage?.contextInfo
    const mentioned = contextInfo?.mentionedJid || []
    let target = contextInfo?.participant || mentioned[0]

    if (!target) return await reply({ text: `⚠️ Menciona o responde al usuario que deseas advertir.` })
    const targetJid = cleanJid(target)

    // Impedir advertir a un admin
    const targetParticipant = participants.find(p => cleanJid(p.id) === targetJid)
    if (targetParticipant?.admin === 'admin' || targetParticipant?.admin === 'superadmin') {
      return await reply({ text: `❌ No puedes advertir a otro administrador.` })
    }

    // 3. Obtener y actualizar datos del grupo en la base de datos
    const groupData = db.getGroup(from)
    if (!groupData.warns) groupData.warns = {}
    if (!groupData.warns[targetJid]) groupData.warns[targetJid] = []

    const razon = args.join(" ") || "No se especificó una razón."
    groupData.warns[targetJid].push({
      razon,
      fecha: new Date().toLocaleDateString("es-CO"),
      by: senderJid.split('@')[0]
    })

    db.setGroup(from, { warns: groupData.warns })

    const totalWarns = groupData.warns[targetJid].length

    let texto = `⚠️ *¡USUARIO ADVERTIDO!* ⚠️\n\n`
    texto += `👤 *Usuario:* @${targetJid.split('@')[0]}\n`
    texto += `📝 *Razón:* ${razon}\n`
    texto += `📊 *Advertencias:* ${totalWarns}/3\n\n`
    
    if (totalWarns >= 3) {
      texto += `❗ *Nota:* Este usuario ha alcanzado el límite de 3 advertencias.`
    }

    await reply({ text: texto, mentions: [targetJid] })
  }
}
