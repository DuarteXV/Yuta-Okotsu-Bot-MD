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

const catNombres = {
  "info":     "INFO",
  "misc":     "MISC",
  "dl":       "DL",
  "grupos":   "GROUP",
  "owner":    "OWNER",
  "utils":    "UTILS",
  "stickers": "STICKERS",
  "sockets":  "SOCKETS",
}

const catDescripciones = {
  "info":     "ᶜᵒᵐᵃⁿᵈᵒˢ ᵈᵉ ⁱⁿᶠᵒʳᵐᵃᶜⁱᵒⁿ·",
  "misc":     "ᶜᵒᵐᵃⁿᵈᵒˢ ᵐⁱˢᶜ·",
  "dl":       "ᶜᵒᵐᵃⁿᵈᵒˢ ᵈᵉ ᵈᵉˢᶜᵃʳᵍᵃˢ·",
  "grupos":   "ᶜᵒᵐᵃⁿᵈᵒˢ ᵖᵃʳᵃ ᵍᵉˢᵗⁱᵒⁿᵃʳ ᵍʳᵘᵖᵒˢ·",
  "owner":    "ᶜᵒᵐᵃⁿᵈᵒˢ ᵈᵉ ᵒʷⁿᵉʳ·",
  "utils":    "ᶜᵒᵐᵃⁿᵈᵒˢ ᵘᵗⁱˡᵉˢ·",
  "stickers": "ᶜᵒᵐᵃⁿᵈᵒˢ ᵖᵃʳᵃ ᵍᵉˢᵗⁱᵒⁿᵃʳ ˢᵗⁱᶜᵏᵉʳˢ·",
  "sockets":  "ᶜᵒᵐᵃⁿᵈᵒˢ ᵖᵃʳᵃ ˢᵘᵇᵇᵒᵗˢ·",
}

export default {
  name: ["menu", "help", "ayuda"],
  description: "Muestra el menú del sistema.",
  category: "info",
  ownerOnly: false,

  async run({ sock, from, senderNum, isGroup, groupName, usedPrefix, msg }) {
    try {
      const lugar = isGroup ? groupName : "Chat Privado";

      const currentBotNum = sock.user?.id ? sock.user.id.split('@')[0].split(':')[0].replace(/\D/g, '') : '';
      const currentBotJid = currentBotNum ? `${currentBotNum}@s.whatsapp.net` : '';

      let botData = db.getBot(currentBotJid) || db.getBot('main');

      const esLabelAutomatico = botData?.label?.startsWith('SUB_') || botData?.label === 'Subbot' || botData?.label === 'MAIN'
      const nombreBot = (esLabelAutomatico || !botData?.label ? config.botName : botData.label).replace(/@\d+/g, '').trim();

      const urlFoto = botData?.banner || "https://files.evogb.win/1oU31I.jpg";

      // 🛡️ Fuente de verdad única: isMain de la DB
      const esVerdaderoMain = botData?.isMain === true || botData?.isMain === 1;
      const tipoBot = esVerdaderoMain ? "Bot Principal" : "Subbot";

      const linkMatch = "https://mancosyasociados.kesug.com";

      const esOwnerOCoOwner = config.ownerNumber?.includes(senderNum) || config.coOwners?.includes(senderNum)

      const plugins    = getPlugins()
      const categories = {}

      for (const [, plugin] of plugins) {
        const cat = plugin.category || "misc"
        if (cat === "owner" && !esOwnerOCoOwner) continue
        if (!categories[cat]) categories[cat] = new Set()
        const names = Array.isArray(plugin.name) ? plugin.name : [plugin.name]
        categories[cat].add(names[0])
      }

      let textoMenu = `*𝐇𝐨𝐥𝐚!* *@${senderNum}* soy "${nombreBot}"\n`;
      textoMenu += `╭━━━━━━━━━━━━━━━━━━\n`;
      textoMenu += `│ 𖠌 \`ᴛɪᴘᴏ::\` ${tipoBot}\n`;
      textoMenu += `│ 𖠌 \`sɪsᴛᴇᴍᴀ/ᴏᴘʀ::\` Android\n`;
      textoMenu += `│ 𖠌 \`ᴜsᴇʀ::\` @${senderNum}\n`;
      textoMenu += `│ 𖠌 \`ᴜʀʟ::\` ${linkMatch}\n`;
      textoMenu += `╰━━━━━━━━━━━━━━━━━━\n\n`;

      for (const [cat, cmds] of Object.entries(categories)) {
        const categoriaLimped = cat.toLowerCase().trim();
        const nombreFormateado = catNombres[categoriaLimped] || categoriaLimped.toUpperCase();
        const descripcion = catDescripciones[categoriaLimped] || "ᶜᵒᵐᵃⁿᵈᵒˢ·";

        textoMenu += `𓆩◇𓆪 ⸙ SECTOR│ *${nombreFormateado}* ·°ᰍ.•\n`;
        textoMenu += `✐꒷ ${descripcion}\n`;

        for (const cmd of cmds) {
          textoMenu += `> ⏤͟͟͞͞⊱🌀 *${usedPrefix}${cmd}*\n`;
        }

        textoMenu += `\n`;
      }

      textoMenu += `╭━─━─━─━─━─━─━─━╮\n`;
      textoMenu += `🪼 _powᧉꭇᧉd ɓy DuarteXV_ │\n`;
      textoMenu += `🔗 ${linkMatch}\n`;
      textoMenu += `╰━─━─━─━─━─━─━─━╯`;

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
              newsletterName: "⏤͟͟͞͞★꙲⃝͟𝐘𝐔𝐓𝐀 𝐎𝐊𝐊𝐎𝐓𝐒𝐔 │ 𝐂𝐇𝐀𝐍𝐍𝐄𝐋 ◌Ⳋ𝅄",
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