export default {
  name: ['kick', 'expulsar'],
  description: 'Expulsa a un miembro del grupo',
  category: 'grupos',
  groupOnly: true,
  adminOnly: true,

  async run({ sock, from, msg, reply }) {
    // 1. Obtener metadatos frescos del grupo
    const groupMeta = await sock.groupMetadata(from)
    const participants = groupMeta.participants

    // 2. Capturar el objetivo (target) de forma segura
    const contextInfo = msg.message?.extendedTextMessage?.contextInfo || msg.message?.imageMessage?.contextInfo || msg.message?.videoMessage?.contextInfo
    const mentioned = contextInfo?.mentionedJid || []
    
    let target = null
    if (contextInfo?.participant) {
      target = contextInfo.participant 
    } else if (mentioned.length > 0) {
      target = mentioned[0] 
    }

    if (!target) return await reply({ text: `❌ Menciona o responde al usuario a expulsar.` })

    // 3. Limpiar JIDs al formato exacto del array (ej: 591xxxxxx@s.whatsapp.net)
    const botJid = sock.user?.id?.split(':')[0] + '@s.whatsapp.net'
    const targetJid = target.split(':')[0] + '@s.whatsapp.net'

    // Evitar que el bot se auto-expulse
    if (targetJid === botJid) return await reply({ text: `❌ No me puedes expulsar a mí.` })

    // 4. Verificar si el bot es administrador
    const botParticipant = participants.find(p => p.id === botJid)
    const isBotAdmin = botParticipant?.admin === 'admin' || botParticipant?.admin === 'superadmin'
    if (!isBotAdmin) return await reply({ text: `❌ El bot necesita ser admin del grupo.` })

    // 5. Buscar al usuario objetivo en la lista usando el JID idéntico al del eval
    const targetParticipant = participants.find(p => p.id === targetJid)
    
    if (targetParticipant?.admin === 'superadmin') return await reply({ text: `❌ No puedo expulsar al creador del grupo.` })
    if (targetParticipant?.admin === 'admin') return await reply({ text: `❌ No puedo expulsar a un administrador.` })

    // 6. Si pasó todas las reglas y no es admin, se procede a remover
    try {
      await sock.groupParticipantsUpdate(from, [targetJid], "remove")
    } catch (e) {
      await reply({ text: `❌ No se pudo expulsar: ${e.message}` })
    }
  }
}
