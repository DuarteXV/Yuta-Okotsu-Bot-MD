import chalk from "chalk";
import gradient from "gradient-string";
import figlet from "figlet";
import { promisify } from "util";

const figletAsync = promisify(figlet);

const yuta = gradient(["#7B2FBE", "#E040FB", "#00E5FF"]);
const separator = chalk.hex("#7B2FBE")("─".repeat(55));

export async function printBanner() {
  const art = await figletAsync("YUTA", { font: "ANSI Shadow" });
  console.clear();
  console.log("\n" + yuta(art));
  console.log(chalk.hex("#E040FB").bold("        ⚡  Yuta Okotsu Bot  ⚡"));
  console.log(chalk.hex("#00E5FF")("        ✦  Jujutsu Kaisen Edition  ✦"));
  console.log(separator);
  console.log(
    chalk.white("        Powered by ") +
    chalk.hex("#E040FB").bold("DuarteXV") +
    chalk.white("  |  @whiskeysockets/baileys")
  );
  console.log(separator + "\n");
}

const tag = {
  info:  chalk.bgHex("#7B2FBE").white.bold("  INFO  "),
  ok:    chalk.bgHex("#00C853").white.bold("   OK   "),
  warn:  chalk.bgHex("#FF6F00").white.bold("  WARN  "),
  error: chalk.bgHex("#D50000").white.bold(" ERROR  "),
  msg:   chalk.bgHex("#00E5FF").black.bold("  MSG   "),
  cmd:   chalk.bgHex("#E040FB").black.bold("  CMD   "),
  conn:  chalk.bgHex("#1A237E").white.bold("  CONN  "),
  bot:   chalk.bgHex("#263238").white.bold("  BOT   "),
};

function ts() {
  return new Date().toLocaleTimeString("es-CO", { hour12: true });
}

export const log = {
  info:  (msg) => console.log(`${chalk.gray(`[${ts()}]`)} ${tag.info}  ${chalk.white(msg)}`),
  ok:    (msg) => console.log(`${chalk.gray(`[${ts()}]`)} ${tag.ok}  ${chalk.greenBright(msg)}`),
  warn:  (msg) => console.log(`${chalk.gray(`[${ts()}]`)} ${tag.warn}  ${chalk.yellow(msg)}`),
  error: (msg) => console.log(`${chalk.gray(`[${ts()}]`)} ${tag.error}  ${chalk.red(msg)}`),
  conn:  (msg) => console.log(`${chalk.gray(`[${ts()}]`)} ${tag.conn}  ${chalk.cyan(msg)}`),
  bot:   (msg) => console.log(`${chalk.gray(`[${ts()}]`)} ${tag.bot}  ${chalk.hex("#B0BEC5")(msg)}`),

  message({ from, sender, isGroup, groupName, body, isCmd, cmdName, botLabel = "MAIN" }) {
    const chatType = isGroup ? "👥 Grupo" : "💬 Privado"
    const numero   = sender.split("@")[0].split(":")[0]
    const lugar    = isGroup ? groupName : "Chat Privado"

    let msgType = "Texto"
    if (isCmd) msgType = "⚡ Comando"

    console.log(
      chalk.hex("#7B2FBE")("═".repeat(55)) + "\n" +
      chalk.bgHex("#7B2FBE").white(` ⏰ ${ts()} `) +
      chalk.hex("#7B2FBE")(" │ ") +
      chalk.bgHex("#E040FB").white(` 🤖 ${botLabel} `) + "\n" +
      chalk.hex("#7B2FBE")("─".repeat(55)) + "\n" +
      chalk.white("📱 Usuario  : ") + chalk.greenBright(`+${numero}`) + "\n" +
      chalk.white(`${chatType}  : `) + chalk.yellowBright(lugar) + "\n" +
      chalk.white("📝 Tipo     : ") + chalk.blueBright(msgType) + "\n" +
      chalk.white("💬 Mensaje  : ") + (isCmd
        ? chalk.hex("#E040FB")(`⚡ ${body}`)
        : chalk.white(body?.slice(0, 80) + (body?.length > 80 ? "…" : ""))) + "\n" +
      chalk.hex("#7B2FBE")("─".repeat(55))
    )
  },

  cmdExec({ cmdName, sender, success, ms, botLabel = "MAIN" }) {
    const status = success
      ? chalk.greenBright("✔ Ejecutado")
      : chalk.red("✘ Fallido")
    console.log(
      chalk.gray(`[${ts()}]`) + " " +
      chalk.bgHex("#263238").white.bold(` ${botLabel} `) + " " +
      tag.cmd + "  " +
      chalk.hex("#E040FB").bold(cmdName) + " " +
      chalk.gray("por") + " " +
      chalk.cyan(sender) + " " +
      status + " " +
      chalk.gray(`(${ms}ms)`)
    )
  },
};