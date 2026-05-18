import chalk from "chalk";
import gradient from "gradient-string";
import figlet from "figlet";
import { promisify } from "util";

const figletAsync = promisify(figlet);

// ─── PALETA YUTA ──────────────────────────────────────────
const yuta = gradient(["#7B2FBE", "#E040FB", "#00E5FF"]);
const separator = chalk.hex("#7B2FBE")("─".repeat(55));

export async function printBanner() {
  const art = await figletAsync("YUTA", { font: "ANSI Shadow" });
  console.clear();
  console.log("\n" + yuta(art));
  console.log(
    chalk.hex("#E040FB").bold("        ⚡  Yuta Okotsu Bot  ⚡")
  );
  console.log(
    chalk.hex("#00E5FF")("        ✦  Jujutsu Kaisen Edition  ✦")
  );
  console.log(separator);
  console.log(
    chalk.white("        Powered by ") +
    chalk.hex("#E040FB").bold("DuarteXV") +
    chalk.white("  |  @whiskeysockets/baileys")
  );
  console.log(separator + "\n");
}

// ─── TAGS DE LOG ──────────────────────────────────────────
const tag = {
  info:    chalk.bgHex("#7B2FBE").white.bold("  INFO  "),
  ok:      chalk.bgHex("#00C853").white.bold("   OK   "),
  warn:    chalk.bgHex("#FF6F00").white.bold("  WARN  "),
  error:   chalk.bgHex("#D50000").white.bold(" ERROR  "),
  msg:     chalk.bgHex("#00E5FF").black.bold("  MSG   "),
  cmd:     chalk.bgHex("#E040FB").black.bold("  CMD   "),
  conn:    chalk.bgHex("#1A237E").white.bold("  CONN  "),
  bot:     chalk.bgHex("#263238").white.bold("  BOT   "),
};

function ts() {
  return chalk.gray(`[${new Date().toLocaleTimeString()}]`);
}

export const log = {
  info:  (msg) => console.log(`${ts()} ${tag.info}  ${chalk.white(msg)}`),
  ok:    (msg) => console.log(`${ts()} ${tag.ok}  ${chalk.greenBright(msg)}`),
  warn:  (msg) => console.log(`${ts()} ${tag.warn}  ${chalk.yellow(msg)}`),
  error: (msg) => console.log(`${ts()} ${tag.error}  ${chalk.red(msg)}`),
  conn:  (msg) => console.log(`${ts()} ${tag.conn}  ${chalk.cyan(msg)}`),
  bot:   (msg) => console.log(`${ts()} ${tag.bot}  ${chalk.hex("#B0BEC5")(msg)}`),

  // ─── LOG DE MENSAJE ─────────────────────────────────────
  message({ from, sender, isGroup, groupName, body, isCmd, cmdName }) {
    const lugar = isGroup
      ? chalk.hex("#E040FB")(`[${groupName}]`)
      : chalk.hex("#00E5FF")("[DM]");

    const remitente = chalk.hex("#B0BEC5")(sender);
    const contenido = isCmd
      ? `${tag.cmd} ${chalk.hex("#E040FB").bold(cmdName)} ${chalk.gray("→")} ${chalk.white(body)}`
      : `${tag.msg} ${chalk.white(body)}`;

    console.log(
      `${ts()} ${lugar} ${remitente}\n` +
      `         ${contenido}`
    );
  },

  // ─── EJECUCIÓN DE COMANDO ────────────────────────────────
  cmdExec({ cmdName, sender, success, ms }) {
    const status = success
      ? chalk.greenBright("✔ Ejecutado")
      : chalk.red("✘ Fallido");
    console.log(
      `${ts()} ${tag.cmd}  ${chalk.hex("#E040FB").bold(cmdName)} ` +
      `${chalk.gray("por")} ${chalk.cyan(sender)} ` +
      `${status} ${chalk.gray(`(${ms}ms)`)}`
    );
  },
};