import { JSONFilePreset } from "lowdb/node";
import { mkdirSync } from "fs";

mkdirSync("./database", { recursive: true });

const defaultData = {
  users: {},
  groups: {},
};

const db_instance = await JSONFilePreset("./database/yuta.json", defaultData);

function save() {
  return db_instance.write();
}

function getUser(jid) {
  if (!db_instance.data.users[jid]) {
    db_instance.data.users[jid] = {
      role: "user",
      banned: false,
      registeredAt: new Date().toISOString(),
    };
    save();
  }
  return db_instance.data.users[jid];
}

const hierarchy = ["user", "premium", "mod", "coowner", "owner"];

export const db = {
  getUser,

  hasRole(jid, role) {
    const user = getUser(jid);
    return hierarchy.indexOf(user.role) >= hierarchy.indexOf(role);
  },

  setRole(jid, role) {
    getUser(jid);
    db_instance.data.users[jid].role = role;
    save();
  },

  isBanned(jid) {
    return getUser(jid).banned === true;
  },

  ban(jid) {
    getUser(jid);
    db_instance.data.users[jid].banned = true;
    save();
  },

  unban(jid) {
    getUser(jid);
    db_instance.data.users[jid].banned = false;
    save();
  },

  getGroup(jid) {
    if (!db_instance.data.groups[jid]) {
      db_instance.data.groups[jid] = {
        welcome: false,
        antilink: false,
      };
      save();
    }
    return db_instance.data.groups[jid];
  },

  setGroup(jid, key, value) {
    db_instance.data.groups[jid] = db_instance.data.groups[jid] || {};
    db_instance.data.groups[jid][key] = value;
    save();
  },
};