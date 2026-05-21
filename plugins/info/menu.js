import { getPlugins } from "../core/pluginLoader.js";
import config from "../config.js";

export default {
  name: ["menu", "help", "ayuda"],
  description: "Muestra el menú de comandos",
  category: "info",

  async run({ reply, react, sender, isGroup, groupName }) {
    await react("⚔️");

    const plugins = getPlugins();
    const categories = {};

    for (const [, plugin] of plugins) {
      const cat = plugin.category || "misc";
      if (!categories[cat]) categories[cat] = [];
      const names = Array.isArray(plugin.name) ? plugin.name : [plugin.name];
      categories[cat].push(names[0]);
    }

    const catIcons = {
      grupos:  "👥",
      info:    "📋",
      owner:   "👑",
      premium: "💎",
      misc:    "🎴",
      media:   "🎵",
      util:    "🔧",
    };

    const hora = new Date().toLocaleTimeString("es-CO", { hour12: false });
    const fecha = new Date().toLocaleDateString("es-CO");
    const user = sender.split("@")[0];
    const lugar = isGroup ? `🏯 ${groupName}` : "💬 Chat privado";

    let text = "";
    text += `⚔️ *YUTA OKOTSU* ⚔️\n`;
    text += `✦ *El Usuario Especial* ✦\n\n`;
    text += `👤 *Usuario:* ${user}\n`;
    text += `📍 *Lugar:* ${lugar}\n`;
    text += `🕐 *Hora:* ${hora}  •  📅 ${fecha}\n`;
    text += `🔖 *Prefijo:* ${config.prefix}\n\n`;
    text += `━━━━━━━━━━━━━━━━━━━━\n\n`;

    for (const [cat, cmds] of Object.entries(categories)) {
      const icon = catIcons[cat] || "🎴";
      text += `${icon} *${cat.toUpperCase()}*\n`;
      for (const cmd of cmds) {
        text += `  ✦ ${config.prefix}${cmd}\n`;
      }
      text += `\n`;
    }

    text += `━━━━━━━━━━━━━━━━━━━━\n`;
    text += `🗡️ _Powered by DuarteXV_`;

    await reply({ text });
  },
};