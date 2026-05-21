import { getPlugins } from "../../core/pluginLoader.js";

export default {
  name: ["menu", "help", "ayuda"],
  description: "Muestra el menú estético de comandos con vista previa de enlace obligatoria",
  ownerOnly: false,

  async run({ sock, from, senderNum, isGroup, groupName, usedPrefix, react }) {
    try {
      await react("⛩️");

      const hora = new Date().toLocaleTimeString("es-CO", { hour12: false });
      const fecha = new Date().toLocaleDateString("es-CO");
      const lugar = isGroup ? groupName : "Chat Privado";

      const urlFoto = "https://raw.githubusercontent.com/DuarteXV/Yotsuba-MD-Premium/main/uploads/81af45f44481e159.jpg";

      let textoMenu = `✨ ═══ 🫧 *YUTA OKOTSU* 🫧 ═══ ✨\n`;
      textoMenu += `⚔️ _¡El Hechicero de Grado Especial ha despertado!_\n\n`;
      
      textoMenu += `╔════ 🪐 *INFO DEL SISTEMA* 🪐 ════╗\n`;
      textoMenu += `┃ 👤 *Usuario:* @${senderNum}\n`;
      textoMenu += `┃ 📍 *Canal:* ${lugar}\n`;
      textoMenu += `┃ ⏰ *Hora:* ${hora}\n`;
      textoMenu += `┃ 📅 *Fecha:* ${fecha}\n`;
      textoMenu += `╚════════════════════════╝\n\n`;

      textoMenu += `*📜 LISTA DE COMANDOS* 📜\n`;
      textoMenu += `_Recuerda usar el prefijo [ ${usedPrefix} ] antes de cada orden._\n\n`;

      textoMenu += `🗺️ ─── ❖ *INFORMACIÓN* ❖ ─── 🗺️\n`;
      textoMenu += `✦ ${usedPrefix}menu ➔ _Despliega este menú_\n`;
      textoMenu += `✦ ${usedPrefix}ping ➔ _Verifica la latencia del bot_\n\n`;

      textoMenu += `👥 ─── ❖ *GESTIÓN GRUPOS* ❖ ─── 👥\n`;
      textoMenu += `✦ ${usedPrefix}tag ➔ _Mención flash a todos los miembros_\n\n`;

      textoMenu += `👑 ─── ❖ *PROPIETARIO / OWNER* ❖ ─── 👑\n`;
      textoMenu += `✦ ${usedPrefix}eval ➔ _Ejecutor de código en vivo_\n`;
      textoMenu += `✦ ${usedPrefix}update ➔ _Sincronización forzada con GitHub_\n\n`;

      textoMenu += `🔺 _Powered by DuarteXV | Yuta Okotsu MD_ 🔺`;

      // Enviamos el mensaje forzando a Baileys a generar el Link Preview nativo de WhatsApp
      await sock.sendMessage(from, {
        text: textoMenu,
        mentions: [`${senderNum}@s.whatsapp.net`],
      }, {
        linkPreview: {
          title: "🫧 YUTA OKOTSU MD 🫧",
          body: "Hechicero de Grado Especial",
          mediaType: 1, // Tipo 1 especifica que es una imagen/enlace web
          thumbnailUrl: urlFoto,
          sourceUrl: urlFoto,
          "render-larger-thumbnail": true // Esto obliga a WhatsApp a hacer la previsualización grande arriba del texto
        }
      });
      
    } catch (error) {
      console.error("Error en el comando menu con linkPreview forzado:", error);
    }
  }
};
