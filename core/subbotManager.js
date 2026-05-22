import { Worker } from "worker_threads";
import fs from "fs";
import path from "path";
import { log } from "./logger.js";

const SUBBOTS_DIR = "./sessions/subbots";
if (!fs.existsSync(SUBBOTS_DIR)) fs.mkdirSync(SUBBOTS_DIR, { recursive: true });

export const activeBots = new Map();
const workers = new Map();

export function registerMainBot(sock, label = "MAIN") {
  activeBots.set("main", {
    label,
    jid: sock.user?.id || "Conectando...",
    status: "online",
    isMain: true,
  });
}

export function updateBotStatus(id, data) {
  const current = activeBots.get(id) || {};
  activeBots.set(id, { ...current, ...data });
}

export function removeSubbot(id) {
  const worker = workers.get(id);
  if (worker) {
    worker.terminate();
    workers.delete(id);
  }
  activeBots.delete(id);

  const sessionDir = `${SUBBOTS_DIR}/${id}`;
  if (fs.existsSync(sessionDir)) {
    fs.rmSync(sessionDir, { recursive: true, force: true });
    log.warn(`[MANAGER] Sesión de ${id} eliminada`);
  }
}

export function launchSubbot(id) {
  if (workers.has(id)) return;

  const sessionDir = path.resolve(`${SUBBOTS_DIR}/${id}`);
  if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });

  log.info(`[MANAGER] Lanzando subbot: ${id}`);

  const worker = new Worker("./core/subbotWorker.js", {
    workerData: { id, sessionDir },
  });

  workers.set(id, worker);

  worker.on("message", (msg) => {
    if (msg.type === "status") {
      updateBotStatus(id, {
        jid: msg.jid,
        status: msg.status,
        label: id.toUpperCase(),
      });
    }
    if (msg.type === "logged_out") {
      log.warn(`[MANAGER] Subbot ${id} cerró sesión — eliminando...`);
      removeSubbot(id);
    }
  });

  worker.on("exit", (code) => {
    workers.delete(id);
    log.warn(`[MANAGER] Worker ${id} salió (code: ${code})`);

    const sessionDir2 = `${SUBBOTS_DIR}/${id}`;
    if (fs.existsSync(path.join(sessionDir2, "creds.json"))) {
      log.info(`[MANAGER] Reconectando subbot ${id} en 5s...`);
      setTimeout(() => launchSubbot(id), 5000);
    } else {
      activeBots.delete(id);
    }
  });

  worker.on("error", (err) => {
    log.error(`[MANAGER] Worker ${id} error: ${err.message}`);
  });
}

export async function requestSubbotCode(id, phoneNumber) {
  const sessionDir = path.resolve(`${SUBBOTS_DIR}/${id}`);
  if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });

  return new Promise((resolve, reject) => {
    if (workers.has(id)) {
      workers.get(id).terminate();
      workers.delete(id);
    }

    const worker = new Worker("./core/subbotWorker.js", {
      workerData: { id, sessionDir, phoneNumber },
    });

    workers.set(id, worker);

    const timeout = setTimeout(() => {
      reject(new Error("Timeout esperando código"))
    }, 15000)

    // Limpiar si nunca se conecta en 2 minutos
    const cleanupTimeout = setTimeout(() => {
      const bot = activeBots.get(id)
      if (!bot || bot.status !== "online") {
        log.warn(`[MANAGER] Subbot ${id} nunca se conectó — eliminado`)
        removeSubbot(id)
      }
    }, 2 * 60 * 1000)

    worker.on("message", (msg) => {
      if (msg.type === "code") {
        clearTimeout(timeout)
        resolve(msg.code)
      }
      if (msg.type === "status") {
        updateBotStatus(id, {
          jid: msg.jid,
          status: msg.status,
          label: id.toUpperCase(),
        })
        if (msg.status === "online") {
          clearTimeout(cleanupTimeout)
        }
      }
      if (msg.type === "logged_out") {
        clearTimeout(cleanupTimeout)
        removeSubbot(id)
      }
    })

    worker.on("exit", (code) => {
      workers.delete(id)
      clearTimeout(timeout)
      const sessionDir2 = `${SUBBOTS_DIR}/${id}`
      if (fs.existsSync(path.join(sessionDir2, "creds.json"))) {
        setTimeout(() => launchSubbot(id), 5000)
      } else {
        activeBots.delete(id)
      }
    })

    worker.on("error", (err) => {
      clearTimeout(timeout)
      clearTimeout(cleanupTimeout)
      reject(err)
    })
  })
}

export function launchAllSubbots() {
  if (!fs.existsSync(SUBBOTS_DIR)) return;
  const dirs = fs.readdirSync(SUBBOTS_DIR, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .map(e => e.name);

  if (dirs.length === 0) return;
  log.info(`[MANAGER] Relanzando ${dirs.length} subbot(s)...`);
  for (const id of dirs) launchSubbot(id);
}