export default {
  name: ['lid', 'jid'],
  description: 'Muestra el LID y JID de un usuario',
  category: 'info',
  ownerOnly: false,

  async run({ msg, senderNum, react, reply }) {
    await react('🔍')

    const quoted     = msg.message?.extendedTextMessage?.contextInfo
    const participant = quoted?.participant || quoted?.remoteJid

    const jid = participant || `${senderNum}@s.whatsapp.net`
    const lid = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || null

    const num = jid.split('@')[0].split(':')[0]

    let text = `🔍 *INFO DE USUARIO*\n\n`
    text += `📱 *JID:* \`${jid}\`\n`
    text += `🔢 *Número:* \`${num}\`\n`

    if (lid) {
      text += `🆔 *LID:* \`${lid}\`\n`
    } else {
      text += `🆔 *LID:* _No disponible_\n`
    }

    await reply({ text })
  }
}