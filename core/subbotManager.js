import { Worker } from "worker_threads";
import fs from "fs";
import path from "path";
import { log } from "./logger.js";

const SUBBOTS_DIR = "./sessions/subbots";
if (!fs.existsSync(SUBBOTS_DIR)) fs.mkdirSync(SUBBOTS_DIR, { recursive: true });

// ─── REGISTRO GLOBAL DE SOCKETS ACTIVOS ─────────────────
export const activeBots = new Map();
// { id: { label, jid, worker, status } }

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

// ─── LANZAR SUBBOT COMO WORKER ───────────────────────────
export function launchSubbot(id) {
  if (workers.has(id)) return;

  const sessionDir = path.resolve(`${SUBBOTS_DIR}/${id}`);
  if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });

  log.info(`[MANAGER] Lanzando subbot: ${id}`);

  const worker = new Worker("./core/subbotWorker.js", {
    workerData: { id, sessionDir },
  });

  workers.set(id, worker);
  activeBots.set(id, { label: id.toUpperCase(), jid: "Conectando...", status: "connecting" });

  worker.on("message", (msg) => {
    if (msg.type === "status") {
      updateBotStatus(id, { jid: msg.jid, status: msg.status, label: id.toUpperCase() });
    }
    if (msg.type === "logged_out") {
      log.warn(`[MANAGER] Subbot ${id} cerró sesión — eliminando...`);
      removeSubbot(id);
    }
  });

  worker.on("exit", (code) => {
    workers.delete(id);
    activeBots.set(id, { label: id.toUpperCase(), jid: "Desconectado", status: "offline" });
    log.warn(`[MANAGER] Worker ${id} salió (code: ${code})`);

    // Reconectar si la sesión sigue existiendo
    if (fs.existsSync(path.join(sessionDir, "creds.json"))) {
      log.info(`[MANAGER] Reconectando subbot ${id} en 5s...`);
      setTimeout(() => launchSubbot(id), 5000);
    }
  });

  worker.on("error", (err) => {
    log.error(`[MANAGER] Worker ${id} error: ${err.message}`);
  });
}

// ─── ELIMINAR SUBBOT ─────────────────────────────────────
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

// ─── LANZAR TODOS LOS SUBBOTS EXISTENTES ─────────────────
export function launchAllSubbots() {
  if (!fs.existsSync(SUBBOTS_DIR)) return;
  const dirs = fs.readdirSync(SUBBOTS_DIR, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .map(e => e.name);

  if (dirs.length === 0) return;
  log.info(`[MANAGER] Relanzando ${dirs.length} subbot(s)...`);
  for (const id of dirs) launchSubbot(id);
}

// ─── PEDIR CÓDIGO PARA NUEVO SUBBOT ─────────────────────
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
    activeBots.set(id, { label: id.toUpperCase(), jid: "Conectando...", status: "connecting" });

    const timeout = setTimeout(() => {
      reject(new Error("Timeout esperando código"))
    }, 15000)

    worker.on("message", (msg) => {
      if (msg.type === "code") {
        clearTimeout(timeout)
        resolve(msg.code)
      }
      if (msg.type === "status") {
        updateBotStatus(id, { jid: msg.jid, status: msg.status })
      }
      if (msg.type === "logged_out") {
        removeSubbot(id)
      }
    })

    worker.on("exit", (code) => {
      workers.delete(id)
      clearTimeout(timeout)
      if (fs.existsSync(path.join(sessionDir, "creds.json"))) {
        setTimeout(() => launchSubbot(id), 5000)
      }
    })

    worker.on("error", (err) => {
      clearTimeout(timeout)
      reject(err)
    })
  })
}