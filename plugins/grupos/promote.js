function cleanJid(jid = "") {
  if (!jid) return "";
  const atIndex = jid.lastIndexOf("@");
  if (atIndex === -1) return jid.split(":")[0];

  const userPart = jid.slice(0, atIndex).split(":")[0];
  const domainPart = jid.slice(atIndex + 1);

  return `${userPart}@${domainPart}`;
}

export default {
  name: ['promote', 'daradmin'],
  description: 'Promueve a un miembro a administrador',
  category: 'grupos',
  groupOnly: true,
  botAdmin: true,

  async run({ sock, from, msg, clearGroupCache, reply, senderNum }) {
    const groupMetaReal = await sock.groupMetadata(from)
    const participants = groupMetaReal.participants || []

    const senderRaw = msg.key.participant || msg.key.remoteJid
    const senderJid = cleanJid(senderRaw)
    const senderParticipant = participants.find(p => cleanJid(p.id) === senderJid)
    const isSenderAdmin = senderParticipant?.admin === 'admin' || senderParticipant?.admin === 'superadmin'

    if (!isSenderAdmin) return await reply({ text: "❌ Solo admins del grupo pueden usar este comando." })

    const botJid = cleanJid(sock.user?.id)
    const botParticipant = participants.find(p => cleanJid(p.id) === botJid)
    const isBotAdmin = botParticipant?.admin === 'admin' || botParticipant?.admin === 'superadmin'

    if (!isBotAdmin) return await reply({ text: `❌ El bot necesita ser admin del grupo para promover usuarios.` })

    const contextInfo = msg.message?.extendedTextMessage?.contextInfo || msg.message?.imageMessage?.contextInfo || msg.message?.videoMessage?.contextInfo
    const mentioned = contextInfo?.mentionedJid || []

    let target = null
    if (contextInfo?.participant) {
      target = contextInfo.participant
    } else if (mentioned.length > 0) {
      target = mentioned[0]
    }

    if (!target) return await reply({ text: `❌ Menciona o responde al usuario para darle admin.` })

    const targetJid = cleanJid(target)
    const targetParticipant = participants.find(p => cleanJid(p.id) === targetJid)

    if (targetParticipant?.admin === 'admin' || targetParticipant?.admin === 'superadmin') {
      return await reply({ text: `❌ Este usuario ya es administrador.` })
    }

    try {
      await sock.groupParticipantsUpdate(from, [targetJid], "promote")
      clearGroupCache()

      const targetNum = targetJid.split('@')[0]
      let textoPromote = `│✐꒷★ @${targetNum} h⍺ sıdo pꭇomovıdo ⍺ ⍺dmını𝗌tꭇ⍺doꭇ.\n`
      textoPromote += `> acción hecha por @${senderNum}`

      await sock.sendMessage(from, {
        text: textoPromote,
        contextInfo: { mentionedJid: [targetJid, senderJid] }
      }, { quoted: msg })

    } catch (e) {
      await reply({ text: `❌ No se pudo promover al usuario: ${e.message}` })
    }
  }
}