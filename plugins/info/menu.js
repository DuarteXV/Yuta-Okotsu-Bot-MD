import { prepareWAMessageMedia } from "@whiskeysockets/baileys";
import axios from "axios";
import config from "../../config.js";

export default {
  name: ["menu", "help", "ayuda"],
  description: "Muestra el menú estético con link preview",
  ownerOnly: false,

  async run({ sock, from, senderNum, isGroup, groupName, usedPrefix, react, msg }) {
    try {
      await react("⛩️");

      const hora  = new Date().toLocaleTimeString("es-CO", { hour12: false });
      const fecha = new Date().toLocaleDateString("es-CO");
      const lugar = isGroup ? groupName : "Chat Privado";
      const redes = "https://whatsapp.com/channel/0029Vb73g1r1NCrTbefbFQ2T";

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
      textoMenu += `✦ ${usedPrefix}ping ➔ _Verifica la latencia del bot_\n`;
      textoMenu += `✦ ${usedPrefix}system ➔ _Estado del sistema_\n`;
      textoMenu += `✦ ${usedPrefix}bots ➔ _Bots conectados_\n`;
      textoMenu += `✦ ${usedPrefix}code ➔ _Vincular como subbot_\n\n`;

      textoMenu += `👥 ─── ❖ *GRUPOS* ❖ ─── 👥\n`;
      textoMenu += `✦ ${usedPrefix}tag ➔ _Mencionar a todos_\n\n`;

      textoMenu += `🎴 ─── ❖ *MISC* ❖ ─── 🎴\n`;
      textoMenu += `✦ ${usedPrefix}s ➔ _Crear sticker_\n`;
      textoMenu += `✦ ${usedPrefix}setmeta ➔ _Cambiar marca de sticker_\n`;
      textoMenu += `✦ ${usedPrefix}delmeta ➔ _Resetear marca_\n\n`;

      textoMenu += `👑 ─── ❖ *OWNER* ❖ ─── 👑\n`;
      textoMenu += `✦ ${usedPrefix}eval ➔ _Ejecutar código_\n`;
      textoMenu += `✦ ${usedPrefix}r ➔ _Ejecutar shell_\n`;
      textoMenu += `✦ ${usedPrefix}check ➔ _Verificar sistema_\n\n`;

      textoMenu += `🔺 _Powered by DuarteXV | Yuta Okotsu MD_ 🔺\n`;
      textoMenu += `🔗 ${redes}`;

      // ─── IMAGEN ──────────────────────────────────────────
      const mediaUrl = "https://cdn.adoolab.xyz/dl/d6688fcd.jpeg";

      let bufferBanner;
      try {
        const res = await axios.get(mediaUrl, { responseType: "arraybuffer", timeout: 8000 });
        bufferBanner = Buffer.from(res.data);
      } catch {
        const res = await axios.get("https://files.catbox.moe/xr2m6u.jpg", { responseType: "arraybuffer", timeout: 8000 });
        bufferBanner = Buffer.from(res.data);
      }

      const mediaBanner = await prepareWAMessageMedia(
        { image: bufferBanner },
        { upload: sock.waUploadToServer, mediaTypeOverride: "thumbnail-link" }
      );
      const imgBanner = mediaBanner.imageMessage;
      const getTs = (ts) => typeof ts === "object" ? Number(ts.low || ts) : Number(ts);

      const content = {
        extendedTextMessage: {
          endCardTiles: [],
          text: textoMenu,
          matchedText: redes,
          canonicalUrl: redes,
          description: "Powered by DuarteXV",
          title: "⚔️ Yuta Okotsu MD",
          previewType: 0,
          jpegThumbnail: imgBanner.jpegThumbnail,
          thumbnailDirectPath: imgBanner.directPath,
          thumbnailSha256: imgBanner.fileSha256,
          thumbnailEncSha256: imgBanner.fileEncSha256,
          mediaKey: imgBanner.mediaKey,
          mediaKeyTimestamp: getTs(imgBanner.mediaKeyTimestamp),
          thumbnailHeight: imgBanner.height || 735,
          thumbnailWidth: imgBanner.width || 735,
          inviteLinkGroupTypeV2: 0,
          contextInfo: {
            mentionedJid: [`${senderNum}@s.whatsapp.net`],
            forwardingScore: 9999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
              newsletterJid: "120363368618055639@newsletter",
              newsletterName: "Yuta Okotsu MD",
              serverMessageId: -1
            }
          }
        }
      };

      await sock.relayMessage(from, content, { messageId: msg.key.id });

    } catch (error) {
      console.error("Error en menu:", error);
    }
  }
};