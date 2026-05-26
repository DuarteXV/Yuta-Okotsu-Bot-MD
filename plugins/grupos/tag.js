export default {
  name: ["tag", "tagall"],
  description: "Menciona a todos en el grupo",
  groupOnly: true,
  modOnly: true,

  async run({ sock, from, msg, groupMeta, text, reply, react }) {
    await react('📢')

    const members  = groupMeta?.participants || []
    const mentions = members.map(m => m.id)
    const texto    = text || "📢 Atención!"

    await sock.sendMessage(from, {
      text: texto,
      mentions,
    }, { quoted: msg })

    await react('✅')
  }
}