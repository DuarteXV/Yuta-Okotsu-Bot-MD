export default {
  name: ['demote', 'quitaradmin'],
  description: 'Quita el administrador a un miembro del grupo',
  category: 'grupos',
  groupOnly: true,
  adminOnly: true,

  async run({ sock, from, msg, groupMeta, clearGroupCache, reply }) {
    const contextInfo = msg.message?.extendedTextMessage?.contextInfo || msg.message?.imageMessage?.contextInfo || msg.message?.videoMessage?.contextInfo
    const mentioned = contextInfo?.mentionedJid || []
    
    let target = null
    if (contextInfo?.participant) {
      target = contextInfo.participant 
    } else if (mentioned.length > 0) {
      target = mentioned[0] 
    }

    if (!target) return await reply({ text: `❌ Menciona o responde al usuario para remover su admin.` })

    const targetJid = target.split(':')[0] + '@s.whatsapp.net'

    const participants = groupMeta?.participants || []
    const targetParticipant = participants.find(p => p.id === targetJid)
    
    if (!targetParticipant?.admin || targetParticipant?.admin === 'none') {
      return await reply({ text: `❌ Este usuario no es administrador.` })
    }
    
    if (targetParticipant?.admin === 'superadmin') {
      return await reply({ text: `❌ No le puedes quitar el admin al creador del grupo.` })
    }

    try {
      await sock.groupParticipantsUpdate(from, [targetJid], "demote")
      clearGroupCache()
      await reply({ text: `✅ ¡Administrador removido con éxito!` })
    } catch (e) {
      await reply({ text: `❌ No se pudo remover el admin: ${e.message}` })
    }
  }
}
