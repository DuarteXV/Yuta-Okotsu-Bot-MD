import { db } from '../../database/db.js'

export default {
  name: ['setmeta'],
  description: 'Cambia tu marca de agua para stickers',
  category: 'misc',
  ownerOnly: false,

  async run({ senderNum, text, react, reply }) {
    await react('⚙️')

    if (!text) return await reply({
      text: `❌ Uso: *.setmeta Autor*\n\nEjemplo:\n*.setmeta DuarteXV•404*`
    })

    const user = db.getUser(senderNum)
    if (user.text1 || user.text2) return await reply({
      text: `⚠️ Ya tienes una marca establecida.\nUsa *.delmeta* para eliminarla primero.`
    })

    user.text1 = text
    user.text2 = text

    await reply({
      text: `✅ *Marca actualizada*\n\n✍️ *Autor:* ${text}`
    })
  }
}