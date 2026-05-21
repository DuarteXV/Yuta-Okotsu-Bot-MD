import { getPlugins } from "../core/pluginLoader.js";

export default {
  name: ["menu", "help", "ayuda"],
  description: "Muestra el menú de comandos",
  category: "info",

  // Usamos las variables exactas que envías en el ctx de tu handleMessage
  async run({ reply, react, senderNum, isGroup, groupName, usedPrefix }) {
    try {
      await react("⚔️");

      const pluginsMap = getPlugins();
      const categories = {};
      
      // Filtramos duplicados usando los módulos únicos del Map
      const uniquePlugins = new Set(pluginsMap.values());

      for (const plugin of uniquePlugins) {
        if (!plugin || !plugin.name) continue;

        const cat = plugin.category || "misc";
        if (!categories[cat]) categories[cat] = [];
        
        // Tomamos el primer nombre/alias para la lista principal
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
      const lugar = isGroup ? `🏯 ${groupName}` : "💬 Chat privado";

      let text = "";
      text += `⚔️ *YUTA OKOTSU* ⚔️\n`;
      text += `✦ *El Usuario Especial* ✦\n\n`;
      text += `👤 *Usuario:* ${senderNum}\n`; // Usamos directamente senderNum que ya viene limpio
      text += `📍 *Lugar:* ${lugar}\n`;
      text += `🕐 *Hora:* ${hora}  •  📅 ${fecha}\n`;
      text += `🔖 *Prefijo:* ${usedPrefix}\n\n`; // Usamos usedPrefix que detectó el handler
      text += `━━━━━━━━━━━━━━━━━━━━\n\n`;

      for (const [cat, cmds] of Object.entries(categories)) {
        const icon = catIcons[cat] || "🎴";
        text += `${icon} *${cat.toUpperCase()}*\n`;
        for (const cmd of cmds) {
          text += `  ✦ ${usedPrefix}${cmd}\n`;
        }
        text += `\n`;
      }

      text += `━━━━━━━━━━━━━━━━━━━━\n`;
      text += `🗡️ _Powered by DuarteXV_`;

      await reply({ text });
      
    } catch (error) {
      // Si algo falla, el handler capturará este error y te dirá la línea exacta en la consola
      console.error("Error interno en el comando menu:", error);
      throw error; 
    }
  },
};
