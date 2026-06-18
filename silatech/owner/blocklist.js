// ============================================
// BLOCKLIST COMMAND - List all blocked users
// Owner Only
// Powered by SILA TECH
// ============================================

export default {
    name: 'blocklist',
    description: 'List all blocked users',
    category: 'owner',
    alias: ['blockedlist', 'bannedlist', 'blockedusers'],
    ownerOnly: true,
    
    async execute(sock, msg, args, prefix, config) {
        const chatId = msg.key.remoteJid;
        
        let blockedUsers = [];
        
        if (config.blockedUsersManager) {
            blockedUsers = config.blockedUsersManager.getAll();
        }
        
        const styledName = config.applyFont(config.BOT_NAME, config.BOT_FONT);
        
        if (blockedUsers.length === 0) {
            const message = `*╭┈┈┄⊰ ${styledName} - BLOCKED USERS ⊱┄┄┄◈*
┋
┋ •> 📭 *No blocked users found!*
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
        
        let userList = '';
        for (let i = 0; i < blockedUsers.length; i++) {
            const user = blockedUsers[i];
            const userName = user.split('@')[0];
            userList += `*┋ •> ${i + 1}. @${userName}*\n`;
        }
        
        const message = `*╭┈┈┄⊰ ${styledName} - BLOCKED USERS ⊱┄┄┄◈*
┋
┋ •> 🔨 *Total Blocked:* ${blockedUsers.length}
┋
${userList}
╰┄┄┄┄┄┈┈┈┈┄┄┄◈
> ® ${config.POWERED_BY}`;
        
        if (config.sendStyledMessage) {
            await config.sendStyledMessage(sock, chatId, message, { 
                quoted: msg,
                contextInfo: config.getContextInfo(msg)
            });
        } else {
            await sock.sendMessage(chatId, {
                text: message,
                contextInfo: config.getContextInfo(msg)
            }, { quoted: msg });
        }
    }
};