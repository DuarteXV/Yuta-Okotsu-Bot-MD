import axios from "axios";
import { prepareWAMessageMedia, generateWAMessageFromContent } from "@whiskeysockets/baileys";
import { getPlugins } from "../../core/pluginLoader.js";

async function getBuffer(url) {
  try {
    const res = await axios({ method: "get", url, responseType: "arraybuffer" });
    return Buffer.from(res.data);
  } catch (e) {
    throw new Error(`Error descargando imagen: ${e.message}`);
  }
}

const catIcons = {
  info:       "🗺️",
  misc:       "🎴",
  dl:         "🎵",
  grupos:     "👥",
  owner:      "👑",
  media:      "🎬",
  util:       "🔧",
  downloader: "📥",
}

export default {
  name: ["menu", "help", "ayuda"],
  description: "Muestra el menú.",
  ownerOnly: false,

  async run({ sock, from, senderNum, isGroup, groupName, usedPrefix, react, msg }) {
    try {
      await react("⛩️");

      const hora  = new Date().toLocaleTimeString("es-CO", { hour12: false });
      const fecha = new Date().toLocaleDateString("es-CO");
      const lugar = isGroup ? groupName : "Chat Privado";

      const urlFoto   = "https://cdn.adoolab.xyz/dl/3d42f230.jpg";
      const linkMatch = "https://mancosyasociados.kesug.com";

      const plugins    = getPlugins()
      const categories = {}

      for (const [, plugin] of plugins) {
        const cat = plugin.category || "misc"
        if (cat === "owner") continue
        if (!categories[cat]) categories[cat] = new Set()
        const names = Array.isArray(plugin.name) ? plugin.name : [plugin.name]
        categories[cat].add(names[0])
      }

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

      for (const [cat, cmds] of Object.entries(categories)) {
        const icon = catIcons[cat] || "🎴"
        textoMenu += `${icon} ─── ❖ *${cat.toUpperCase()}* ❖ ─── ${icon}\n`
        for (const cmd of cmds) {
          textoMenu += `✦ ${usedPrefix}${cmd}\n`
        }
        textoMenu += "\n"
      }

      textoMenu += `🔺 _Powered by DuarteXV | Yuta Okotsu MD_ 🔺\n`;
      textoMenu += `🔗 ${linkMatch}`;

      const bufferBanner = await getBuffer(urlFoto);
      const mediaBanner  = await prepareWAMessageMedia(
        { image: bufferBanner },
        { upload: sock.waUploadToServer, mediaTypeOverride: "thumbnail-link" }
      );
      const imgBanner = mediaBanner.imageMessage;
      const getTs = (ts) => typeof ts === "object" ? Number(ts.low || ts) : Number(ts);

      const content = {
        extendedTextMessage: {
          endCardTiles: [],
          text: textoMenu,
          matchedText: linkMatch,
          canonicalUrl: linkMatch,
          description: "Developed by DuarteXV ❄",
          title: "YUTA OKOTSU",
          previewType: 0,
          jpegThumbnail: imgBanner.jpegThumbnail,
          thumbnailDirectPath: imgBanner.directPath,
          thumbnailSha256: imgBanner.fileSha256,
          thumbnailEncSha256: imgBanner.fileEncSha256,
          mediaKey: imgBanner.mediaKey,
          mediaKeyTimestamp: getTs(imgBanner.mediaKeyTimestamp),
          thumbnailHeight: imgBanner.height || 1080,
          thumbnailWidth: imgBanner.width || 1920,
          inviteLinkGroupTypeV2: 0,
          contextInfo: {
            mentionedJid: [`${senderNum}@s.whatsapp.net`],
            isForwarded: true,
            forwardingScore: 9999,
            forwardedNewsletterMessageInfo: {
              newsletterJid: "120363420979328566@newsletter",
              newsletterName: "⏤͟͞ू⃪𝐁𝕃𝐔𝔼 𝐋𝕆𝐂𝕂 𝐂𝕃𝐔𝔹 𑁯🩵ᰍ",
              serverMessageId: -1
            }
          }
        }
      };

      const waMsg = generateWAMessageFromContent(from, content, { userJid: sock.user?.id })
      await sock.relayMessage(from, waMsg.message, { messageId: waMsg.key.id })

    } catch (error) {
      console.error("Error crítico en el comando menu:", error);
    }
  }
};