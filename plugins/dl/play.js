import axios from "axios";
import yts from "yt-search";

const API_KEY = "free_key";

export default {
  name: ["play"],
  description: "Descarga música de YouTube",
  ownerOnly: false,

  async run({ sock, from, msg, text, reply, react }) {
    try {
      await reply({
        text: "🐞 Debug iniciado",
      });

      if (!text) {
        return reply({
          text: "❌ No pusiste texto",
        });
      }

      await reply({
        text: `✅ Texto recibido:\n${text}`,
      });

      await react("🔍");

      // ─── BUSCAR VIDEO ───────────────────────────────
      const search = await yts(text);

      await reply({
        text: `✅ Resultados encontrados: ${search.videos.length}`,
      });

      if (!search.videos.length) {
        return reply({
          text: "❌ Sin resultados",
        });
      }

      const video = search.videos[0];

      await reply({
        text:
          `🎵 Video encontrado:\n\n` +
          `📌 ${video.title}\n` +
          `🔗 ${video.url}`,
      });

      const api = `https://yosoyyo-api-ofc.onrender.com/api/youtube?q=${encodeURIComponent(video.url)}&apiKey=${API_KEY}`;

      await reply({
        text: "🌐 Consultando API...",
      });

      // ─── API ────────────────────────────────────────
      const res = await axios.get(api, {
        timeout: 30000,
      });

      await reply({
        text:
          `✅ API respondió\n\n` +
          `${JSON.stringify(res.data).slice(0, 300)}`,
      });

      const data = res.data?.result?.[0];

      if (!data) {
        return reply({
          text: "❌ La API no devolvió result[0]",
        });
      }

      const mp3 =
        data.download?.mp3 ||
        data.downloads?.mp3?.url;

      await reply({
        text:
          `🎧 MP3:\n${mp3 ? "✅ Encontrado" : "❌ No encontrado"}`,
      });

      if (!mp3) {
        return reply({
          text: "❌ No hay mp3",
        });
      }

      await reply({
        text: "📤 Enviando audio...",
      });

      // ─── ENVIAR AUDIO ───────────────────────────────
      await sock.sendMessage(
        from,
        {
          audio: { url: mp3 },
          mimetype: "audio/mpeg",
          fileName: `${data.title}.mp3`,
        },
        { quoted: msg }
      );

      await react("✅");

      await reply({
        text: "✅ Audio enviado correctamente",
      });

    } catch (e) {
      await react("❌");

      await reply({
        text:
          `❌ ERROR DEBUG\n\n` +
          `📛 ${e.message}\n\n` +
          `${e.stack?.slice(0, 1000)}`,
      });
    }
  },
};