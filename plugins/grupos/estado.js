import { generateWAMessageContent, generateWAMessageFromContent } from '@whiskeysockets/baileys'

// Función interna para el envío de estados de grupo V2
const sendGroupStatus = async (sock, jid, options = {}) => {
  const {
    text,
    media,
    type = 'text',
    caption = '',
    mimetype,
    fileName,
    ptt = false,
    textArgb = 4292401368,
    backgroundArgb = 4283453520,
    font = 5,
    audienceType = 2,
    listName = 'Mejores Amigos',
    listEmoji = '⭐'
  } = options

  if (!sock?.relayMessage) throw new Error('sock inválido')
  if (!jid || typeof jid !== 'string') throw new Error('jid requerido')

  const contextInfo = {
    statusSourceType: 0,
    statusAttributions: [{
      AttributionData: null,
      type: 10
    }],
    isGroupStatus: true,
    statusAudienceMetadata: {
      audienceType,
      listName,
      listEmoji
    }
  }

  let innerMessage

  if (type === 'text') {
    if (!text || typeof text !== 'string') throw new Error('text requerido')
    innerMessage = {
      extendedTextMessage: {
        text,
        textArgb,
        backgroundArgb,
        font,
        previewType: 0,
        contextInfo
      }
    }
  } else {
    if (!sock?.waUploadToServer) throw new Error('waUploadToServer no disponible')
    if (!media) throw new Error('media requerida')

    const allowed = ['image', 'video', 'audio', 'document']
    if (!allowed.includes(type)) throw new Error(`type inválido: ${type}`)

    const mediaContent = {
      [type]: typeof media === 'string' ? { url: media } : media
    }

    if (caption && ['image', 'video'].includes(type)) mediaContent.caption = caption
    if (mimetype) mediaContent.mimetype = mimetype
    if (fileName && type === 'document') mediaContent.fileName = fileName
    if (type === 'audio') mediaContent.ptt = ptt

    const content = await generateWAMessageContent(mediaContent, {
      upload: sock.waUploadToServer
    })

    const messageKey = `${type}Message`
    if (!content?.[messageKey]) throw new Error(`No se pudo generar ${messageKey}`)

    content[messageKey].contextInfo = contextInfo
    innerMessage = {
      [messageKey]: content[messageKey]
    }
  }

  const message = generateWAMessageFromContent(jid, {
    groupStatusMessageV2: {
      message: innerMessage
    }
  }, {
    userJid: sock.user?.id
  })

  await sock.relayMessage(jid, message.message, {
    messageId: message.key.id
  })

  return message
}

export default {
  name: ["estadogrupo", "gstatus", "statusgrupo"],
  category: 'owner',
  cooldown: 5,
  groupOnly: true,
  privateOnly: false,
  adminOnly: false,
  botAdmin: false,
  ownerOnly: true,

  // Usando los mismos parámetros exactos que tu comando .tag
  async run({ sock, from, msg, text, reply, react }) {
    try {
      await react('⏳');

      // Obtener el mensaje citado de la estructura nativa de tu bot
      const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage || 
                        msg.message?.ephemeralMessage?.message?.extendedTextMessage?.contextInfo?.quotedMessage;

      if (quotedMsg) {
        const messageType = Object.keys(quotedMsg)[0];
        const mediaType = messageType.replace('Message', '').toLowerCase();

        if (['image', 'video', 'audio', 'document'].includes(mediaType)) {
          // Si tu sistema tiene msg.quoted.download() implementado úsalo, 
          // de lo contrario, se asume el manejo directo de la propiedad nativa del buffer si existiera.
          // Como medida segura, descargamos usando la función nativa si msg.quoted no está mapeado por el handler:
          let buffer;
          if (msg.quoted && typeof msg.quoted.download === 'function') {
            buffer = await msg.quoted.download();
          } else {
            // Fallback usando downloadMediaMessage de Baileys de ser necesario
            const { downloadMediaMessage } = await import('@whiskeysockets/baileys');
            buffer = await downloadMediaMessage({ message: quotedMsg }, 'buffer', {}, { logger: console });
          }
          
          await sendGroupStatus(sock, from, {
            type: mediaType,
            media: buffer,
            caption: text || quotedMsg[messageType]?.caption || '',
            mimetype: quotedMsg[messageType]?.mimetype || undefined,
            fileName: quotedMsg[messageType]?.fileName || undefined
          });
        } else {
          const statusText = text || quotedMsg.conversation || quotedMsg.extendedTextMessage?.text || '';
          if (!statusText) {
            await react('❌');
            return reply('❀ Escribe un texto o cita un archivo multimedia para subir como estado del grupo.');
          }
          
          await sendGroupStatus(sock, from, {
            type: 'text',
            text: statusText
          });
        }
      } else {
        const statusText = text || '';
        if (!statusText) {
          await react('❌');
          return reply('❀ Escribe un texto para subir como estado del grupo.');
        }
        
        await sendGroupStatus(sock, from, {
          type: 'text',
          text: statusText
        });
      }

      await react('✅');
      reply('> ✎ Estado del grupo enviado con éxito.');
    } catch (e) {
      console.error(e);
      await react('❌');
      reply(`❌ Error al procesar el estado: ${e.message}`);
    }
  }
}
