import axios from "axios";
import yts from "yt-search";

const API_KEY = "Irokz444";

export default {
  name: ["play", "yta", "ytmp3", "playaudio"],
  description: "Descarga música de YouTube",
  ownerOnly: false,

  async run({ sock, from, msg, text, reply, react }) {
    try {
      if (!text.trim()) {
        return reply({
          text: "⛧ escribe el nombre o link del video",
        });
      }

      await react("🎧");

      const search = await yts(text);

      const yt =
        search.videos?.[0] ||
        search.all?.[0];

      if (!yt) {
        return reply({
          text: "⛧ no encontré resultados",
        });
      }

      const api =
        `https://systemzone.store/v2/player?apikey=${API_KEY}&text=${encodeURIComponent(text)}`;

      const res = await axios.get(api, {
        timeout: 90000,
      });

      const data = res.data;

      if (!data?.status || !data?.download_url) {
        return reply({
          text: "⛧ no pude obtener el audio",
        });
      }

      const {
        title,
        thumbnail,
        duration,
        youtube_url,
        download_url
      } = data;

      const vistas = formatViews(yt.views);

      await sock.sendMessage(
        from,
        {
          image: { url: thumbnail || yt.thumbnail },
          caption:
            `⛧ ${title}\n\n` +
            `⛧ vistas › ${vistas}\n` +
            `⛧ duración › ${formatDuration(duration || yt.seconds)}\n` +
            `⛧ calidad › 128 kbps\n` +
            `⛧ formato › mp3\n` +
            `⛧ link › ${youtube_url}`
        },
        { quoted: msg }
      );

      const isLongAudio = yt.seconds > 1800; // 30 minutos

      if (isLongAudio) {
        await sock.sendMessage(
          from,
          {
            document: { url: download_url },
            mimetype: "audio/mpeg",
            fileName: `${title}.mp3`,
            caption: "⛧ audio enviado como documento por duración/tamaño",
          },
          { quoted: msg }
        );
      } else {
        await sock.sendMessage(
          from,
          {
            audio: { url: download_url },
            mimetype: "audio/mpeg",
            ptt: false,
          },
          { quoted: msg }
        );
      }

      await react("✅");

    } catch (e) {
      console.error(e);

      await react("❌");

      await reply({
        text: `⛧ ${e.message}`,
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

function formatDuration(duration) {
  if (!duration) return "No disponible";

  // Si ya viene tipo "3:24"
  if (typeof duration === "string") {
    if (duration.includes(":")) {
      return duration;
    }

    duration = Number(duration);
  }

  // Evita NaN
  if (isNaN(duration)) {
    return "No disponible";
  }

  const hours = Math.floor(duration / 3600);
  const minutes = Math.floor((duration % 3600) / 60);
  const seconds = Math.floor(duration % 60);

  // Formato HH:MM:SS
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  // Formato MM:SS
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}