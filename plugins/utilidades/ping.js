export default {
  name: ["ping", "speed"],
  description: "Mide la latencia del bot",
  category: 'utils',
  ownerOnly: false,
  async run({ reply, react }) {
    const start = Date.now();
    await react("🏓");
    await reply({ text: `🏓 *Pong!*\n⚡ Latencia: *${Date.now() - start}ms*` });
  },
};