import { workerData, parentPort } from "worker_threads";
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  makeCacheableSignalKeyStore,
  fetchLatestBaileysVersion,
} from "@whiskeysockets/baileys";
import pino from "pino";
import { mkdir } from "fs/promises";
import { handleMessage } from "./messageHandler.js";
import { loadPlugins } from "./pluginLoader.js";

const { id, sessionDir, phoneNumber } = workerData;
const logger = pino({ level: "silent" });

let pluginsLoaded = false;

async function startWorker(_attempt = 0) {
  await mkdir(sessionDir, { recursive: true });

  if (!pluginsLoaded) {
    await loadPlugins();
    pluginsLoaded = true;
  }

  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
  const { version } = await fetchLatestBaileysVersion();

  const useCode = !!phoneNumber && !state.creds.registered;

  let sock;
  let connected = false;
  let pendingMessages = [];

  async function flushPending() {
    const queue = pendingMessages.splice(0);
    for (const msg of queue) {
      handleMessage(sock, msg, id.toUpperCase()).catch(() => {});
    }
  }

  try {
    sock = makeWASocket({
      version,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, logger),
      },
      printQRInTerminal: false,
      logger,
      browser: ["Ubuntu", "Chrome", "20.0.04"],
      syncFullHistory: false,
      markOnlineOnConnect: false,
      generateHighQualityLinkPreview: false,
      connectTimeoutMs: 60000,
      keepAliveIntervalMs: 25000,
      retryRequestDelayMs: 3000,
      defaultQueryTimeoutMs: 60000,
    });
  } catch (e) {
    parentPort?.postMessage({ type: "error", message: e.message });
    if (_attempt < 10) setTimeout(() => startWorker(_attempt + 1), 5000);
    return;
  }

  // ─── PEDIR CÓDIGO ──────────────────────────────────────
  if (useCode) {
    await new Promise(r => setTimeout(r, 3000));
    try {
      let code = await sock.requestPairingCode(phoneNumber.replace(/\D/g, ""));
      code = code?.match(/.{1,4}/g)?.join("-") || code;
      parentPort.postMessage({ type: "code", code });
    } catch (e) {
      parentPort.postMessage({ type: "error", message: e.message });
    }
  }

  sock.ev.on("connection.update", async ({ connection, lastDisconnect }) => {
    if (connection === "open") {
      connected = true;
      parentPort.postMessage({
        type: "status",
        status: "online",
        jid: sock.user?.id || "",
      });
      await flushPending();
    }

    if (connection === "close") {
      connected = false;
      const statusCode = lastDisconnect?.error?.output?.statusCode;

      parentPort.postMessage({ type: "status", status: "offline", jid: "" });

      if (statusCode === DisconnectReason.loggedOut) {
        parentPort.postMessage({ type: "logged_out" });
        process.exit(0);
        return;
      }

      if (statusCode === DisconnectReason.connectionReplaced) {
        process.exit(0);
        return;
      }

      setTimeout(() => startWorker(_attempt + 1), 5000);
    }
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;
    for (const msg of messages) {
      if (!msg.message) continue;
      if (msg.key?.remoteJid === "status@broadcast") continue;
      if (!connected) {
        pendingMessages.push(msg);
        return;
      }
      handleMessage(sock, msg, id.toUpperCase()).catch(() => {});
    }
  });
}

startWorker().catch((e) => {
  parentPort?.postMessage({ type: "error", message: e.message });
  process.exit(1);
});
