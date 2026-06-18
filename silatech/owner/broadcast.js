// ============================================
// BROADCAST COMMAND - Send message to all groups/chats
// Owner Only
// Powered by SILA TECH
// ============================================

export default {
    name: 'broadcast',
    description: 'Send a broadcast message to all groups/chats',
    category: 'owner',
    alias: ['bc', 'broadcastall', 'sendall'],
    ownerOnly: true,
    
    async execute(sock, msg, args, prefix, config) {
        const chatId = msg.key.remoteJid;
        const senderJid = msg.key.participant || msg.key.remoteJid;
        
        if (!args[0]) {
            const styledName = config.applyFont(config.BOT_NAME, config.BOT_FONT);
            const message = `*╭┈┈┄⊰ ${styledName} - BROADCAST ⊱┄┄┄◈*
┋
┋ •> 📋 *Usage:*
┋ •> ${prefix}broadcast <message>
┋ •> ${prefix}broadcast groups <message>
┋ •> ${prefix}broadcast dms <message>
┋
┋ •> 📌 *Examples:*
┋ •> ${prefix}broadcast Hello everyone!
┋ •> ${prefix}broadcast groups Maintenance in 5 minutes
┋
╰┄┄┄┄┄┈┈┈┈┄┄┄◈
> ® ${config.POWERED_BY}`;
            
            if (config.sendStyledMessage) {
                await config.sendStyledMessage(sock, chatId, message, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: message }, { quoted: msg });
            }
            return;
        }
        
        let target = 'all';
        let messageText = args.join(' ');
        
        if (args[0].toLowerCase() === 'groups') {
            target = 'groups';
            messageText = args.slice(1).join(' ');
        } else if (args[0].toLowerCase() === 'dms' || args[0].toLowerCase() === 'dm') {
            target = 'dms';
            messageText = args.slice(1).join(' ');
        }
        
        if (!messageText) {
            await sock.sendMessage(chatId, { text: '❌ *Please provide a message to broadcast!*' }, { quoted: msg });
            return;
        }
        
        const styledName = config.applyFont(config.BOT_NAME, config.BOT_FONT);
        const broadcastMsg = `*╭┈┈┄⊰ ${styledName} - BROADCAST ⊱┄┄┄◈*
┋
┋ •> 📢 *Message from Owner:*
┋ •> ${messageText}
┋
╰┄┄┄┄┄┈┈┈┈┄┄┄◈
> ® ${config.POWERED_BY}`;
        
        let successCount = 0;
        let failCount = 0;
        
        try {
            const chats = await sock.groupFetchAllParticipating();
            const groupIds = Object.keys(chats);
            
            for (const groupId of groupIds) {
                if (target === 'all' || target === 'groups') {
                    try {
                        await sock.sendMessage(groupId, { text: broadcastMsg });
                        successCount++;
                    } catch {
                        failCount++;
                    }
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
            
            // For DMs - get recent chats
            if (target === 'all' || target === 'dms') {
                // This is simplified; in production you'd need to track DMs
                const status = `✅ *Broadcast completed!*\n\n📊 *Groups:* ${successCount} sent, ${failCount} failed`;
                await sock.sendMessage(chatId, { text: status }, { quoted: msg });
            } else {
                const resultMsg = `*╭┈┈┄⊰ BROADCAST RESULT ⊱┄┄┄◈*
┋
┋ •> ✅ *Success:* ${successCount} groups
┋ •> ❌ *Failed:* ${failCount} groups
┋
╰┄┄┄┄┄┈┈┈┈┄┄┄◈
> ® ${config.POWERED_BY}`;
                
                if (config.sendStyledMessage) {
                    await config.sendStyledMessage(sock, chatId, resultMsg, { quoted: msg });
                } else {
                    await sock.sendMessage(chatId, { text: resultMsg }, { quoted: msg });
                }
            }
            
        } catch (error) {
            const errorMsg = `❌ *Broadcast failed!*\nError: ${error.message}`;
            await sock.sendMessage(chatId, { text: errorMsg }, { quoted: msg });
        }
    }
};