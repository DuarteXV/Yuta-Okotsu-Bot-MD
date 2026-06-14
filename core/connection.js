import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  makeCacheableSignalKeyStore,
  fetchLatestBaileysVersion,
} from "@whiskeysockets/baileys";
import pino from "pino";
import { mkdir } from "fs/promises";
import path from "path";
import readline from "readline";
import { log } from "./logger.js";
import config from "../config.js";
import { handleMessage } from "./messageHandler.js";

function question(prompt) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(prompt, (ans) => {
      rl.close();
      resolve(ans.trim());
    });
  });
}

async function clearSocketFiles(sessionDir) {
  try {
    const { readdirSync, unlinkSync } = await import("fs");
    const files = readdirSync(sessionDir);
    let count = 0;
    for (const file of files) {
      if (
        file.startsWith("pre-key-") ||
        file.startsWith("sender-key-") ||
        file.startsWith("session-") ||
        file.startsWith("app-state-sync-") ||
        file === "baileys_store.json"
      ) {
        unlinkSync(path.join(sessionDir, file));
        count++;
      }
    }
    if (count > 0) {
      log.warn(`🗑️ Limpiados ${count} archivos de socket en [${path.basename(sessionDir)}]`);
    }
  } catch (e) {}
}

export async function createConnection({
  sessionDir = config.sessionDir,
  botLabel = "MAIN",
  isSubbot = false,
  phoneNumber = null,
  _attempt = 0,
} = {}) {
  await mkdir(sessionDir, { recursive: true });

  if (_attempt > 0) {
    log.warn(`[${botLabel}] Limpiando carpeta de sockets antes de reconectar...`);
    await clearSocketFiles(sessionDir);
    const delay = Math.min(config.reconnectDelay * _attempt, 30000);
    log.info(`[${botLabel}] Esperando ${delay / 1000}s para reconectar...`);
    await new Promise((r) => setTimeout(r, delay));
  }

  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
  const { version } = await fetchLatestBaileysVersion();

  let useCode = false;
  let phone = phoneNumber;

  if (!isSubbot && !state.creds.registered && _attempt === 0) {
    const choice = await question(
      "\n  ╔══════════════════════════════════╗\n" +
      "  ║  [1] Código de emparejamiento    ║\n" +
      "  ║  [2] Código QR                   ║\n" +
      "  ╚══════════════════════════════════╝\n" +
      "  Elige (1 o 2): "
    );

    if (choice === "1") {
      useCode = true;
      let rawPhone = await question(
        "  Digita el número de teléfono (ej: 521XXXXXXXXXX): "
      );
      rawPhone = rawPhone.replace(/\D/g, "");
      if (!rawPhone.startsWith("+")) rawPhone = `+${rawPhone}`;
      if (rawPhone.startsWith("+521")) {
        rawPhone = rawPhone.replace("+521", "+52");
      } else if (rawPhone.startsWith("+52") && rawPhone[4] === "1") {
        rawPhone = rawPhone.replace("+52 1", "+52");
      }
      phone = rawPhone.replace(/\D/g, "");
    }
  }

  let sock;
  let connectionTimeout;
  let connected = false;

  function clearConnTimeout() {
    if (connectionTimeout) {
      clearTimeout(connectionTimeout);
      connectionTimeout = null;
    }
  }

  try {
    sock = makeWASocket({
      version,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" })),
      },
      printQRInTerminal: !useCode,
      logger: pino({ level: "silent" }),
      browser: ["Ubuntu", "Chrome", "20.0.04"],
      syncFullHistory: false,
      markOnlineOnConnect: false,
      generateHighQualityLinkPreview: true,
      emitOwnEvents: false,
      fireInitQueries: false,
      connectTimeoutMs: 60000,
      keepAliveIntervalMs: 25000,
      retryRequestDelayMs: 3000,
      defaultQueryTimeoutMs: 60000,
    });
  } catch (e) {
    log.error(`[${botLabel}] Error al crear socket: ${e.message}`);
    if (_attempt < config.maxReconnectAttempts) {
      return createConnection({ sessionDir, botLabel, isSubbot, phoneNumber, _attempt: _attempt + 1 });
    }
    return;
  }

  if (useCode && !state.creds.registered) {
    await new Promise((r) => setTimeout(r, 3000));
    try {
      let code = await sock.requestPairingCode(phone, "GITHUBUG");
      code = code?.match(/.{1,4}/g)?.join("-") || code;
      console.log(
        `\n  ┌─────────────────────────────┐\n` +
        `  │  🔑 Tu código: ${String(code).padEnd(14)}│\n` +
        `  └─────────────────────────────┘\n`
      );
    } catch (e) {
      log.error(`[${botLabel}] Error al pedir código: ${e.message}`);
    }
  }

  connectionTimeout = setTimeout(() => {
    if (!connected) {
      log.warn(`[${botLabel}] Timeout de conexión alcanzado, reconectando...`);
      try { sock.end(new Error("timeout")); } catch {}
    }
  }, 75000);

  sock.ev.on("connection.update", async ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      log.info(`[${botLabel}] QR listo para escanear`);
    }

    if (connection === "connecting") {
      log.conn(`[${botLabel}] Conectando...`);
    }

    if (connection === "open") {
      clearConnTimeout();
      connected = true;
      log.ok(`[${botLabel}] ✅ Conectado → ${sock.user?.id}`);
    }

    if (connection === "close") {
      clearConnTimeout();
      connected = false;

      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const errorMsg   = lastDisconnect?.error?.message || "Desconocido";

      log.warn(`[${botLabel}] ❌ Conexión cerrada → código: ${statusCode} | ${errorMsg}`);

      if (statusCode === DisconnectReason.loggedOut) {
        log.error(`[${botLabel}] Sesión cerrada (loggedOut). Elimina la carpeta "${path.basename(sessionDir)}" y reinicia.`);
        return;
      }

      if (statusCode === DisconnectReason.connectionReplaced) {
        log.error(`[${botLabel}] Sesión reemplazada por otra instancia. Cerrando.`);
        return;
      }

      if (statusCode === DisconnectReason.badSession) {
        log.error(`[${botLabel}] Sesión corrupta. Limpiando y reconectando...`);
        await clearSocketFiles(sessionDir);
      }

      if (_attempt < config.maxReconnectAttempts) {
        log.info(`[${botLabel}] Reconectando (intento ${_attempt + 1}/${config.maxReconnectAttempts})...`);
        createConnection({ sessionDir, botLabel, isSubbot, phoneNumber, _attempt: _attempt + 1 });
      } else {
        log.error(`[${botLabel}] Se agotaron los intentos de reconexión.`);
      }
    }
  });

  sock.ev.on("CB:stream:error", (err) => {
    log.error(`[${botLabel}] Stream error: ${err?.message || err}`);
  });

  sock.ws?.on?.("error", (err) => {
    log.error(`[${botLabel}] WS error: ${err?.message || err}`);
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;
    for (const msg of messages) {
      if (!msg.message) continue;
      if (msg.key?.remoteJid === "status@broadcast") continue;
      handleMessage(sock, msg, botLabel).catch((e) =>
        log.error(`[${botLabel}] Error en mensaje: ${e.message}`)
      );
    }
  });

  return sock;
}
