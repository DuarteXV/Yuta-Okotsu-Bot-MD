import { db } from '../../database/db.js'

export default {
  name: ['setmeta'],
  description: 'Cambia tu marca de agua para stickers',
  category: 'misc',
  ownerOnly: false,

  async run({ senderNum, text, react, reply }) {
    await react('⚙️')

    if (!text) {
      return await reply({
        text:
          `❌ Uso:\n` +
          `*.setmeta Autor*\n` +
          `*.setmeta Pack | Autor*\n\n` +
          `Ejemplo:\n` +
          `*.setmeta DuarteXV•404*\n` +
          `*.setmeta Yuta MD | DuarteXV*`
      })
    }

    const user = db.getUser(senderNum)

    // En SQLite, si no tiene configuración, text1 y text2 vienen como null
    if (user.text1 || user.text2) {
      return await reply({
        text: `⚠️ Ya tienes una marca establecida.\nUsa *.delmeta* para eliminarla primero.`
      })
    }

    const texto = text.trim()
    let packName = ''
    let authorName = ''

    if (texto.includes('|')) {
      const [pack, author] = texto.split('|').map(v => v.trim())
      packName = pack || texto
      authorName = author || texto
    } else {
      packName = texto
      authorName = texto
    }

    // 🌟 AQUÍ ESTÁ EL CAMBIO: Guardar directamente en SQLite
    db.setUser(senderNum, { text1: packName, text2: authorName });

    await reply({
      text:
        `✅ *Marca actualizada*\n\n` +
        `📦 *Pack:* ${packName}\n` +
        `✍️ *Autor:* ${authorName}`
    })
    await react('✅')
  }
}
