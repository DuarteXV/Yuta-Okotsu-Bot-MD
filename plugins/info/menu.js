import { prepareWAMessageMedia } from "@whiskeysockets/baileys";
import fetch from "node-fetch";

export default {
  name: ["menu", "help", "ayuda"],
  description: "Muestra el menú estético utilizando la lógica de renderizado multimedia del welcome",
  ownerOnly: false,

  async run({ sock, from, senderNum, isGroup, groupName, usedPrefix, react, msg }) {
    try {
      await react("⛩️");

      let botId = sock.user?.id || '';
      let botSettings = global.db.data.settings[botId] || {};

      global.botname = botSettings.botName || global.botname || 'KennyBot';
      let nombreLargo = botSettings.botText || global.botname || 'KennyBot-MD';
      let devText = `${nombreLargo}, Developed by JonathanG ❄`;

      const hora = new Date().toLocaleTimeString("es-CO", { hour12: false });
      const fecha = new Date().toLocaleDateString("es-CO");
      const lugar = isGroup ? groupName : "Chat Privado";
      
      let redes = "https://mancosyasiociados.wuaze.com/";

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
      textoMenu += `🔗 ${redes}`;

      // --- LÓGICA DE IMAGEN EN CASCADA EXTRAÍDA DE TU WELCOME ---
      let mediaUrl = null;

      // 1. Si hay Banner configurado en el menú
      if (botSettings.logo?.banner) {
          let bData = botSettings.logo.banner;
          if (typeof bData === 'object' && bData.url) {
              mediaUrl = bData.url;
          } else if (typeof bData === 'string') {
              mediaUrl = bData;
          }
      } 
      // 2. Base por defecto global
      else if (global.banner) {
          mediaUrl = global.banner;
      }

      // 3. Si no hay nada, foto de perfil del Bot
      if (!mediaUrl) {
          mediaUrl = await sock.profilePictureUrl(sock.user?.id.split(':')[0] + '@s.whatsapp.net', 'image').catch(_ => 'https://files.catbox.moe/xr2m6u.jpg');
      }

      // --- PROCESAMIENTO MULTIMEDIA EXACTO DE TU WELCOME ---
      let bufferBanner;
      try { bufferBanner = await (await fetch(mediaUrl)).buffer(); } 
      catch { bufferBanner = await (await fetch('https://files.catbox.moe/xr2m6u.jpg')).buffer(); }

      const mediaBanner = await prepareWAMessageMedia(
          { image: bufferBanner }, 
          { upload: sock.waUploadToServer, mediaTypeOverride: "thumbnail-link" } // El truco clave
      );
      const imgBanner = mediaBanner.imageMessage;
      const getTs = (ts) => typeof ts === 'object' ? Number(ts.low || ts) : Number(ts);

      // --- ESTRUCTURA EXTENDEDTEXTMESSAGE ADAPTADA AL MENÚ ---
      const content = {
          extendedTextMessage: {
              endCardTiles: [],
              text: textoMenu, 
              matchedText: redes, 
              canonicalUrl: redes,
              description: devText, 
              title: "LEON-KENNEDY", 
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
                  mentionedJid: [senderNum + "@s.whatsapp.net"],
                  forwardingScore: 9999,
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
      console.error("Error en el comando menu con la lógica del welcome:", error);
    }
  }
};