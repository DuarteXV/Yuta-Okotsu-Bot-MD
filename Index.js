import { printBanner } from "./core/logger.js";
import { createConnection } from "./core/connection.js";
import { loadPlugins, watchPlugins } from "./core/pluginLoader.js";
import { log } from "./core/logger.js";

// Suprimir advertencias innecesarias de Node
process.removeAllListeners("warning");

async function main() {
  await printBanner();
  
  log.info("Cargando plugins...");
  await loadPlugins();
  watchPlugins();

  log.info("Iniciando conexión principal...");
  await createConnection({
    sessionDir: "./sessions/main",
    botLabel: "MAIN",
    isSubbot: false,
  });
}

main().catch((e) => {
  log.error(`Error fatal: ${e.message}`);
  process.exit(1);
});