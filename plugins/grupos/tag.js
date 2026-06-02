export default {
  name: ["tag", "tagall"],
  description: "Repite el mensaje de forma nativa con mención invisible a todo el grupo",
  groupOnly: true,
  adminOnly: true,

  async run({ sock, from, msg, groupMeta, text, reply, react }) {
    await react('📢');

    // 1. Obtener miembros para la mención fantasma
    const members = groupMeta?.participants || [];
    const mentions = members.map(m => m.id);

    // 2. Detectar si estás respondiendo a un mensaje (quoted)
    const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage || 
                      msg.message?.ephemeralMessage?.message?.extendedTextMessage?.contextInfo?.quotedMessage;

    try {
      if (quotedMsg) {
        // --- CASO A: Respondiendo a cualquier mensaje (Texto, Sticker, Foto, etc.) ---
        
        // Clonamos el mensaje citado para no alterar el original
        const messageContent = JSON.parse(JSON.stringify(quotedMsg));
        const messageType = Object.keys(messageContent)[0];

        // Si escribiste texto junto al comando (.tag hola), se lo aplicamos si es posible
        if (text) {
          if (messageType === 'conversation') {
            messageContent.conversation = text;
          } else if (messageType === 'extendedTextMessage') {
            messageContent.extendedTextMessage.text = text;
          } else if (messageContent[messageType]?.caption !== undefined) {
            messageContent[messageType].caption = text;
          }
        }

        // Forzamos a que el contextInfo elimine cualquier rastro de reenvío e incluya las menciones
        const limpioContextInfo = {
          mentions,
          mentionedJid: mentions,
          isForwarded: false // <-- Esto le quita la etiqueta de "Reenviado" en la mayoría de versiones de Baileys
        };

        // Si el contenido ya tiene un contextInfo interno, lo fusionamos, si no, lo creamos
        if (messageContent[messageType] && typeof messageContent[messageType] === 'object') {
          messageContent[messageType].contextInfo = {
            ...messageContent[messageType].contextInfo,
            ...limpioContextInfo
          };
        }

        // Enviamos el mensaje clonado usando el sistema de reenvío limpio de Baileys
        await sock.sendMessage(from, {
          forward: {
            key: msg.key,
            message: messageContent
          },
          contextInfo: limpioContextInfo
        }, { quoted: msg });

      } else {
        // --- CASO B: Mensaje directo sin responder (.tag Hola a todos) ---
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
