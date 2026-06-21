import Database from "better-sqlite3";
import { mkdirSync } from "fs";
import config from "../config.js"; // Asegúrate de que la ruta hacia tu config.js sea la correcta

mkdirSync("./database", { recursive: true });

const db_instance = new Database("./database/yuta.sqlite");
db_instance.pragma("journal_mode = WAL");
db_instance.pragma("synchronous = NORMAL");
db_instance.pragma("wal_autocheckpoint = 1");

// Creamos las tablas usando el principio dinámico JSON
db_instance.exec(`
  CREATE TABLE IF NOT EXISTS users (
    jid TEXT PRIMARY KEY,
    data TEXT DEFAULT '{}'
  );
  CREATE TABLE IF NOT EXISTS groups (
    jid TEXT PRIMARY KEY,
    data TEXT DEFAULT '{}'
  );
  CREATE TABLE IF NOT EXISTS bots (
    jid TEXT PRIMARY KEY,
    data TEXT DEFAULT '{}'
  );
`);

const hierarchy = ["user", "premium", "mod", "coowner", "owner"];

const stmts = {
  getUser: db_instance.prepare("SELECT data FROM users WHERE jid = ?"),
  insertUser: db_instance.prepare("INSERT INTO users (jid, data) VALUES (?, ?)"),
  updateUser: db_instance.prepare("UPDATE users SET data = ? WHERE jid = ?"),

  getGroup: db_instance.prepare("SELECT data FROM groups WHERE jid = ?"),
  insertGroup: db_instance.prepare("INSERT INTO groups (jid, data) VALUES (?, ?)"),
  updateGroup: db_instance.prepare("UPDATE groups SET data = ? WHERE jid = ?"),

  // Consultas preparadas para la gestión de bots
  getBot: db_instance.prepare("SELECT data FROM bots WHERE jid = ?"),
  insertBot: db_instance.prepare("INSERT INTO bots (jid, data) VALUES (?, ?)"),
  updateBot: db_instance.prepare("UPDATE bots SET data = ? WHERE jid = ?"),
  getAllBots: db_instance.prepare("SELECT jid, data FROM bots")
};

function getUser(jid) {
  const row = stmts.getUser.get(jid);
  if (!row) {
    const defaultUser = {
      role: "user",
      banned: false,
      registeredAt: new Date().toISOString()
    };
    stmts.insertUser.run(jid, JSON.stringify(defaultUser));
    return defaultUser;
  }
  return JSON.parse(row.data);
}

function getGroup(jid) {
  const row = stmts.getGroup.get(jid);
  if (!row) {
    const defaultGroup = {
      welcome: false,
      antilink: false,
      primaryBot: null
    };
    stmts.insertGroup.run(jid, JSON.stringify(defaultGroup));
    return defaultGroup;
  }
  return JSON.parse(row.data);
}

// Obtener un bot de forma dinámica
function getBot(jid) {
  const row = stmts.getBot.get(jid);
  if (!row) {
    const defaultBot = {
      label: "Subbot",
      isMain: false,
      status: "offline"
    };
    stmts.insertBot.run(jid, JSON.stringify(defaultBot));
    return defaultBot;
  }
  return JSON.parse(row.data);
}

export const db = {
  getUser,
  getGroup,
  getBot,

  setUser(jid, dataObject) {
    const currentData = getUser(jid);
    const updatedData = { ...currentData, ...dataObject };
    stmts.updateUser.run(JSON.stringify(updatedData), jid);
  },

  setGroup(jid, dataObject) {
    const currentData = getGroup(jid);
    const updatedData = { ...currentData, ...dataObject };
    stmts.updateGroup.run(JSON.stringify(updatedData), jid);
  },

  // 🤖 Guarda o actualiza cualquier propiedad de cualquier bot en tiempo real
  // 🛡️ Protección: nadie puede "bajar" al main (isMain: true -> false) salvo que sea forzado.
  //    Esto evita que un subbot con un JID coincidente corrompa el registro del bot principal.
  setBot(jid, dataObject, force = false) {
    const currentData = getBot(jid);

    if (currentData.isMain === true && dataObject.isMain === false && !force) {
      return;
    }

    if (force) {
      stmts.updateBot.run(JSON.stringify(dataObject), jid);
    } else {
      const updatedData = { ...currentData, ...dataObject };
      stmts.updateBot.run(JSON.stringify(updatedData), jid);
    }
  },

  // Retorna una lista con TODOS los bots registrados y sus objetos JSON limpios
  // Incluye "id" además de "jid" para búsquedas explícitas por llave.
  // 🔄 Antes de leer, forzamos un checkpoint pasivo del WAL para asegurar
  // que esta conexión vea los cambios más recientes escritos por OTROS
  // workers/subbots (cada subbot corre con su propia conexión SQLite).
  getAllBots() {
    try {
      db_instance.pragma("wal_checkpoint(PASSIVE)");
    } catch {}

    const rows = stmts.getAllBots.all();
    return rows.map(row => ({
      id: row.jid,
      jid: row.jid,
      ...JSON.parse(row.data)
    }));
  },

  // 🌟 PARCHE: Filtra directamente los bots activos desde la DB dinámica
  getOnlineBots() {
    return this.getAllBots().filter(bot => bot.status === 'online');
  },

  // 🛡️ CONTROL DE ROLES: Verifica de forma prioritaria el config.js y luego la DB
  hasRole(jid, role) {
    const numeroLimpio = jid.split('@')[0];

    const esOwnerGlobal = config.ownerNumber?.includes(numeroLimpio);
    const esCoOwnerGlobal = config.coOwners?.includes(numeroLimpio);

    if (esOwnerGlobal) return true;
    if (esCoOwnerGlobal && hierarchy.indexOf("coowner") >= hierarchy.indexOf(role)) return true;

    const user = getUser(jid);
    return hierarchy.indexOf(user.role) >= hierarchy.indexOf(role);
  },

  setRole(jid, role) {
    db.setUser(jid, { role });
  },

  isBanned(jid) {
    return getUser(jid).banned === true;
  },

  ban(jid) {
    db.setUser(jid, { banned: true });
  },

  unban(jid) {
    db.setUser(jid, { banned: false });
  },

  setPrimary(groupJid, botId) {
    db.setGroup(groupJid, { primaryBot: botId });
  },

  getPrimary(groupJid) {
    return getGroup(groupJid).primaryBot || null;
  },

  delPrimary(groupJid) {
    const group = getGroup(groupJid);
    delete group.primaryBot;
    stmts.updateGroup.run(JSON.stringify(group), groupJid);
  },
};