export default {
  // ─── BOT INFO ───────────────────────────────────────────
  botName: "Yuta Okotsu",
  prefix: ".",           // Cambia a lo que quieras: !, /, #, etc.
  
  // ─── OWNER ──────────────────────────────────────────────
  ownerNumber: ["573135180876"],  // Tu número con código de país, sin +
  coOwners: [],

  // ─── SESIONES ───────────────────────────────────────────
  sessionDir: "./sessions/main",

  // ─── COMPORTAMIENTO ─────────────────────────────────────
  readMessages: true,        // Marcar mensajes como leídos
  autoReconnect: true,
  maxReconnectAttempts: 10,
  reconnectDelay: 5000,      // ms entre reconexiones

  // ─── LOGS ───────────────────────────────────────────────
  logLevel: "info",          // silent | info | debug
};