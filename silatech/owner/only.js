export default {
    name: 'owneronly',
    description: 'Command only for bot owner',
    category: 'owner',
    alias: ['owner', 'onlyowner'],

    async execute(sock, msg, args, prefix, config) {
        const chatId = msg.key.remoteJid
        let senderJid = msg.key.participant || msg.key.remoteJid
        if (!senderJid) senderJid = msg.key.remoteJid

        // Use config.isOwnerJid if exists, else compare directly
        let isOwner = false
        if (typeof config.isOwnerJid === 'function') {
            isOwner = config.isOwnerJid(senderJid)
        } else {
            isOwner = (config.OWNER_JID && senderJid === config.OWNER_JID)
        }

        if (!isOwner) {
            await sock.sendMessage(chatId, { react: { text: '⛔', key: msg.key } })
            await sock.sendMessage(chatId, { text: 'ERROR: You are not the bot owner. This command is restricted.' }, { quoted: msg })
            return
        }

        await sock.sendMessage(chatId, { react: { text: '🔐', key: msg.key } })
        const botName = config.BOT_NAME || 'Bot'
        const reply = `╭━━〔 ${botName} 〕━━┈⊷
┃
┃ ✅ Owner access granted.
┃ 👑 Welcome, master.
┃
╰━━━━━━━━━━━━━━┈⊷
> ® ${config.POWERED_BY}`
        await sock.sendMessage(chatId, { text: reply }, { quoted: msg })
    }
}