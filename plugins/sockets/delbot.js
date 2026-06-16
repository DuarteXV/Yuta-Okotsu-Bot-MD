import { removeSubbot, activeBots } from '../../core/subbotManager.js'

export default {
  name: ['delbot', 'desconectar'],
  description: 'Desvincula tu número como subbot',
  category: 'sockets',
  ownerOnly: false,

  async run({ senderNum, react, reply }) {
    await react('🗑️')

    const id = `sub_${senderNum}`

    if (!activeBots.has(id)) {
      return await reply({ text: `❌ No tienes ningún subbot vinculado.` })
    }

    removeSubbot(id)
    await reply({ text: `✅ Tu subbot fue desvinculado y la sesión eliminada.` })
  }
}