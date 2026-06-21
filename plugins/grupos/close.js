export default {
  name: ['cerrar', 'close'],
  description: 'Cierra el chat del grupo solo para administradores',
  category: 'grupos',
  groupOnly: true,

  async run({ sock, from, msg, reply }) {
    const groupMetaReal = await sock.groupMetadata(from)
    const participants = groupMetaReal.participants || []

    const cleanJid = (id) => id ? id.split('@')[0].split(':')[0] + '@s.whatsapp.net' : ''

    const senderJid = cleanJid(msg.key.participant || msg.participant || from)
    const botJid = cleanJid(sock.user?.id)

    const senderParticipant = participants.find(p => cleanJid(p.id) === senderJid)
    const isSenderAdmin = senderParticipant?.admin === 'admin' || senderParticipant?.admin === 'superadmin'

    if (!isSenderAdmin) return await reply({ text: "❌ Solo admins del grupo pueden usar este comando." })

    const botParticipant = participants.find(p => cleanJid(p.id) === botJid)
    const isBotAdmin = botParticipant?.admin === 'admin' || botParticipant?.admin === 'superadmin'

    if (!isBotAdmin) return await reply({ text: "❌ El bot necesita ser admin para cerrar el grupo." })

    try {
      await sock.groupSettingUpdate(from, 'announcement')
      await reply({ text: "꒰ 𑁍 ꒱ E𝗅 gꭇᥙ⍴o ⍺ 𝗌іძo ᥴᧉꭇꭇ⍺ძo ᥴoꭇꭇᧉƚ⍺mᧉnƚᧉ.\n> ¡Ahora solo los administradores pueden enviar mensajes!." })
    } catch (e) {
      await reply({ text: `❌ Hubo un error al cerrar el grupo: ${e.message}` })
    }
  }
}