import os from "os";
import process from "process";
import fs from "fs";
import { db } from "../../database/db.js";
import config from "../../config.js";

function formatBytes(bytes) {
  if (!bytes || isNaN(bytes) || bytes === Infinity) return "0.00";
  return (bytes / 1024 / 1024 / 1024).toFixed(2);
}

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  return `${h}h ${m}m ${s}s`;
}

function getMemoryInfo() {
  try {
    if (fs.existsSync("/sys/fs/cgroup/memory.max") && fs.existsSync("/sys/fs/cgroup/memory.current")) {
      let total = fs.readFileSync("/sys/fs/cgroup/memory.max", "utf8").trim();
      let used = fs.readFileSync("/sys/fs/cgroup/memory.current", "utf8").trim();

      if (total !== "max" && !isNaN(Number(total)) && Number(total) > 0) {
        return { total: Number(total), used: Number(used) };
      }
    }

    if (fs.existsSync("/sys/fs/cgroup/memory/memory.limit_in_bytes")) {
      const total = fs.readFileSync("/sys/fs/cgroup/memory/memory.limit_in_bytes", "utf8").trim();
      const used = fs.readFileSync("/sys/fs/cgroup/memory/memory.usage_in_bytes", "utf8").trim();

      if (!isNaN(Number(total)) && Number(total) < 9223372036854771712 && Number(total) > 0) {
        return { total: Number(total), used: Number(used) };
      }
    }
  } catch (e) {
    // Silenciar errores de lectura de archivos de sistema
  }

  const total = os.totalmem();
  const used = total - os.freemem();
  return { total, used };
}

export default {
  name: ["system", "sys", "stats"],
  description: "Muestra información real del sistema",
  category: "info",
  ownerOnly: false,

  async run({ sock, from, react, msg }) {
    try {
      if (react && typeof react === "function") {
        await react("⏳").catch(() => {});
      } else if (sock?.sendMessage) {
        await sock.sendMessage(from, { react: { text: "⏳", key: msg.key } }).catch(() => {});
      }

      // 🤖 Obtener el JID de la sesión actual de forma segura
      const currentBotNum = sock?.user?.id
        ? sock.user.id.split('@')[0].split(':')[0].replace(/\D/g, '')
        : null;
      const botJid = currentBotNum ? `${currentBotNum}@s.whatsapp.net` : null;

      // 🏷️ Misma regla que usan menu.js / bots.js: si el bot tiene un
      // label personalizado (editado con .setname), se respeta; si sigue
      // con el genérico (SUB_xxx, "Subbot", "MAIN" o sin label), se usa
      // config.botName.
      let currentBotName = config.botName || "YUTA OKOTSU";
      try {
        if (botJid && db && typeof db.getBot === "function") {
          const botData = db.getBot(botJid) || {};
          const esLabelAutomatico =
            botData.label?.startsWith('SUB_') ||
            botData.label === 'Subbot' ||
            botData.label === 'MAIN';

          currentBotName = (esLabelAutomatico || !botData.label)
            ? (config.botName || "YUTA OKOTSU")
            : botData.label;
        }
      } catch {
        currentBotName = config.botName || "YUTA OKOTSU";
      }

      currentBotName = currentBotName.toUpperCase();

      const memory = getMemoryInfo();
      const ramTotal = memory.total;
      const ramUsed = memory.used;
      const ramFree = ramTotal - ramUsed;
      const ramBot = process.memoryUsage().rss;

      const ramPercent = ramTotal > 0 ? ((ramUsed / ramTotal) * 100).toFixed(1) : "0.0";

      const cpus = os.cpus();
      const cpuModel = cpus && cpus[0]?.model ? cpus[0].model.trim() : "Desconocido";

      let cpuCores = 1;
      try {
        cpuCores = typeof os.availableParallelism === "function"
          ? os.availableParallelism()
          : (cpus ? cpus.length : 1);
      } catch {
        cpuCores = cpus ? cpus.length : 1;
      }

      const uptimeBot = process.uptime();
      const nodeVersion = process.version;
      const platform = os.platform();
      const arch = os.arch();

      let text = "";
      text += `官 ════ 『 *${currentBotName}* 』 ════ 官\n`;
      text += `✦ _Sistema del Hechicero de Grado Especial_\n\n`;

      text += `⚔️ ─── ❖ *CPU* ❖ ─── ⚔️\n`;
      text += `  ✦ *Modelo:* ${cpuModel}\n`;
      text += `  官 *Núcleos:* ${cpuCores}\n`;
      text += `  ✦ *Plataforma:* ${platform} (${arch})\n\n`;

      text += `🧠 ─── ❖ *MEMORIA RAM* ❖ ─── 🧠\n`;
      text += `  ✦ *Total:* ${formatBytes(ramTotal)} GB\n`;
      text += `  官 *Usada:* ${formatBytes(ramUsed)} GB (${ramPercent}%)\n`;
      text += `  ✦ *Libre:* ${formatBytes(ramFree)} GB\n`;
      text += `  官 *Bot usa:* ${formatBytes(ramBot)} GB\n\n`;

      text += `⏳ ─── ❖ *UPTIME* ❖ ─── ⏳\n`;
      text += `  ✦ *Bot activo:* ${formatTime(uptimeBot)}\n\n`;

      text += `🜲 ─── ❖ *ENTORNO* ❖ ─── 🜲\n`;
      text += `  ✦ *Node.js:* ${nodeVersion}\n`;
      text += `  官 *PID:* ${process.pid}\n\n`;

      text += `> 官 _Powered by DuarteXV | ${currentBotName} MD_ 官`;

      await sock.sendMessage(from, { text }, { quoted: msg });

      if (react && typeof react === "function") await react("✅").catch(() => {});

    } catch (error) {
      console.error("Error crítico en system:", error);

      try {
        if (react && typeof react === "function") await react("❌").catch(() => {});
        await sock.sendMessage(from, {
          text: "官 Ocurrió un error interno obteniendo el sistema."
        }, { quoted: msg });
      } catch (e) {
        console.error("No se pudo enviar el mensaje de error:", e);
      }
    }
  }
};