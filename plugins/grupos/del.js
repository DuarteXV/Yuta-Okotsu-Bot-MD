import { jidNormalizedUser } from "@whiskeysockets/baileys";

export default {
  name: ["del", "delete", "eliminar"],
  description: "Elimina un mensaje respondiendo a él",
  category: "grupos",
  groupOnly: true,
  adminOnly: true,
  botAdmin: true,

  async run({ sock, from, msg, reply }) {
    const quoted = msg.message?.extendedTextMessage?.contextInfo;

    if (!quoted?.stanzaId) {
      return await reply({
        text: "『✖️』Rᥱs⍴onძᧉ ⍺Ɩ ᴍᧉn𝗌⍺jᧉ qᥙᧉ qᥙіᧉꭇᧉ𝗌 ᧉƖіmіn⍺ꭇ."
      });
    }

    try {
      await sock.sendMessage(from, {
        delete: {
          remoteJid: from,
          id: quoted.stanzaId,
          participant: jidNormalizedUser(quoted.participant),
          fromMe: false
        }
      });
    } catch (e) {
      await reply({
        text: `❌ No se pudo eliminar:\n${e.message}`
      });
    }
  }
}