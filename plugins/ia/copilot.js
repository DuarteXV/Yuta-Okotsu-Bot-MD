import axios from 'axios'

export default {
  name: ['copilot', 'ai'],
  description: 'Conversa con la IA Copilot',
  category: 'misc',
  ownerOnly: false,

  async run({ text, reply, react }) {
    if (!text) {
      return await reply({
        text: '❌ Escribe tu pregunta o mensaje para Copilot.\n\n📝 *Ejemplo:* .copilot ¿cómo está el clima hoy?'
      })
    }

    await react('🤔')

    try {
      const apiUrl = `https://fare.ink/ai/copilot?q=${encodeURIComponent(text)}&model=default`

      const { data } = await axios.get(apiUrl, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000
      })

      if (!data?.status || !data?.respuesta) {
        await react('❌')
        return await reply({ text: '❌ No se pudo obtener una respuesta de Copilot.' })
      }

      await reply({ text: data.respuesta })
      await react('✅')

    } catch (error) {
      console.error('Error en Copilot:', error)
      await react('❌')
      await reply({ text: `❌ Error al consultar Copilot: ${error.message}` })
    }
  }
}