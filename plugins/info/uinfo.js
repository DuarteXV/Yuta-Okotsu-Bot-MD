export default {
  name: ['uinfo', 'userinfo', 'info'],
  description: 'Muestra información de un usuario',
  category: 'info',
  ownerOnly: false,

  async run({ sock, from, msg, senderNum, react, reply }) {
    await react('🔍')

    const quoted    = msg.message?.extendedTextMessage?.contextInfo
    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || []

    let target = quoted?.participant || mentioned[0] || `${senderNum}@s.whatsapp.net`
    const targetNum = target.split(':')[0].split('@')[0]
    target = `${targetNum}@s.whatsapp.net`

    try {
      const [status, foto, biz, devices] = await Promise.allSettled([
        sock.fetchStatus(target),
        sock.profilePictureUrl(target, 'image'),
        sock.getBusinessProfile(target),
        sock.getUSyncDevices([target], true, false),
      ])

      const statusText = status.status === 'fulfilled'
        ? status.value?.status || 'Sin estado'
        : 'No disponible'

      const tieneFoto  = foto.status === 'fulfilled' && foto.value
      const bizData    = biz.status === 'fulfilled' && biz.value
      const esBusiness = bizData && Object.keys(bizData).length > 0

      let dispositivosTxt = 'No disponible'
      if (devices.status === 'fulfilled' && devices.value) {
        const devList = devices.value
        dispositivosTxt = devList.length > 0
          ? `${devList.length} dispositivo(s) vinculado(s)`
          : 'Sin dispositivos vinculados'
      }

      let text = `✨ ═══ 🫧 *YUTA OKOTSU* 🫧 ═══ ✨\n`
      text += `🔍 _Información de Usuario_\n\n`

      text += `👤 ─── ❖ *PERFIL* ❖ ─── 👤\n`
      text += `  ✦ *Número:* +${targetNum}\n`
      text += `  ✦ *JID:* ${target}\n`
      text += `  ✦ *Tipo:* ${esBusiness ? '🏢 Business' : '👤 Normal'}\n`
      text += `  ✦ *Foto:* ${tieneFoto ? '✅ Tiene' : '❌ No tiene'}\n`
      text += `  ✦ *Estado:* ${statusText}\n`
      text += `  ✦ *Dispositivos:* ${dispositivosTxt}\n\n`

      if (esBusiness) {
        text += `🏢 ─── ❖ *BUSINESS* ❖ ─── 🏢\n`
        if (bizData.description) text += `  ✦ *Descripción:* ${bizData.description}\n`
        if (bizData.email)       text += `  ✦ *Email:* ${bizData.email}\n`
        if (bizData.category)    text += `  ✦ *Categoría:* ${bizData.category}\n`
        if (bizData.website?.length) text += `  ✦ *Web:* ${bizData.website[0]}\n`
        if (bizData.address)     text += `  ✦ *Dirección:* ${bizData.address}\n`
        text += '\n'
      }

      text += `⚔️ _Yuta Okotsu MD | DuarteXV_`

      if (tieneFoto) {
        await sock.sendMessage(from, {
          image: { url: foto.value },
          caption: text,
          mentions: [target]
        }, { quoted: msg })
      } else {
        await reply({ text, mentions: [target] })
      }

      await react('✅')

    } catch (e) {
      await react('❌')
      await reply({ text: `❌ Error: ${e.message}` })
    }
  }
}