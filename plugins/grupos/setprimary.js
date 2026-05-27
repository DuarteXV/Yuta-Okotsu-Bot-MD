import { db } from '../../database/db.js'

export default {
  name: ['setprimary'],
  description: 'Establece este bot como primario del grupo',
  groupOnly: true,
  ownerOnly: true,

  async run({ from, botJid, react, reply }) {
    await react('⚙️')
    const botId = botJid.split('@')[0]
    db.setPrimary(from, botId)
    await reply({ text: `✅ *Bot primario establecido*\n\nSolo este bot (*${botId}*) responderá en este grupo.` })
  }
}