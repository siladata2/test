import axios from 'axios'

export default {
    name: 'flux2',
    description: 'Generate image kwa AI',
    category: 'ai',
    alias: ['imagine', 'genimage', 'aiimg'],

    async execute(sock, msg, args, prefix, config) {
        const chatId = msg.key.remoteJid

        const prompt = args.join(' ').trim()

        if (!prompt) {
            return await sock.sendMessage(chatId, {
                text: `Tafadhali weka maelezo ya picha.\nMfano: ${prefix}flux beautiful sunset over ocean`
            }, { quoted: msg })
        }

        await sock.sendMessage(chatId, { react: { text: '🎨', key: msg.key } })

        try {
            const res = await axios.get('https://api.silatech.site/api/ai/flux', {
                params: { text: prompt },
                timeout: 30000
            })

            const imageUrl = res.data?.result

            if (!imageUrl || typeof imageUrl !== 'string') {
                throw new Error('Hakuna picha ilipatikana')
            }

            // Download image
            const imgRes = await axios.get(imageUrl, { responseType: 'arraybuffer', timeout: 30000 })
            const buffer = Buffer.from(imgRes.data)

            await sock.sendMessage(chatId, { react: { text: '✅', key: msg.key } })

            await sock.sendMessage(chatId, {
                image: buffer,
                caption: `🎨 *${prompt}*\n\n> ® ${config.POWERED_BY}`
            }, { quoted: msg })

        } catch (err) {
            await sock.sendMessage(chatId, { react: { text: '❌', key: msg.key } })
            await sock.sendMessage(chatId, {
                text: 'Imeshindwa kutengeneza picha. Jaribu tena.'
            }, { quoted: msg })
        }
    }
}
