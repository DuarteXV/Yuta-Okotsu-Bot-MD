import axios from "axios";
import { prepareWAMessageMedia, generateWAMessageFromContent } from "@whiskeysockets/baileys";
import { getPlugins } from "../../core/pluginLoader.js";
import { db } from "../../database/db.js";

let bannerCache    = null
let bannerCacheTime = 0
let mediaCache     = null
let mediaCacheTime  = 0
let lastUsedUrl     = null

async function getBuffer(url) {
  try {
    const res = await axios({ method: "get", url, responseType: "arraybuffer" });
    return Buffer.from(res.data);
  } catch (e) {
    throw new Error(`Error descargando imagen: ${e.message}`);
  }
}

async function getBannerBuffer(url) {
  if (bannerCache && lastUsedUrl === url && Date.now() - bannerCacheTime < 3600000) return bannerCache
  bannerCache = await getBuffer(url)
  bannerCacheTime = Date.now()
  lastUsedUrl = url
  return bannerCache
}

const catIcons = {
  "info":     "🌀",
  "misc":     "💠",
  "dl":       "☁",
  "grupos":   "❄",
  "owner":    "👑",
  "utils":    "💫",
  "stickers": "🪽",
  "sockets":  "🪐",
}

export default {
  name: ["menu", "help", "ayuda"],
  description: "Muestra el menú.",
  category: "info",
  ownerOnly: false,

  async run({ sock, from, senderNum, isGroup, groupName, usedPrefix, msg }) {
    try {
      const hora  = new Date().toLocaleTimeString("es-CO", { hour12: false });
      const fecha = new Date().toLocaleDateString("es-CO");
      const lugar = isGroup ? groupName : "Chat Privado";

      const currentBotJid = sock.user?.id ? sock.user.id.split('@')[0].split(':')[0] + '@s.whatsapp.net' : '';
      const botData = db.getBot(currentBotJid);
      
      const urlFoto = botData?.banner || "https://files.evogb.win/1oU31I.jpg";
      const tipoBot = botData?.isMain ? "🤖 Bot Principal" : "🧪 Subbot Activo";

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

      let textoMenu = `✨ ═══ 🫧 *𝐘𝐔𝐓𝐀 𝐎𝐊𝐎𝐓𝐒𝐔* 🫧 ═══ ✨\n`;
      textoMenu += `⚔️ _*𝓔𝐥 𝐇𝐞𝐜𝐡𝐢𝐜𝐞𝐫𝐨 𝐝𝐞 𝐆𝐫𝐚𝐝𝐨 𝐄𝐬𝐩𝐞𝐜𝐢𝐚𝐥 𝐡𝐚 𝐝𝐞𝐬𝐩𝐞𝐫𝐭𝐚𝐝𝐨*_\n\n`;

      textoMenu += `╔════ 🪐 *𝗜𝗡𝗙𝗢 𝗗𝗘𝗟 𝗦𝗜𝗦𝗧𝗘𝗠𝗔* 🪐 ════╗\n`;
      textoMenu += `┃ 👤 *⎯꯭♱𝆬       ְ ⃝𝐔𝐬𝐮𝐚𝐫𝐢𝐨:* @${senderNum}\n`;
      textoMenu += `┃ ⚙️ *⎯꯭♱𝆬       ְ ⃝𝗧𝗶𝗽𝗼:* ${tipoBot}\n`;
      textoMenu += `┃ 📍 *⎯꯭♱𝆬       ְ ⃝𝐂𝐚𝐧𝐚ล:* ${lugar}\n`;
      textoMenu += `┃ ⏰ *⎯꯭♱𝆬       ְ ⃝𝐇𝐨𝐫𝐚:* ${hora}\n`;
      textoMenu += `┃ 📅 *⎯꯭♱𝆬       ְ ⃝𝐅𝐞𝐜𝐡𝐚:* ${fecha}\n`;
      textoMenu += `╚════════════════════════╝\n\n`;

      textoMenu += `*📜 ㅤ𔗁꯭᭮֔   𝗟𝗜𝗦𝗧𝗔 𝗗𝗘 𝗖𝗢🇲𝗔𝗡𝗗𝗢𝗦* 📜\n`;
      textoMenu += `_𝐑𝐞𝐜𝐮𝐞𝐫𝐝𝐚 𝐔𝐬𝐚𝐫 𝐄𝐥 𝐏𝐫𝐞𝐟𝐢𝐣𝐨 [ ${usedPrefix} ] 𝐚𝐧𝐭𝐞𝐬 𝐝𝐞 𝐜𝐚𝐝𝐚 𝐨𝐫𝐝𝐞𝐧._\n\n`;

      for (const [cat, cmds] of Object.entries(categories)) {
        const categoriaLimped = cat.toLowerCase().trim();
        const icon = catIcons[categoriaLimped] || "🎴";
        const nombreFormateado = categoriaLimped.charAt(0).toUpperCase() + categoriaLimped.slice(1);
        textoMenu += `${icon} ─── ❖ *꒰ ${nombreFormateado} ꒱* ❖ ─── ${icon}\n`;
        for (const cmd of cmds) {
          textoMenu += `✦ ${usedPrefix}${cmd}\n`;
        }
        textoMenu += "\n";
      }

      textoMenu += `🪼 _⎯꯭♱𝆬       ְ𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐛𝐲 𝐃𝐮𝐚𝐫𝐭𝐞𝐗𝐕 | 𝐘𝐮𝐭𝐚 𝐎𝐤𝐨𝐭𝐬𝐮 𝐌𝐃_ 🪼\n`;
      textoMenu += `🔗 ${linkMatch}`;

      let imgBanner
      if (mediaCache && lastUsedUrl === urlFoto && Date.now() - mediaCacheTime < 3600000) {
        imgBanner = mediaCache
      } else {
        const bufferBanner = await getBannerBuffer(urlFoto)
        const mediaBanner  = await prepareWAMessageMedia(
          { image: bufferBanner },
          { upload: sock.waUploadToServer, mediaTypeOverride: "thumbnail-link" }
        )
        imgBanner      = mediaBanner.imageMessage
        mediaCache     = imgBanner
        mediaCacheTime = Date.now()
      }

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
            forwardingScore: 1,
            forwardedNewsletterMessageInfo: {
              newsletterJid: "120363420979328566@newsletter",
              newsletterName: "⏤͟͞ू⃪𝐁𝕃𝐔𝔼 𝐋𝕆𝐂𝕂 𝐂𝕃𝐔𝔹 𑁯🩵ᰍ",
              serverMessageId: -1
            }
          }
        }
      };

      const waMsg = generateWAMessageFromContent(from, content, { userJid: sock.user?.id, quoted: msg })
      await sock.relayMessage(from, waMsg.message, { messageId: waMsg.key.id })

    } catch (error) {
      console.error("Error crítico en el comando menu:", error);
    }
  }
};
