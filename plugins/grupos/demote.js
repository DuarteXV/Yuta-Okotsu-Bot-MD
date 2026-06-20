export default {
  name: ['demote', 'quitaradmin'],
  description: 'Quita el rango de administrador a un miembro',
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

    // 4. Obtener el JID del emisor desde la llave del mensaje
    const rawSender = msg.key.participant || msg.key.remoteJid || ''
    const senderJid = rawSender.split(':')[0]

    // 5. Verificar si quien usa el comando es admin (búsqueda flexible por prefijo de número)
    const userIsAdmin = participants.some(p => {
      const pJid = p.id.split(':')[0]
      return pJid === senderJid && (p.admin === 'admin' || p.admin === 'superadmin')
    })

    if (!userIsAdmin) {
      return await reply({ text: '❌ Solo los administradores pueden usar este comando.' })
    }

    // 6. Detectar el usuario a demoler (por mención, por respuesta o por texto)
    let target = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] 
      || msg.message?.extendedTextMessage?.contextInfo?.participant
    
    if (!target && args[0]) {
      const cleanNum = args[0].replace(/\D/g, '')
      target = `${cleanNum}@s.whatsapp.net`
    }

    if (!target) {
      return await reply({ text: '⚠️ Etiqueta a alguien, responde a su mensaje o escribe su número para degradarlo.' })
    }

    const targetIdClean = target.split(':')[0]
    const cleanTargetJid = targetIdClean + '@s.whatsapp.net'

    // 7. Verificar si el usuario NO es admin
    const targetIsAdmin = participants.some(p => p.id.split(':')[0] === targetIdClean && (p.admin === 'admin' || p.admin === 'superadmin'))
    if (!targetIsAdmin) {
      return await reply({ text: '⚠️ Este usuario no es administrador.' })
    }

    // Evitar que se intente degradar al creador supremo del grupo
    const targetIsCreator = participants.some(p => p.id.split(':')[0] === targetIdClean && p.admin === 'superadmin')
    if (targetIsCreator) {
      return await reply({ text: '❌ No puedes quitarle el admin al creador del grupo.' })
    }

    // 8. Ejecutar acción
    try {
      await react('🛡️')
      await sock.groupParticipantsUpdate(from, [cleanTargetJid], 'demote')
      
      const nombre = `@${cleanTargetJid.split('@')[0]}`
      await sock.sendMessage(from, {
        text: `📉 *¡DEMOCIÓN DE RANGO!*\n\n❌ ${nombre} ya no es administrador del grupo.`,
        mentions: [cleanTargetJid]
      }, { quoted: msg })
      
      await react('✅')
    } catch (e) {
      await react('❌')
      await reply({ text: `❌ No se pudo degradar al usuario: ${e.message}` })
    }
  }
}
