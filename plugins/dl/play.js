import axios from "axios";
import yts from "yt-search";

const API_KEY = "Zyzz-1234";

const MAX_AUDIO = 16 * 1024 * 1024;
const MAX_VIDEO = 64 * 1024 * 1024;

export default {
  name: ["play", "yta", "ytmp3", "playaudio"],
  description: "Descarga música de YouTube",
  ownerOnly: false,

  async run({ sock, from, msg, text, cmdName, reply, react }) {
    try {
      if (!text.trim()) {
        return reply({
          text: "⚽ Ingresa el nombre o enlace del video.",
        });
      }

      await react("🔍");

      const search = await yts(text);

      const yt =
        search.videos?.[0] ||
        search.all?.[0];

      if (!yt) {
        return reply({
          text: "✧ No se encontraron resultados.",
        });
      }

      const {
        title,
        thumbnail,
        timestamp,
        views,
        ago,
        url
      } = yt;

      const vistas = formatViews(views);

      await sock.sendMessage(
        from,
        {
          image: { url: thumbnail },
          caption:
            `⚽ 𝗬𝗼𝘂𝗧𝘂𝗯𝗲 𝗗𝗼𝘄𝗻𝗹𝗼𝗮𝗱\n` +
            `> 🎬 *${title}*\n` +
            `> 👁️ *${vistas}*\n` +
            `> ⏱️ *${timestamp}*\n` +
            `> 📅 *${ago}*\n\n` +
            `⚽ Procesando archivo...`
        },
        { quoted: msg }
      );

      const type = [
        "play",
        "yta",
        "ytmp3",
        "playaudio"
      ].includes(cmdName)
        ? "audio"
        : "video";

      const api =
        `https://rest.apicausas.xyz/api/v1/descargas/youtube?url=${encodeURIComponent(url)}&type=${type}&apikey=${API_KEY}`;

      const res = await axios.get(api, {
        timeout: 30000,
      });

      const json = res.data;

      if (!json?.status || !json?.data?.download?.url) {
        return reply({
          text: "❌ No se pudo descargar el archivo",
        });
      }

      const dlUrl = json.data.download.url;

      let fileSize = 0;

      try {
        const head = await axios.head(dlUrl);

        fileSize = parseInt(
          head.headers["content-length"] || "0"
        );
      } catch {}

      if (type === "audio") {
        if (fileSize > MAX_AUDIO) {
          await sock.sendMessage(
            from,
            {
              document: { url: dlUrl },
              fileName: `${title}.mp3`,
              mimetype: "audio/mpeg",
            },
            { quoted: msg }
          );
        } else {
          await sock.sendMessage(
            from,
            {
              audio: { url: dlUrl },
              mimetype: "audio/mpeg",
              ptt: false,
            },
            { quoted: msg }
          );
        }
      } else {
        if (fileSize > MAX_VIDEO) {
          await sock.sendMessage(
            from,
            {
              document: { url: dlUrl },
              fileName: `${title}.mp4`,
              mimetype: "video/mp4",
            },
            { quoted: msg }
          );
        } else {
          await sock.sendMessage(
            from,
            {
              video: { url: dlUrl },
              mimetype: "video/mp4",
            },
            { quoted: msg }
          );
        }
      }

      await react("✅");

    } catch (e) {
      console.error(e);

      await react("❌");

      await reply({
        text: `⚠︎ Error: ${e.message}`,
      });
    }
  },
};

function formatViews(views) {
  if (!views) return "No disponible";

  if (views >= 1e9) {
    return `${(views / 1e9).toFixed(1)}B`;
  }

  if (views >= 1e6) {
    return `${(views / 1e6).toFixed(1)}M`;
  }

  if (views >= 1e3) {
    return `${(views / 1e3).toFixed(1)}k`;
  }

  return views.toString();
}