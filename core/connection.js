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

// ─── READLINE LIMPIO ──────────────────────────────────────
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

// ─── CREAR CONEXIÓN ───────────────────────────────────────
export async function createConnection({
  sessionDir = config.sessionDir,
  botLabel = "MAIN",
  isSubbot = false,
  phoneNumber = null,
} = {}) {
  await mkdir(sessionDir, { recursive: true });

  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
  const { version } = await fetchLatestBaileysVersion();

  let useCode = false;
  let phone = phoneNumber;

  // Solo preguntar en terminal si NO es subbot iniciado automáticamente
  if (!isSubbot && !state.creds.registered) {
    const choice = await question(
      "\n  ╔══════════════════════════════════╗\n" +
      "  ║  [1] Código de emparejamiento    ║\n" +
      "  ║  [2] Código QR                   ║\n" +
      "  ╚══════════════════════════════════╝\n" +
      "  Elige (1 o 2): "
    );

    if (choice === "1") {
      useCode = true;
      phone = await question(
        "  Digita el número de teléfono (ej: 521XXXXXXXXXX): "
      );
      phone = phone.replace(/[^0-9]/g, "");
    }
  }

  const sock = makeWASocket({
    version,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" })),
    },
    printQRInTerminal: !useCode,
    logger: pino({ level: "silent" }),  // Sin spam de pino
    browser: ["Yuta Okotsu", "Chrome", "1.0.0"],
    syncFullHistory: false,
    markOnlineOnConnect: true,
    generateHighQualityLinkPreview: false,
  });

  // ─── PEDIR CÓDIGO ──────────────────────────────────────
  if (useCode && !state.creds.registered) {
    // Esperar que el socket esté listo antes de pedir código
    await new Promise((r) => setTimeout(r, 2000));
    try {
      const code = await sock.requestPairingCode(phone);
      console.log(
        `\n  ┌─────────────────────────────┐\n` +
        `  │  🔑 Tu código: ${String(code).padEnd(14)}│\n` +
        `  └─────────────────────────────┘\n`
      );
    } catch (e) {
      log.error(`Error al pedir código: ${e.message}`);
    }
  }

  // ─── EVENTOS DE CONEXIÓN ───────────────────────────────
  let reconnectCount = 0;

  sock.ev.on("connection.update", async ({ connection, lastDisconnect, qr }) => {
    if (connection === "open") {
      reconnectCount = 0;
      log.ok(`[${botLabel}] Conectado → ${sock.user?.id}`);
    }

    if (connection === "close") {
      const code = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = code !== DisconnectReason.loggedOut;

      log.warn(`[${botLabel}] Desconectado (código: ${code})`);

      if (shouldReconnect && reconnectCount < config.maxReconnectAttempts) {
        reconnectCount++;
        log.info(`[${botLabel}] Reconectando (${reconnectCount}/${config.maxReconnectAttempts})...`);
        setTimeout(() => createConnection({ sessionDir, botLabel, isSubbot, phoneNumber }), config.reconnectDelay);
      } else if (code === DisconnectReason.loggedOut) {
        log.error(`[${botLabel}] Sesión cerrada. Elimina la carpeta de sesión y reinicia.`);
      } else {
        log.error(`[${botLabel}] Máximo de reconexiones alcanzado.`);
      }
    }
  });

  sock.ev.on("creds.update", saveCreds);

  // ─── MANEJADOR DE MENSAJES ─────────────────────────────
  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;
    for (const msg of messages) {
      if (!msg.message) continue;
      await handleMessage(sock, msg).catch((e) =>
        log.error(`Error en mensaje: ${e.message}`)
      );
    }
  });

  return sock;
}