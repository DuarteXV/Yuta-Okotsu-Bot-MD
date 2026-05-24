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

      let videoUrl = text;

      // Buscar en YouTube si no es link
      if (
        !text.includes("youtube.com") &&
        !text.includes("youtu.be")
      ) {
        const search = await yts(text);

        if (!search.videos.length) {
          return reply({
            text: "❌ Sin resultados",
          });
        }

        videoUrl = search.videos[0].url;
      }

      // API
      const api = `https://yosoyyo-api-ofc.onrender.com/api/youtube?q=${encodeURIComponent(
        videoUrl
      )}&apiKey=${API_KEY}`;

      const res = await axios.get(api, {
        timeout: 30000,
      });

      const data = res.data?.result?.[0];

      if (!data) {
        return reply({
          text: "❌ Error API",
        });
      }

      const title = data.title;
      const mp3 =
        data.download?.mp3 ||
        data.downloads?.mp3?.url;

      // Info
      await reply({
        text: `🎵 *${title}*`,
      });

      // Audio
      await sock.sendMessage(
        from,
        {
          audio: { url: mp3 },
          mimetype: "audio/mpeg",
          fileName: `${title}.mp3`,
        },
        { quoted: msg }
      );

      await react("✅");

    } catch (e) {
      console.error(e);

      await react("❌");

      await reply({
        text: `❌ Error:\n${e.message}`,
      });
    }
  },
};