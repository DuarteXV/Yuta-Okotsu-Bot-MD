export default {
  name: ["tag", "tagall"],
  description: "Repite el mensaje (texto o multimedia) con mención invisible a todos sin etiqueta de reenviado",
  groupOnly: true,
  adminOnly: true,

  async run({ sock, from, msg, groupMeta, text, reply, react }) {
    await react('📢');

    // 1. Obtener la lista de miembros para la mención invisible
    const members = groupMeta?.participants || [];
    const mentions = members.map(m => m.id);

    // 2. Detectar si estás respondiendo a alguien (quoted)
    const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage || 
                      msg.message?.ephemeralMessage?.message?.extendedTextMessage?.contextInfo?.quotedMessage;

    try {
      if (quotedMsg) {
        // --- CASO A: Respondiste a un mensaje (texto, foto, sticker, etc.) ---
        // Extraemos el tipo de mensaje original
        const messageType = Object.keys(quotedMsg)[0];
        const content = quotedMsg[messageType];

        // Construimos un objeto de mensaje limpio (sin propiedades de reenvío)
        let messageToSend = {};

        if (messageType === 'conversation' || messageType === 'extendedTextMessage') {
          // Si el mensaje citado es texto, el bot lo repite como texto limpio
          messageToSend = { text: content.text || content || text || "📢" };
        } else {
          // Si es multimedia (imageMessage, stickerMessage, videoMessage, etc.)
          // Copiamos el archivo (media key, url, etc.) para que se mande idéntico
          messageToSend = { [messageType]: content };
          
          // Si el usuario escribió un texto extra junto al comando (ej: .tag mira esto), se lo ponemos como comentario (caption)
          if (text && messageToSend[messageType].hasOwnProperty('caption')) {
            messageToSend[messageType].caption = text;
          }
        }

        // Agregamos la mención invisible en el contexto
        messageToSend.contextInfo = { mentions };

        // Enviamos el mensaje de forma nativa (sin usar la propiedad 'forward')
        await sock.sendMessage(from, messageToSend);

      } else {
        // --- CASO B: Pusiste .tag [mensaje] directamente en el chat ---
        const textoEnviar = text || "📢 ¡Atención a todos!";

        await sock.sendMessage(from, {  
          text: textoEnviar,  
          contextInfo: { mentions }
        });
      }

      await react('✅');
    } catch (error) {
      console.error("Error en el comando tag:", error);
      await react('❌');
    }
  }
};
