import config from "../config.js";
import { log } from "./logger.js";
import { getPlugins } from "./pluginLoader.js";
import { db } from "../database/db.js";

const groupCache = new Map();

function cleanJid(jid = "") {
  return jid?.split(":")[0] + (jid?.includes("@") ? "@" + jid.split("@")[1] : "");
}

export async function handleMessage(sock, rawMsg, botLabel = "MAIN") {
  try {
    const msg  = rawMsg;
    const from = msg.key?.remoteJid;
    if (!from) return;
    if (from === "status@broadcast") return;
    if (msg.key?.fromMe) return;

    const isGroup  = from.endsWith("@g.us");
    const senderJid = isGroup ? (msg.key?.participant || msg.participant || "") : from;
    const sender    = cleanJid(senderJid);
    const botJid    = cleanJid(sock.user?.id);

    const body =
      msg.message?.conversation ||
      msg.message?.extendedTextMessage?.text ||
      msg.message?.imageMessage?.caption ||
      msg.message?.videoMessage?.caption ||
      msg.message?.buttonsResponseMessage?.selectedButtonId ||
      msg.message?.listResponseMessage?.singleSelectReply?.selectedRowId ||
      "";

    const prefixes   = Array.isArray(config.prefix) ? config.prefix : [config.prefix];
    const usedPrefix = prefixes.find((p) => body.startsWith(p)) || null;
    const isCmd      = !!usedPrefix;

    if (!isCmd) return;

    const cmdName = body.slice(usedPrefix.length).trim().split(/\s+/)[0].toLowerCase();
    const args    = body.slice(usedPrefix.length + cmdName.length).trim().split(/\s+/);
    const text    = args.join(" ");

    // ─── GRUPO INFO ──────────────────────────────────────
    let groupName = "";
    let groupMeta = null;

    if (isGroup) {
      if (groupCache.has(from)) {
        groupMeta = groupCache.get(from);
        groupName = groupMeta?.subject || from;
      } else {
        try {
          groupMeta = await sock.groupMetadata(from);
          groupName = groupMeta?.subject || from;
          groupCache.set(from, groupMeta);
          setTimeout(() => groupCache.delete(from), 10 * 60 * 1000);
        } catch {
          groupName = from;
        }
      }

      // ─── FILTRO PRIMARY BOT ────────────────────────────
      const primaryBot = db.getPrimary(from);
      if (primaryBot) {
        const myId = botJid.split("@")[0];
        if (primaryBot !== myId) return;
      }
    }

    // ─── PERMISOS ────────────────────────────────────────
    const senderNum = sender.split("@")[0];
    const isOwner   = config.ownerNumber.includes(senderNum);
    const isCoOwner = config.coOwners.includes(senderNum);
    const isMod     = isOwner || isCoOwner || db.hasRole(senderNum, "mod");
    const isPremium = isMod || db.hasRole(senderNum, "premium");

    log.message({ from, sender, isGroup, groupName, body, isCmd, cmdName });

    const ctx = {
      sock,
      msg,
      from,
      sender,
      senderNum,
      botJid,
      botLabel,
      isGroup,
      groupName,
      groupMeta,
      body,
      isCmd,
      cmdName,
      args,
      text,
      usedPrefix,
      isOwner,
      isCoOwner,
      isMod,
      isPremium,
      reply: (content) => sock.sendMessage(from, content, { quoted: msg }),
      react: (emoji) => sock.sendMessage(from, { react: { text: emoji, key: msg.key } }),
    };

    const plugins = getPlugins();
    const plugin  = plugins.get(cmdName);
    if (!plugin) return;

    if (plugin.ownerOnly   && !isOwner)   return ctx.reply({ text: "❌ Solo el owner puede usar este comando." });
    if (plugin.modOnly     && !isMod)     return ctx.reply({ text: "❌ Solo moderadores pueden usar este comando." });
    if (plugin.premiumOnly && !isPremium) return ctx.reply({ text: "⭐ Este comando es exclusivo para premium." });
    if (plugin.groupOnly   && !isGroup)   return ctx.reply({ text: "👥 Este comando solo funciona en grupos." });
    if (plugin.privateOnly && isGroup)    return ctx.reply({ text: "📩 Este comando solo funciona en privado." });

    const start = Date.now();
    try {
      await plugin.run(ctx);
      log.cmdExec({ cmdName, sender: senderNum, success: true, ms: Date.now() - start });
    } catch (e) {
      log.cmdExec({ cmdName, sender: senderNum, success: false, ms: Date.now() - start });
      log.error(`Comando ${cmdName}: ${e.message}`);
      await ctx.react("❌");
      await ctx.reply({ text: `❌ Error ejecutando \`${cmdName}\`:\n${e.message}` });
    }
  } catch (e) {
    log.error(`handleMessage: ${e.message}`);
  }
}