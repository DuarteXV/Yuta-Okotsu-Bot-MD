export default {
  name: ["menu", "help", "ayuda"],
  description: "Menú de prueba estático",
  ownerOnly: false,

  async run({ reply, react }) {
    try {
      // 1. Probar la reacción
      await react("🧪");

      // 2. Intentar enviar un texto simple
      await reply({ 
        text: "👋 ¡Hola! Si estás leyendo esto, el comando de prueba funciona perfectamente y tu handler está ejecutando el archivo correctamente." 
      });

    } catch (error) {
      console.error("Fallo directo en el menú test:", error);
      throw error;
    }
  },
};
