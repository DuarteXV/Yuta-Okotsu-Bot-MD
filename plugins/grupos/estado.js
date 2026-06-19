import { generateWAMessageContent, generateWAMessageFromContent } from '@whiskeysockets/baileys';

export default {
  name: ["status", "groupstatus", "estadogrupo"],
  description: "Envía un Estado de Grupo (Group Status V2) con texto o contenido multimedia",
  groupOnly: true,
  adminOnly: true,

  async run({ sock, from, msg, text, reply, react }) {
    // Validar requerimientos esenciales de la conexión de Baileys
    if (!sock?.relayMessage || !sock?.waUploadToServer) {
      await react('❌');
      return reply("❌ Tu conexión actual no soporta el envío de estados de grupo.");
    }

    await react('⏳');

    // 1. Detectar si el usuario está respondiendo a un archivo multimedia
    const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage || 
                      msg.message?.ephemeralMessage?.message?.extendedTextMessage?.contextInfo?.quotedMessage;

    // Configuración base del ContextInfo para Group Status V2
    const contextInfo = {
      statusSourceType: 0,
      statusAttributions: [{ AttributionData: null, type: 10 }],
      isGroupStatus: true,
      statusAudienceMetadata: {
        audienceType: 2,
        listName: 'Mejores Amigos',
        listEmoji: '⭐'
      }
    };

    let innerMessage;

    try {
      if (quotedMsg) {
        // --- CASO A: Se respondió a un mensaje multimedia (Foto, Video, Audio, Documento) ---
        const messageType = Object.keys(quotedMsg)[0];
        const allowedTypes = ['imageMessage', 'videoMessage', 'audioMessage', 'documentMessage'];

        if (!allowedTypes.includes(messageType)) {
          await react('❌');
          return reply("❌ Tipo de mensaje citado no válido para estado. Responde a una foto, video, audio o documento.");
        }

        // Normalizamos el tipo para la API de Baileys
        const cleanType = messageType.replace('Message', ''); // Ej: 'image'
        
        // Extraemos las propiedades multimedia del mensaje citado
        const mediaContent = {
          [cleanType]: quotedMsg[messageType]
        };

        // Si el usuario añadió un texto con el comando, se asigna como leyenda (caption)
        if (text && ['image', 'video'].includes(cleanType)) {
          mediaContent.caption = text;
        }

        // Generamos el contenido multimedia usando los servidores de WhatsApp
        const content = await generateWAMessageContent(mediaContent, {
          upload: sock.waUploadToServer
        });

        if (!content?.[messageType]) throw new Error(`No se pudo procesar el ${messageType}`);

        // Inyectamos la metadata de estado grupal
        content[messageType].contextInfo = contextInfo;
        innerMessage = { [messageType]: content[messageType] };

      } else {
        // --- CASO B: Estado solo de Texto ---
        const textoEnviar = text || "📢 ¡Nuevo Estado de Grupo!";

        innerMessage = {
          extendedTextMessage: {
            text: textoEnviar,
            textArgb: 4292401368,       // Color de texto por defecto
            backgroundArgb: 4283453520, // Color de fondo por defecto
            font: 5,
            previewType: 0,
            contextInfo
          }
        };
      }

      // 2. Construir el contenedor del mensaje de estado V2
      const message = generateWAMessageFromContent(from, {
        groupStatusMessageV2: {
          message: innerMessage
        }
      }, {
        userJid: sock.user?.id
      });

      // 3. Transmitir el mensaje a través de relayMessage
      await sock.relayMessage(from, message.message, {
        messageId: message.key.id
      });

      await react('✅');

    } catch (error) {
      console.error("Error en plugin sendGroupStatus:", error);
      await react('❌');
      await reply("❌ Ocurrió un error al intentar enviar el estado de grupo.");
    }
  }
};
