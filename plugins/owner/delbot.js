import { removeSubbot, activeBots } from '../../core/subbotManager.js'

export default {
  name: ['delbot'],
  description: 'Elimina un subbot',
  category: 'owner',
  ownerOnly: true,

  async run({ senderNum, args, react, reply, isOwner }) {
    await react('🗑️')

    // Owner puede borrar cualquiera, usuario solo el suyo
    const id = isOwner && args[0] ? args[0] : `sub_${senderNum}`

    if (!activeBots.has(id) && !require('fs').existsSync(`./sessions/subbots/${id}`)) {
      return await reply({ text: `❌ El subbot *${id}* no existe.` })
    }

    removeSubbot(id)
    await reply({ text: `✅ Subbot *${id}* eliminado y sesión borrada.` })
  }
}