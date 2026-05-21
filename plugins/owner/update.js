import { execSync } from "child_process";
import { loadPlugins } from "../core/pluginLoader.js";

export default {
  name: ["update", "actualizar", "gitpull"],
  description: "Fuerza la actualización desde GitHub y recarga plugins",
  ownerOnly: true,

  async run({ reply, react }) {
    try {
      await react("🔄");

      execSync("git fetch --all");
      execSync("git reset --hard origin/main");
      const stdout = execSync("git pull origin main").toString();

      if (stdout.includes("Already up to date") || stdout.includes("Ya está al día")) {
        await react("✅");
        return await reply({ text: "✅ *Ya está todo actualizado.*" });
      }
      
      await loadPlugins();

      await reply({ 
        text: `✅ *Actualización Forzada Exitosa:*\n\`\`\`${stdout}\`\`\`\n🔄 *Plugins recargados en memoria sin conflictos.*` 
      });

    } catch (err) {
      await react("❌");
      await reply({ 
        text: `❌ *Error crítico en el update:* ${err.message}\n\`\`\`${err.stderr?.toString()}\`\`\`` 
      });
    }
  },
};
