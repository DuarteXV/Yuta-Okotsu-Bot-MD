import { Worker } from "worker_threads";
import fs from "fs";
import path from "path";
import { log } from "./logger.js";
import { db } from "../database/db.js";

const SUBBOTS_DIR = "./sessions/subbots";
if (!fs.existsSync(SUBBOTS_DIR)) fs.mkdirSync(SUBBOTS_DIR, { recursive: true });

export const activeBots = new Map();
const workers = new Map();
let mainSock = null;

function limpiarMainAnterior(jidNuevoMain) {
  const todos = db.getAllBots ? db.getAllBots() : [];
  for (const bot of todos) {
    if (bot.isMain === true && bot.jid !== jidNuevoMain) {
      db.setBot(bot.jid, { ...bot, isMain: false }, true);
      log.info(`[MANAGER] Main anterior (${bot.jid}) desmarcado. Nuevo main: ${jidNuevoMain}`);
    }
  }
}

function tieneNombrePropio(datos) {
  return !!(datos?.label && !datos.label.startsWith('SUB_') && datos.label !== 'Subbot' && datos.label !== 'MAIN');
}

export function getActiveBotsSnapshot() {
  const snapshot = [];
  for (const [key, value] of activeBots.entries()) {
    snapshot.push({ id: key, ...value });
  }
  return snapshot;
}

function broadcastBotsList() {
  const snapshot = getActiveBotsSnapshot();
  for (const worker of workers.values()) {
    worker.postMessage({ type: "bots_list", data: snapshot });
  }
}

// 🛡️ Construye el objeto final a guardar para el Main, conservando
// SIEMPRE label/banner/cualquier otro dato editado previamente.
// Antes, registerMainBot pisaba el registro completo en cada arranque
// con force:true, perdiendo el nombre y banner personalizados.
function construirDatosMain(jid, labelDefault, status) {
  const existentes = db.getBot(jid);

  const labelFinal = tieneNombrePropio(existentes) ? existentes.label : labelDefault;

  return {
    ...existentes,
    label: labelFinal,
    jid,
    status,
    isMain: true
  };
}

export function registerMainBot(sock, label = "MAIN") {
  mainSock = sock;
  const rawJid = sock.user?.id || "";
  const jid = rawJid ? rawJid.split(":")[0].split("@")[0] + "@s.whatsapp.net" : "";
  const status = jid ? "online" : "connecting";

  activeBots.set("main", { label, jid, status, isMain: true });
  broadcastBotsList();

  if (jid) {
    limpiarMainAnterior(jid);
    const datosFinales = construirDatosMain(jid, label, status);
    db.setBot(jid, datosFinales, true);
    global.mainBotNum = jid.split("@")[0];
  }

  if (!jid) {
    sock.ev.on("connection.update", ({ connection }) => {
      if (connection === "open") {
        mainSock = sock;
        const currentRawJid = sock.user?.id || "";
        const currentJid = currentRawJid ? currentRawJid.split(":")[0].split("@")[0] + "@s.whatsapp.net" : "";
        if (currentJid) {
          activeBots.set("main", { label, jid: currentJid, status: "online", isMain: true });
          broadcastBotsList();
          limpiarMainAnterior(currentJid);
          const datosFinales = construirDatosMain(currentJid, label, "online");
          db.setBot(currentJid, datosFinales, true);
          global.mainBotNum = currentJid.split("@")[0];
        }
      }
    });
  }

  sock.ev.on("connection.update", ({ connection }) => {
    if (connection === "open") {
      const current = activeBots.get("main") || {};
      activeBots.set("main", { ...current, status: "online" });
      broadcastBotsList();
    }
    if (connection === "close") {
      const current = activeBots.get("main") || {};
      activeBots.set("main", { ...current, status: "offline" });
      broadcastBotsList();
    }
  });
}

export function updateBotStatus(id, data) {
  if (id !== "main" && data.jid && global.mainBotNum) {
    const dataNum = data.jid.split("@")[0];
    if (dataNum === global.mainBotNum) {
      log.warn(`[MANAGER] Subbot ${id} intentó reportar el JID del main (${dataNum}) — ignorado`);
      return;
    }
  }

  const current = activeBots.get(id) || {};
  activeBots.set(id, { ...current, ...data });
  broadcastBotsList();

  if (data.jid) {
    db.setBot(data.jid, data);
  } else {
    db.setBot(id, data);
  }
}

export function removeSubbot(id) {
  const worker = workers.get(id);
  if (worker) {
    worker.terminate();
    workers.delete(id);
  }

  const botData = activeBots.get(id);
  activeBots.delete(id);
  broadcastBotsList();

  if (botData && botData.jid) {
    db.setBot(botData.jid, { status: "offline" });
  } else {
    db.setBot(id, { status: "offline" });
  }

  const sessionDir = `${SUBBOTS_DIR}/${id}`;
  if (fs.existsSync(sessionDir)) {
    fs.rmSync(sessionDir, { recursive: true, force: true });
    log.warn(`[MANAGER] Sesión de ${id} eliminada por completo`);
  }
}

