export default {
  name: ['join', 'unirse'],
  description: 'El bot se une a un grupo por link',
  category: 'grupos',
  ownerOnly: true,

  async run({ sock, text, usedPrefix, react, reply }) {
    await react('⏳')

    if (!text) return await reply({
      text:
        `❌ Pega el link del grupo.\n\n` +
        `💡 *${usedPrefix}join https://chat.whatsapp.com/XXXXXX*`
    })

    const link = text.trim()

    if (!link.includes('chat.whatsapp.com/')) return await reply({
      text: `❌ El link no es válido.\n\nDebe ser: *https://chat.whatsapp.com/XXXXXX*`
    })

    const code = link.split('chat.whatsapp.com/')[1]?.split(' ')[0]
    if (!code) return await reply({ text: `❌ No se pudo extraer el código del link.` })

    try {
      await sock.groupAcceptInvite(code)
      await react('✅')
      await reply({
        text:
          `✅ *Bot unido al grupo*\n\n` +
          `🔗 *Link:* ${link}\n\n` +
          `⚔️ _Yuta Okotsu MD | DuarteXV_`
      })
    } catch (e) {
      await react('❌')
      await reply({ text: `❌ No se pudo unir: ${e.message}` })
    }
  }
}
