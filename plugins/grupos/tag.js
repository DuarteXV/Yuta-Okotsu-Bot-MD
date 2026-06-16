export default {
  name: ["tag"],
  description: "Repite el mensaje de forma nativa con mención invisible a todo el grupo",
  category: 'grupos',
  groupOnly: true,
  adminOnly: true,

  async run({ sock, from, msg, groupMeta, text, reply, react }) {
    await react('📢');

    const members = groupMeta?.participants || [];
    const mentions = members.map(m => m.id);

    const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage || 
                      msg.message?.ephemeralMessage?.message?.extendedTextMessage?.contextInfo?.quotedMessage;

    try {
      if (quotedMsg) {
        const messageContent = JSON.parse(JSON.stringify(quotedMsg));
        const messageType = Object.keys(messageContent)[0];

        if (text) {
          if (messageType === 'conversation') {
            messageContent.conversation = text;
          } else if (messageType === 'extendedTextMessage') {
            messageContent.extendedTextMessage.text = text;
          } else if (messageContent[messageType]?.caption !== undefined) {
            messageContent[messageType].caption = text;
          }
        }

        const limpioContextInfo = {
          mentions,
          mentionedJid: mentions,
          isForwarded: false
        };

        if (messageContent[messageType] && typeof messageContent[messageType] === 'object') {
          messageContent[messageType].contextInfo = {
            ...messageContent[messageType].contextInfo,
            ...limpioContextInfo
          };
        }

        await sock.sendMessage(from, {
          forward: {
            key: msg.key,
            message: messageContent
          },
          contextInfo: limpioContextInfo
        }, { quoted: msg });

      } else {
        const textoEnviar = text || "📢 ¡Atención a todos!";

        await sock.sendMessage(from, {  
          text: textoEnviar,  
          contextInfo: { mentions, mentionedJid: mentions }
        });
      }

      await react('✅');
    } catch (error) {
      console.error("Error en el comando tag:", error);
      await react('❌');
    }
  }
};