export function launchSubbot(id) {
  if (workers.has(id)) return;

  const sessionDir = path.resolve(`${SUBBOTS_DIR}/${id}`);
  if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });

  log.info(`[MANAGER] Lanzando subbot: ${id}`);

  const worker = new Worker("./core/subbotWorker.js", {
    workerData: { id, sessionDir, mainBotNum: global.mainBotNum },
  });

  workers.set(id, worker);

  worker.postMessage({ type: "bots_list", data: getActiveBotsSnapshot() });

  worker.on("message", (msg) => {
    if (msg.type === "status") {
      const subJid = msg.jid ? msg.jid.split(":")[0].split("@")[0] + "@s.whatsapp.net" : null;

      const datosExistentes = subJid ? db.getBot(subJid) : null;
      const conservarNombre = tieneNombrePropio(datosExistentes);

      updateBotStatus(id, {
        jid: subJid,
        status: msg.status,
        ...(conservarNombre ? {} : { label: id.toUpperCase() }),
        isMain: false
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
    if (fs.existsSync(path.join(sessionDir2, "auth.db"))) {
      log.info(`[MANAGER] Reconectando subbot ${id} en 5s...`);
      setTimeout(() => launchSubbot(id), 5000);
    } else {
      const botData = activeBots.get(id);
      activeBots.delete(id);
      broadcastBotsList();
      if (botData && botData.jid) {
        db.setBot(botData.jid, { status: "offline" });
      } else {
        db.setBot(id, { status: "offline" });
      }
    }
  });

  worker.on("error", (err) => {
    log.error(`[MANAGER] Worker ${id} error: ${err.message}`);
  });
}

export async function requestSubbotCode(id, phoneNumber, sock, from) {
  const sessionDir = path.resolve(`${SUBBOTS_DIR}/${id}`);
  if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });

  return new Promise((resolve, reject) => {
    if (workers.has(id)) {
      workers.get(id).terminate();
      workers.delete(id);
    }

    const worker = new Worker("./core/subbotWorker.js", {
      workerData: { id, sessionDir, phoneNumber, mainBotNum: global.mainBotNum },
    });

    workers.set(id, worker);
    worker.postMessage({ type: "bots_list", data: getActiveBotsSnapshot() });

    const timeout = setTimeout(() => {
      reject(new Error("Timeout esperando código"));
    }, 15000);

    const cleanupTimeout = setTimeout(() => {
      const bot = db.getBot(id);
      if (!bot || bot.status !== "online") {
        log.warn(`[MANAGER] Subbot ${id} nunca se conectó — eliminado`);
        removeSubbot(id);
      }
    }, 2 * 60 * 1000);

    worker.on("message", (msg) => {
      if (msg.type === "code") {
        clearTimeout(timeout);
        resolve(msg.code);
      }

      if (msg.type === "status") {
        const subJid = msg.jid ? msg.jid.split(":")[0].split("@")[0] + "@s.whatsapp.net" : null;

        const datosExistentes = subJid ? db.getBot(subJid) : null;
        const conservarNombre = tieneNombrePropio(datosExistentes);

        updateBotStatus(id, {
          jid: subJid,
          status: msg.status,
          ...(conservarNombre ? {} : { label: id.toUpperCase() }),
          isMain: false
        });

        if (msg.status === "online") {
          clearTimeout(cleanupTimeout);
          const userNum = id.replace("sub_", "");
          const userJid = subJid || `${userNum}@s.whatsapp.net`;
          sock.sendMessage(userJid, {
            text: "📍 *Has vinculado un subbot con éxito*\n" +
              "> • Puedes usar *.delbot* para desvincularlo cuando quieras."
          }).catch(e => log.error(`[MANAGER] Error enviando mensaje de éxito: ${e.message}`));
        }
      }

      if (msg.type === "logged_out") {
        clearTimeout(cleanupTimeout);
        removeSubbot(id);
      }
    });

    worker.on("exit", (code) => {
      workers.delete(id);
      clearTimeout(timeout);

      const sessionDir2 = `${SUBBOTS_DIR}/${id}`;
      if (fs.existsSync(path.join(sessionDir2, "auth.db"))) {
        setTimeout(() => launchSubbot(id), 5000);
      } else {
        const botData = activeBots.get(id);
        activeBots.delete(id);
        broadcastBotsList();
        if (botData && botData.jid) {
          db.setBot(botData.jid, { status: "offline" });
        } else {
          db.setBot(id, { status: "offline" });
        }
      }
    });

    worker.on("error", (err) => {
      clearTimeout(timeout);
      clearTimeout(cleanupTimeout);
      reject(err);
    });
  });
}

export function launchAllSubbots() {
  if (!fs.existsSync(SUBBOTS_DIR)) return;

  const dirs = fs.readdirSync(SUBBOTS_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);

  if (dirs.length === 0) return;

  log.info(`[MANAGER] Relanzando ${dirs.length} subbot(s)...`);
  for (const id of dirs) launchSubbot(id);
}