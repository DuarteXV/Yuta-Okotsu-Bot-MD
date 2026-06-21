import axios from "axios";
import { prepareWAMessageMedia, generateWAMessageFromContent } from "@whiskeysockets/baileys";
import { getPlugins } from "../../core/pluginLoader.js";
import { db } from "../../database/db.js";
import config from "../../config.js";

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
  "info":     "🔮",
  "misc":     "⚜️",
  "dl":       "🪐",
  "grupos":   "💎",
  "owner":    "👑",
  "utils":    "🛠️",
  "stickers": "🎭",
  "sockets":  "🛰️",
}

export default {
  name: ["menu", "help", "ayuda"],
  description: "Muestra el menú del sistema.",
  category: "info",
  ownerOnly: false,

  async run({ sock, from, senderNum, isGroup, groupName, usedPrefix, msg }) {
    try {
      const timeZone = "America/Bogota";
      const ahora = new Date();

      const horaStr = ahora.toLocaleTimeString("es-CO", { timeZone, hour12: false });
      const fecha   = ahora.toLocaleDateString("es-CO", { timeZone });
      const lugar   = isGroup ? groupName : "Chat Privado";

      const currentBotJid = sock.user?.id ? sock.user.id.split('@')[0].split(':')[0] + '@s.whatsapp.net' : '';
      const botData = db.getBot(currentBotJid);

      const esLabelAutomatico = botData?.label?.startsWith('SUB_') || botData?.label === 'Subbot' || botData?.label === 'MAIN'
      const nombreBot = (esLabelAutomatico || !botData?.label ? config.botName : botData.label).replace(/@\d+/g, '').trim();

      const urlFoto   = botData?.banner || "https://files.evogb.win/1oU31I.jpg";
      const tipoBot   = botData?.isMain ? "Bot Principal" : "Subbot";

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

      let textoMenu = `╭━━━━━━━━━━━━━━━━━━○\n`;
      textoMenu += `│◇ \`ᴛɪᴘᴏ::\` ${tipoBot}\n`;
      textoMenu += `│◇ \`sɪsᴛᴇᴍᴀ/ᴏᴘʀ::\` Android\n`;
      textoMenu += `│◇ \`ᴜsᴇʀ::\` @${senderNum}\n`;
      textoMenu += `│◇ \`ᴜʀʟ::\` ${linkMatch}\n`;
      textoMenu += `╰━━━━━━━━━━━━━━━━━━○\n\n`;

      for (const [cat, cmds] of Object.entries(categories)) {
        const categoriaLimped = cat.toLowerCase().trim();
        const icon = catIcons[categoriaLimped] || "🎴";
        const nombreFormateado = categoriaLimped.toUpperCase();
        
        textoMenu += `╭━━━━━━━━━━━━━━━━━━━━━━━○\n`;
        textoMenu += `█°⿻︵ׄ  SECTOR│*${nombreFormateado}* ·°.•\n`;
        
        for (const cmd of cmds) {
          textoMenu += `│˗ˋˏ𓍯 ꒰ 🪼 *${usedPrefix}${cmd}*\n`;
        }
        
        textoMenu += `╰━━━━━━━━━━━━━━━━━━━━━━━⬣\n\n`;
      }

      textoMenu += `🪼 _Powered by DuarteXV | ${nombreBot}_\n`;
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
          description: `Powered by DuarteXV | ${nombreBot}`,
          title: nombreBot.toUpperCase(),
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
              newsletterName: "⏤͟͞ू⃪𝐁𝕃𝐔𝔼 𝐋𝕆𝐂𝕂 𝐂𝕃UZ 𑁯🩵ᰍ",
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
