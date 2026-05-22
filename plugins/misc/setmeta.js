import { db } from '../../database/db.js'

export default {
  name: ['setmeta'],
  description: 'Cambia tu marca de agua para stickers',
  category: 'misc',
  ownerOnly: false,

  async run({ senderNum, text, usedPrefix, react, reply }) {
    await react('⚙️')

    if (!text) return await reply({
      text: `❌ Uso: *.setmeta Pack | Autor*\n\nEjemplo:\n*.setmeta Yuta Okotsu | DuarteXV*`
    })

    const partes = text.split('|').map(s => s.trim())
    if (partes.length < 2) return await reply({
      text: `❌ Separa pack y autor con *|*\n\nEjemplo:\n*.setmeta Mi Pack | Mi Nombre*`
    })

    const user = db.getUser(senderNum)
    if (user.text1 || user.text2) return await reply({
      text: `⚠️ Ya tienes una marca establecida.\nUsa *.delmeta* para eliminarla primero.`
    })

    user.text1 = partes[0]
    user.text2 = partes[1]

    await reply({
      text: `✅ *Marca actualizada*\n\n📦 *Pack:* ${user.text1}\n✍️ *Autor:* ${user.text2}`
    })
  }
}