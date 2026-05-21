import { execSync } from "child_process";
import { loadPlugins } from "../../core/pluginLoader.js";

export default {
  name: ["update", "actualizar", "gitpull"],
  description: "Fuerza la actualización desde GitHub y recarga plugins",
  ownerOnly: true,

  async run({ reply, react }) {
    try {
      await react("🔄");

      execSync("git fetch --all");

      const localSha = execSync("git rev-parse HEAD").toString().trim();
      const remoteSha = execSync("git rev-parse origin/main").toString().trim();

      if (localSha === remoteSha) {
        await react("✅");
        return await reply({ text: "✅ *Ya está todo actualizado.*" });
      }

      const stdout = execSync("git reset --hard origin/main").toString();
      
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
