import axios from "axios";
import { prepareWAMessageMedia } from "@whiskeysockets/baileys";

async function getBuffer(url) {
  try {
    const res = await axios({
      method: "get",
      url: url,
      responseType: "arraybuffer"
    });
    return Buffer.from(res.data);
  } catch (e) {
    throw new Error(`Error descargando imagen: ${e.message}`);
  }
}

export default {
  name: ["menu", "help", "ayuda"],
  description: "Muestra la lista de comandos disponibles",
  ownerOnly: false,

  async run({ sock, from, senderNum, isGroup, groupName, usedPrefix, react, msg }) {
    try {
      await react("⛩️");

      const hora = new Date().toLocaleTimeString("es-CO", { hour12: false });
      const fecha = new Date().toLocaleDateString("es-CO");
      const lugar = isGroup ? groupName : "Chat Privado";

      const urlFoto = "https://raw.githubusercontent.com/DuarteXV/Yotsuba-MD-Premium/main/uploads/81af45f44481e159.jpg";
      const linkMatch = "https://mancosyasiociados.wuaze.com/";

      let textoMenu = `✨ ═══ 🫧 *YUTA OKOTSU* 🫧 ═══ ✨\n`;
      textoMenu += `⚔️ _¡El Hechicero de Grado Especial ha despertado!_\n\n`;
      
      textoMenu += `╔════ 🪐 *INFO DEL SISTEMA* 🪐 ════╗\n`;
      textoMenu += `┃ 👤 *Usuario:* @${senderNum}\n`;
      textoMenu += `┃ 📍 *Canal:* ${lugar}\n`;
      textoMenu += `┃ ⏰ *Hora:* ${hora}\n`;
      textoMenu += `┃ 📅 *Fecha:* ${fecha}\n`;
      textoMenu += `╚════════════════════════╝\n\n`;

      textoMenu += `*📜 LISTA DE COMANDOS* 📜\n`;
      textoMenu += `_Recuerda usar el prefijo [ ${usedPrefix} ] antes de cada orden._\n\n`;

      textoMenu += `🗺️ ─── ❖ *INFORMACIÓN* ❖ ─── 🗺️\n`;
      textoMenu += `✦ ${usedPrefix}menu ➔ _Despliega este menú_\n`;
      textoMenu += `✦ ${usedPrefix}ping ➔ _Verifica la latencia del bot_\n\n`;

      textoMenu += `👥 ─── ❖ *GESTIÓN GRUPOS* ❖ ─── 👥\n`;
      textoMenu += `✦ ${usedPrefix}tag ➔ _Mención flash a todos los miembros_\n\n`;

      textoMenu += `👑 ─── ❖ *PROPIETARIO / OWNER* ❖ ─── 👑\n`;
      textoMenu += `✦ ${usedPrefix}eval ➔ _Ejecutor de código en vivo_\n`;
      textoMenu += `✦ ${usedPrefix}update ➔ _Sincronización forzada con GitHub_\n\n`;

      textoMenu += `🔺 _Powered by DuarteXV | Yuta Okotsu MD_ 🔺\n`;
      textoMenu += `🔗 ${linkMatch}`;

      const thumbBuffer = await getBuffer(urlFoto);

      const imageUpload = await prepareWAMessageMedia(
        { image: thumbBuffer },
        { upload: sock.waUploadToServer }
      );

      const imageMessage = imageUpload.imageMessage;

      const content = {
        extendedTextMessage: {
          endCardTiles: [],
          text: textoMenu,
          matchedText: linkMatch,
          description: "Developed by JonathanG ❄",
          title: "LEON-KENNEDY",
          previewType: 0,
          jpegThumbnail: thumbBuffer.toString("base64"), 
          
          thumbnailDirectPath: imageMessage.directPath,
          thumbnailSha256: imageMessage.fileSha256,
          thumbnailEncSha256: imageMessage.fileEncSha256,
          mediaKey: imageMessage.mediaKey,
          mediaKeyTimestamp: imageMessage.mediaKeyTimestamp,
          thumbnailHeight: 1080,
          thumbnailWidth: 1920,

          contextInfo: {
            mentionedJid: [senderNum + "@s.whatsapp.net"],
            forwardingScore: -1,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
              newsletterJid: "120363368618055639@newsletter", 
              newsletterName: "Mancos Y Asociados Channel",
              serverMessageId: -1
            }
          }
        }
      };

      await sock.relayMessage(from, content, { messageId: msg.key.id });

    } catch (error) {
      console.error("Error en el comando menu:", error);
    }
  }
};