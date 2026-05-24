import axios from "axios";
import yts from "yt-search";

const API_KEY = "Zyzz-1234";

export default {
  name: ["play", "yta", "ytmp3", "playaudio"],
  description: "Descarga música de YouTube",
  ownerOnly: false,

  async run({ sock, from, msg, text, cmdName, reply, react }) {
    try {
      if (!text.trim()) {
        return reply({
          text: "˖ ࣪ 𐙚 escribe el nombre o link del video",
        });
      }

      await react("🎧");

      const search = await yts(text);

      const yt =
        search.videos?.[0] ||
        search.all?.[0];

      if (!yt) {
        return reply({
          text: "˖ ࣪ 𐙚 no encontré resultados",
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
            `˖ ࣪ 𐙚 ${title}\n\n` +
            `︶꒦꒷ ${vistas} vistas\n` +
            `︶꒦꒷ ${timestamp}\n` +
            `︶꒦꒷ ${ago}\n\n` +
            `₊ ⊹ obteniendo audio`
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
        timeout: 90000,
      });

      const json = res.data;

      if (!json?.status || !json?.data?.download?.url) {
        return reply({
          text: "˖ ࣪ 𐙚 no pude obtener el archivo",
        });
      }

      const dlUrl = json.data.download.url;

      if (type === "audio") {
        await sock.sendMessage(
          from,
          {
            audio: { url: dlUrl },
            mimetype: "audio/mpeg",
            ptt: false,
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

      await react("✅");

    } catch (e) {
      console.error(e);

      await react("❌");

      await reply({
        text: `˖ ࣪ 𐙚 ${e.message}`,
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