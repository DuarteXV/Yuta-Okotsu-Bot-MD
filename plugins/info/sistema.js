import os from "os";
import process from "process";
import fs from "fs";

function formatBytes(bytes) {
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
    // Docker / Pterodactyl (cgroup v2)
    const total = fs.readFileSync(
      "/sys/fs/cgroup/memory.max",
      "utf8"
    ).trim();

    const used = fs.readFileSync(
      "/sys/fs/cgroup/memory.current",
      "utf8"
    ).trim();

    return {
      total: Number(total),
      used: Number(used)
    };

  } catch {
    try {
      // cgroup v1
      const total = fs.readFileSync(
        "/sys/fs/cgroup/memory/memory.limit_in_bytes",
        "utf8"
      ).trim();

      const used = fs.readFileSync(
        "/sys/fs/cgroup/memory/memory.usage_in_bytes",
        "utf8"
      ).trim();

      return {
        total: Number(total),
        used: Number(used)
      };

    } catch {
      // fallback
      const total = os.totalmem();
      const used = total - os.freemem();

      return { total, used };
    }
  }
}

function getDiskInfo() {
  try {
    // Disco REAL del contenedor
    const stat = fs.statfsSync("/home/container");

    const total = stat.blocks * stat.bsize;
    const free = stat.bavail * stat.bsize;
    const used = total - free;

    return {
      total,
      free,
      used
    };

  } catch {
    return null;
  }
}

export default {
  name: ["system", "sys", "stats"],
  description: "Muestra información real del sistema",
  category: "info",
  ownerOnly: false,

  async run({ sock, from, react, msg }) {
    try {
      await react("⛧");

      const memory = getMemoryInfo();

      const ramTotal = memory.total;
      const ramUsed = memory.used;
      const ramFree = ramTotal - ramUsed;

      const ramBot = process.memoryUsage().rss;

      const ramPercent = (
        (ramUsed / ramTotal) * 100
      ).toFixed(1);

      const disk = getDiskInfo();

      const cpus = os.cpus();

      const cpuModel =
        cpus[0]?.model?.trim() || "Desconocido";

      const cpuCores =
        os.availableParallelism
          ? os.availableParallelism()
          : cpus.length;

      const uptimeBot = process.uptime();

      const nodeVersion = process.version;

      const platform = os.platform();
      const arch = os.arch();

      let text = "";

      text += `⛧ ════ 『 *YUTA OKOTSU* 』 ════ ⛧\n`;
      text += `✦ _Sistema del Hechicero de Grado Especial_\n\n`;

      text += `⚔️ ─── ❖ *CPU* ❖ ─── ⚔️\n`;
      text += `  ✦ *Modelo:* ${cpuModel}\n`;
      text += `  ⛧ *Núcleos:* ${cpuCores}\n`;
      text += `  ✦ *Plataforma:* ${platform} (${arch})\n\n`;

      text += `🧠 ─── ❖ *MEMORIA RAM* ❖ ─── 🧠\n`;
      text += `  ✦ *Total:* ${formatBytes(ramTotal)} GB\n`;
      text += `  ⛧ *Usada:* ${formatBytes(ramUsed)} GB (${ramPercent}%)\n`;
      text += `  ✦ *Libre:* ${formatBytes(ramFree)} GB\n`;
      text += `  ⛧ *Bot usa:* ${formatBytes(ramBot)} GB\n\n`;

      if (disk) {
        text += `💾 ─── ❖ *DISCO* ❖ ─── 💾\n`;
        text += `  ✦ *Total:* ${formatBytes(disk.total)} GB\n`;
        text += `  ⛧ *Usado:* ${formatBytes(disk.used)} GB\n`;
        text += `  ✦ *Libre:* ${formatBytes(disk.free)} GB\n\n`;
      }

      text += `⏳ ─── ❖ *UPTIME* ❖ ─── ⏳\n`;
      text += `  ✦ *Bot activo:* ${formatTime(uptimeBot)}\n\n`;

      text += `🜲 ─── ❖ *ENTORNO* ❖ ─── 🜲\n`;
      text += `  ✦ *Node.js:* ${nodeVersion}\n`;
      text += `  ⛧ *PID:* ${process.pid}\n\n`;

      text += `> ⛧ _Powered by DuarteXV | Yuta Okotsu MD_ ⛧`;

      await sock.sendMessage(
        from,
        { text },
        { quoted: msg }
      );

    } catch (error) {
      console.error("Error en system:", error);

      await sock.sendMessage(
        from,
        {
          text: "⛧ Ocurrió un error obteniendo el sistema."
        },
        { quoted: msg }
      );
    }
  }
};