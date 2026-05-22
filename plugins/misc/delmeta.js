import { db } from '../../database/db.js'

export default {
  name: ['delmeta'],
  description: 'Resetea tu marca de agua a la del bot',
  category: 'misc',
  ownerOnly: false,

  async run({ senderNum, react, reply }) {
    await react('🗑️')

    const user = db.getUser(senderNum)
    if (!user.text1 && !user.text2) return await reply({
      text: `⚠️ No tienes ninguna marca establecida.`
    })

    delete user.text1
    delete user.text2

    await reply({
      text: `✅ *Marca reseteada* a la del bot\n\n📦 *Pack:* ⚔️ Yuta Okotsu MD\n✍️ *Autor:* DuarteXV`
    })
  }
}