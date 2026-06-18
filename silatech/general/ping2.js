// ============================================
// PING2 COMMAND - Latency Tester (English only)
// ============================================

import axios from 'axios'

export default {
    name: 'ping2',
    description: 'Measure bot response latency',
    category: 'general',
    alias: ['pong2', 'latency'],

    async execute(sock, msg, args, prefix, config) {
        const chatId = msg.key.remoteJid
        const currentFont = config.BOT_FONT || 'normal'
        const botName = config.applyFont ? config.applyFont(config.BOT_NAME, currentFont) : config.BOT_NAME
        const start = Date.now()

        // Reaction: measuring
        await sock.sendMessage(chatId, { react: { text: '⏱️', key: msg.key } })

        try {
            let apiLatency = 0
            try {
                await axios.get('https://api.silatech.site/api/ping', { timeout: 5000 })
                apiLatency = Date.now() - start
            } catch {
                apiLatency = null
            }

            const end = Date.now()
            const botLatency = end - start
            const timestamp = new Date().toLocaleTimeString()

            let resultText = `🏓 Pong!\n⚡ Bot latency: ${botLatency}ms\n`
            if (apiLatency !== null) {
                resultText += `🌐 API latency: ${apiLatency}ms\n`
            } else {
                resultText += `🌐 API: timeout\n`
            }
            resultText += `🕒 ${timestamp}`

            // Success message with graphics (box)
            const replyMsg = `╭━━〔 ${botName} 〕━━┈⊷
┃
┃ ${resultText}
┃
╰━━━━━━━━━━━━━━┈⊷
> ® ${config.POWERED_BY}`

            await sock.sendMessage(chatId, { react: { text: '✅', key: msg.key } })

            if (config.sendStyledMessage) {
                await config.sendStyledMessage(sock, chatId, replyMsg, { quoted: msg })
            } else {
                await sock.sendMessage(chatId, { text: replyMsg }, { quoted: msg })
            }

        } catch (err) {
            // Error message: NO GRAPHICS, plain English text
            await sock.sendMessage(chatId, { react: { text: '❌', key: msg.key } })
            const errMsg = `ERROR: Failed to measure latency. Please try again.`
            
            if (config.sendStyledMessage) {
                // Even with styled message, we send plain text for error
                await sock.sendMessage(chatId, { text: errMsg }, { quoted: msg })
            } else {
                await sock.sendMessage(chatId, { text: errMsg }, { quoted: msg })
            }
        }
    }
}
