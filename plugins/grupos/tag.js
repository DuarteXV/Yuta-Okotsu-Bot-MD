export default {
  name: ["tag", "tagall"],
  description: "Repite el mensaje de forma nativa activando la mención oculta/fantasma a todo el grupo",
  groupOnly: true,
  adminOnly: true,

  async run({ sock, from, msg, groupMeta, text, reply, react }) {
    await react('📢');

    // 1. Lista de participantes para la mención interna
    const members = groupMeta?.participants || [];
    const mentions = members.map(m => m.id);

    // 2. Detectar si es un mensaje respondido (quoted)
    const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage || 
                      msg.message?.ephemeralMessage?.message?.extendedTextMessage?.contextInfo?.quotedMessage;

    try {
      // Objeto base de configuración para forzar la mención a nivel de WhatsApp
      const contextInfo = { 
        mentions,
        // Añadimos estas propiedades para simular un contexto correcto que despierte las notificaciones
        mentionedJid: mentions 
      };

      if (quotedMsg) {
        // --- CASO A: Respondiendo a un mensaje (Espejo nativo sin 'forward') ---
        const messageType = Object.keys(quotedMsg)[0];
        const content = quotedMsg[messageType];

        let messageToSend = {};

        if (messageType === 'conversation' || messageType === 'extendedTextMessage') {
          // Si es texto, enviamos el texto plano con el contenedor de menciones
          messageToSend = { 
            text: text || content.text || content || "📢",
            contextInfo 
          };
        } else {
          // Si es multimedia (foto, sticker, video, etc.) clonamos sus buffers y keys nativas
          messageToSend = { 
            [messageType]: { ...content },
            contextInfo
          };
          
          // Si añadiste texto al comando (ej: .tag ojo aquí), se vuelve el comentario del archivo
          if (text) {
            messageToSend[messageType].caption = text;
          }
        }

        // Enviamos de forma limpia (sin la propiedad forward: {} para evitar el cartel de reenviado)
        await sock.sendMessage(from, messageToSend);

      } else {
        // --- CASO B: Mensaje directo (.tag hola) ---
        const textoEnviar = text || "📢 ¡Atención a todos!";

        await sock.sendMessage(from, {  
          text: textoEnviar,  
          contextInfo
        });
      }

      await react('✅');
    } catch (error) {
      console.error("Error en el comando tag:", error);
      await react('❌');
    }
  }
};
