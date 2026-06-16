import { requestSubbotCode, activeBots } from '../../core/subbotManager.js'

const cooldowns = new Map()

export default {
  name: ['code'],
  description: 'Vincula tu número como subbot',
  category: 'sockets',
  ownerOnly: false,

  async run({ sock, from, senderNum, react, reply, msg }) {
    await react('🔑')

    const id = `sub_${senderNum}`

    // ─── YA CONECTADO ────────────────────────────────────
    if (activeBots.has(id) && activeBots.get(id).status === 'online') {
      return await reply({
        text: `⚠️ Tu número ya está vinculado como subbot.\nUsa *.delbot* para desvincularlo.`
      })
    }

    // ─── COOLDOWN 1 MINUTO ───────────────────────────────
    if (cooldowns.has(senderNum)) {
      const diff    = Date.now() - cooldowns.get(senderNum)
      const restante = Math.ceil((60000 - diff) / 1000)
      if (diff < 60000) {
        return await reply({
          text: `⏳ Ya pediste un código recientemente.\nEspera *${restante} segundos* antes de pedir otro.`
        })
      }
    }

    cooldowns.set(senderNum, Date.now())

    // ─── INSTRUCCIONES ───────────────────────────────────
    await reply({
      text: `⚔️ *VINCULACIÓN DE SUBBOT*\n\n` +
        `📋 *Instrucciones:*\n` +
        `  ✦ Abre WhatsApp en tu teléfono\n` +
        `  ✦ Ve a *Dispositivos vinculados*\n` +
        `  ✦ Toca *Vincular dispositivo*\n` +
        `  ✦ Toca *Vincular con número de teléfono*\n` +
        `  ✦ Ingresa el código que recibirás ahora\n\n` +
        `⏳ _Generando código..._`
    })

    // ─── CÓDIGO ──────────────────────────────────────────
    try {
      const phone = senderNum.replace(/\D/g, '')
      const code  = await requestSubbotCode(id, phone)

      await sock.sendMessage(from, {
        text: `${code}`
      }, { quoted: msg })

      await react('✅')

    } catch (e) {
      cooldowns.delete(senderNum)
      await react('❌')
      await reply({ text: `❌ Error generando código:\n${e.message}` })
    }
  }
}