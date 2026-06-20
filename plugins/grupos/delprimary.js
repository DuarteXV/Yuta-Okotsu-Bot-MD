import { db } from '../../database/db.js'

// Función simple para meter un pequeño retraso
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export default {
  name: ['delprimary', 'quitarprincipal'],
  description: 'Quita el bot primario del grupo',
  category: 'grupos',
  groupOnly: true,
  adminOnly: true,

  async run({ from, msg, react, reply }) {
    // 1. Primer control: Ver si hay un bot primario en este momento
    const primaryAntes = db.getPrimary(from)

    if (!primaryAntes) {
      // Metemos un delay aleatorio muy pequeño para que no respondan todos en bloque si no hay primario
      await delay(Math.floor(Math.random() * 400) + 100)
      
      // Volvemos a comprobar si algún otro bot ya respondió antes de mandar el aviso
      // Si tu sistema tiene un control de mensajes globales, esto evitará el spam.
      // De lo contrario, para dejarlo limpio, dejamos que pase de largo de forma directa:
      return await reply({
        text:
          `⚠️ *Este grupo no tiene bot primario establecido.*\n\n` +
          `💡 Usa *.setprimary* para establecer uno.\n\n` +
          `⚔️ _Yuta Okotsu MD | DuarteXV_`
      })
    }

    // 2. TRUCO DE TIEMPO (CARRERA DE PROCESOS):
    // El bot primario real ejecuta la acción de inmediato.
    // Los sub-bots secundarios esperan 250 milisegundos.
    await delay(250)

    // 3. Segunda comprobación crítica después del delay
    const primaryAhora = db.getPrimary(from)

    // Si el primario ya fue eliminado por el bot real durante esos 250ms,
    // significa que este bot actual es un secundario colado. ¡Nos salimos en silencio!
    if (!primaryAhora) {
      return
    }

    // El bot que llegó primero (el primario) limpia la base de datos
    await react('🗑️')
    db.delPrimary(from)

    await reply({
      text:
        `✅ *Bot primario eliminado*\n\n` +
        `🤖 El bot *${primaryAntes}* ya no es el principal.\n` +
        `Todos los bots y sub-bots responderán en este grupo ahora.\n\n` +
        `⚔️ _Yuta Okotsu MD | DuarteXV_`
    })
  }
}
