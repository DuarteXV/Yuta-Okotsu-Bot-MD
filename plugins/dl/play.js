import axios from "axios";
import yts from "yt-search";

const API_KEY = "free_key";

export default {
  name: ["play"],
  description: "Descarga música de YouTube",
  ownerOnly: false,

  async run({ sock, from, msg, text, reply, react }) {
    try {
      if (!text) {
        return reply({
          text: "✧ Ingresa un nombre o link",
        });
      }

      await react("🔍");

      const search = await yts(text);

      if (!search.videos.length) {
        return reply({
          text: "❌ Sin resultados",
        });
      }

      const video = search.videos[0];

      const api = `https://yosoyyo-api-ofc.onrender.com/api/youtube?q=${encodeURIComponent(video.url)}&apiKey=${API_KEY}`;

      const res = await axios.get(api, {
        timeout: 30000,
      });

      const data = res.data?.result?.[0];

      if (!data) {
        return reply({
          text: "❌ Error obteniendo el audio",
        });
      }

      const mp3 =
        data.download?.mp3 ||
        data.downloads?.mp3?.url;

      if (!mp3) {
        return reply({
          text: "❌ No se encontró el mp3",
        });
      }

      await reply({
        text:
          `🎵 *${video.title}*\n` +
          `⏳ Enviando audio...`,
      });

      await sock.sendMessage(
        from,
        {
          audio: { url: mp3 },
          mimetype: "audio/mpeg",
          fileName: `${video.title}.mp3`,
        },
        { quoted: msg }
      );

      await react("✅");

    } catch (e) {
      console.error(e);

      await react("❌");

      await reply({
        text: `❌ ${e.message}`,
      });
    }
  },
};