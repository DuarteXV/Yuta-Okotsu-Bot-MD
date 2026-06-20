export default {
  name: ['abrir', 'open'],
  description: 'Abre el chat del grupo para todos los miembros',
  category: 'grupos',
  groupOnly: true,

  async run({ sock, from, msg, reply }) {
    const groupMetaReal = await sock.groupMetadata(from)
    const participants = groupMetaReal.participants || []

    // Limpieza de JIDs exacta
    const cleanJid = (id) => id ? id.split('@')[0].split(':')[0] + '@s.whatsapp.net' : ''
    
    const senderJid = cleanJid(msg.key.participant || msg.participant || from)
    const botJid = cleanJid(sock.user?.id)

    // Validar rango del usuario que ejecuta
    const senderParticipant = participants.find(p => cleanJid(p.id) === senderJid)
    const isSenderAdmin = senderParticipant?.admin === 'admin' || senderParticipant?.admin === 'superadmin'

    if (!isSenderAdmin) return await reply({ text: "❌ Solo admins del grupo pueden usar este comando." })

    // Validar rango del bot
    const botParticipant = participants.find(p => cleanJid(p.id) === botJid)
    const isBotAdmin = botParticipant?.admin === 'admin' || botParticipant?.admin === 'superadmin'

    if (!isBotAdmin) return await reply({ text: "❌ El bot necesita ser admin para abrir el grupo." })

    try {
      await sock.groupSettingUpdate(from, 'not_announcement')
      await reply({ text: "🔓 ¡El grupo ha sido abierto! Ahora todos los miembros pueden enviar mensajes." })
    } catch (e) {
      await reply({ text: `❌ Hubo un error al abrir el grupo: ${e.message}` })
    }
  }
}
