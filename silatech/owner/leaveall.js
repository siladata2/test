// ============================================
// LEAVEALL COMMAND - Leave all groups
// Owner Only
// Powered by SILA TECH
// ============================================

export default {
    name: 'leaveall',
    description: 'Leave all groups (except current)',
    category: 'owner',
    alias: ['leavegroups', 'exitall'],
    ownerOnly: true,
    
    async execute(sock, msg, args, prefix, config) {
        const chatId = msg.key.remoteJid;
        
        if (args[0] !== 'confirm') {
            const styledName = config.applyFont(config.BOT_NAME, config.BOT_FONT);
            const message = `*╭┈┈┄⊰ ${styledName} - LEAVE ALL GROUPS ⊱┄┄┄◈*
┋
┋ •> ⚠️ *WARNING: This will make the bot leave ALL groups!*
┋
┋ •> 📋 To confirm, use:
┋ •> ${prefix}leaveall confirm
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
        
        try {
            const groups = await sock.groupFetchAllParticipating();
            const groupIds = Object.keys(groups);
            let leftCount = 0;
            let failCount = 0;
            
            await sock.sendMessage(chatId, { text: `🔄 *Leaving ${groupIds.length} groups...*` }, { quoted: msg });
            
            for (const groupId of groupIds) {
                if (groupId !== chatId) {
                    try {
                        await sock.groupParticipantsUpdate(groupId, [sock.user.id], 'remove');
                        leftCount++;
                    } catch {
                        failCount++;
                    }
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
            
            const styledName = config.applyFont(config.BOT_NAME, config.BOT_FONT);
            const message = `*╭┈┈┄⊰ ${styledName} - LEAVE ALL COMPLETE ⊱┄┄┄◈*
┋
┋ •> ✅ *Left:* ${leftCount} groups
┋ •> ❌ *Failed:* ${failCount} groups
┋
╰┄┄┄┄┄┈┈┈┈┄┄┄◈
> ® ${config.POWERED_BY}`;
            
            if (config.sendStyledMessage) {
                await config.sendStyledMessage(sock, chatId, message, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: message }, { quoted: msg });
            }
            
        } catch (error) {
            const errorMsg = `❌ *Failed to leave groups!*\nError: ${error.message}`;
            if (config.sendStyledMessage) {
                await config.sendStyledMessage(sock, chatId, errorMsg, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: errorMsg }, { quoted: msg });
            }
        }
    }
};