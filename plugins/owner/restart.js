export default { 
  name: ["restart", "rest"], 
  description: "Reinicia el bot", 
  ownerOnly: true,
  async run({ conn, m, reply }) {
    await reply({'📍 *Reiniciando el bot, espere un momento...*'})
    setTimeout(() => { process.exit(1) }, 1000)
  }
}