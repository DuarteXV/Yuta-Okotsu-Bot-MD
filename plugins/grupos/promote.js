export default {
  name: ['promote', 'daradmin'],
  description: 'Promueve a un miembro a administrador',
  category: 'group',
  ownerOnly: false,

  async run({ sock, from, msg, args, react, reply }) {
    // 1. Validar si es un grupo
    if (!from.endsWith('@g.us')) {
      return await reply({ text: '❌ Este comando solo se puede usar en grupos.' })
    }

    // 2. Obtener metadatos del grupo
    const groupMetadata = await sock.groupMetadata(from)
    const participants = groupMetadata.participants
    const botJid = sock.user.id.split(':')[0] + '@s.whatsapp.net'

    // 3. Verificar si el bot es admin
    const botIsAdmin = participants.some(p => p.id === botJid && (p.admin === 'admin' || p.admin === 'superadmin'))
    if (!botIsAdmin) {
      return await reply({ text: '❌ Necesito ser administrador del grupo para usar este comando.' })
    }

    // 4. Verificar si quien usa el comando es admin (Limpieza de JID agregada aquí)
    const senderJid = msg.sender.split(':')[0] + '@s.whatsapp.net'
    const userIsAdmin = participants.some(p => p.id === senderJid && (p.admin === 'admin' || p.admin === 'superadmin'))
    if (!userIsAdmin) {
      return await reply({ text: '❌ Solo los administradores pueden usar este comando.' })
    }

    // 5. Detectar el usuario a promover (por mención, por respuesta o por texto)
    let target = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] 
      || msg.message?.extendedTextMessage?.contextInfo?.participant
    
    if (!target && args[0]) {
      const cleanNum = args[0].replace(/\D/g, '')
      target = `${cleanNum}@s.whatsapp.net`
    }

    if (!target) {
      return await reply({ text: '⚠️ Etiqueta a alguien, responde a su mensaje o escribe su número para promoverlo.' })
    }

    // Limpiar también el target por si viene con identificador de dispositivo
    const cleanTarget = target.split(':')[0] + '@s.whatsapp.net'

    // 6. Verificar si ya es admin
    const targetIsAdmin = participants.some(p => p.id === cleanTarget && (p.admin === 'admin' || p.admin === 'superadmin'))
    if (targetIsAdmin) {
      return await reply({ text: '⚠️ Este usuario ya es administrador.' })
    }

    // 7. Ejecutar acción
    try {
      await react('⚔️')
      await sock.groupParticipantsUpdate(from, [cleanTarget], 'promote')
      
      const nombre = `@${cleanTarget.split('@')[0]}`
      await sock.sendMessage(from, {
        text: `✨ *¡NUEVO ADMINISTRADOR!*\n\n👑 ${nombre} ahora es administrador del grupo.`,
        mentions: [cleanTarget]
      }, { quoted: msg })
      
      await react('✅')
    } catch (e) {
      await react('❌')
      await reply({ text: `❌ No se pudo promover al usuario: ${e.message}` })
    }
  }
}
