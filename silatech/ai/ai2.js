// ============================================
// AI COMMAND - Powered by Sila Tech API
// https://api.silatech.site
// ============================================

import axios from 'axios'

export default {
    name: 'ai2',
    description: 'Zungumza na AI',
    category: 'ai',
    alias: ['gpt2', 'chat', 'sila'],

    async execute(sock, msg, args, prefix, config) {
        const chatId = msg.key.remoteJid
        const currentFont = config.BOT_FONT || 'normal'
        const botName = config.applyFont ? config.applyFont(config.BOT_NAME, currentFont) : config.BOT_NAME

        // Angalia kama mtumiaji ameweka swali
        const text = args.join(' ').trim()

        if (!text) {
            const noTextMsg = `╭━━〔 ${botName} 〕━━┈⊷
┃
┃ ❌ Tafadhali weka swali lako
┃
┃ 📌 Mfano:
┃ ${prefix}ai Habari
┃ ${prefix}ai What is AI?
┃
╰━━━━━━━━━━━━━━┈⊷
> ® ${config.POWERED_BY}`

            if (config.sendStyledMessage) {
                return await config.sendStyledMessage(sock, chatId, noTextMsg, { quoted: msg })
            } else {
                return await sock.sendMessage(chatId, { text: noTextMsg }, { quoted: msg })
            }
        }

        // React - inaonyesha inafikiri
        await sock.sendMessage(chatId, { react: { text: '🤖', key: msg.key } })

        try {
            // Inaita Sila Tech API
            const res = await axios.get('https://api.silatech.site/api/ai/gpt', {
                params: { text },
                timeout: 20000
            })

            const result = res.data?.result || 'Samahani, sijapata jibu.'

            const replyMsg = `╭━━〔 ${botName} 〕━━┈⊷
┃
┃ 👤 ${text}
┃
┃ 🤖 ${result}
┃
╰━━━━━━━━━━━━━━┈⊷
> ® ${config.POWERED_BY}`

            // React - imefanikiwa
            await sock.sendMessage(chatId, { react: { text: '✅', key: msg.key } })

            if (config.sendStyledMessage) {
                await config.sendStyledMessage(sock, chatId, replyMsg, { quoted: msg })
            } else {
                await sock.sendMessage(chatId, { text: replyMsg }, { quoted: msg })
            }

        } catch (err) {
            // React - imeshindwa
            await sock.sendMessage(chatId, { react: { text: '❌', key: msg.key } })

            const errMsg = `╭━━〔 ${botName} 〕━━┈⊷
┃
┃ ❌ Huduma haipatikani sasa hivi
┃ 🔄 Jaribu tena baadaye
┃
╰━━━━━━━━━━━━━━┈⊷
> ® ${config.POWERED_BY}`

            if (config.sendStyledMessage) {
                await config.sendStyledMessage(sock, chatId, errMsg, { quoted: msg })
            } else {
                await sock.sendMessage(chatId, { text: errMsg }, { quoted: msg })
            }
        }
    }
}
