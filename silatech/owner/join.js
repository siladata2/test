// ============================================
// JOIN COMMAND - Join a group via invite link
// Owner Only
// Powered by SILA TECH
// ============================================

export default {
    name: 'join',
    description: 'Join a group using invite link',
    category: 'owner',
    alias: ['joingroup', 'invitejoin'],
    ownerOnly: true,
    
    async execute(sock, msg, args, prefix, config) {
        const chatId = msg.key.remoteJid;
        
        if (!args[0]) {
            const styledName = config.applyFont(config.BOT_NAME, config.BOT_FONT);
            const message = `*╭┈┈┄⊰ ${styledName} - JOIN GROUP ⊱┄┄┄◈*
┋
┋ •> 📋 *Usage:*
┋ •> ${prefix}join <invite_link_or_code>
┋
┋ •> 📌 *Example:*
┋ •> ${prefix}join https://chat.whatsapp.com/xxxxx
┋ •> ${prefix}join xxxxx
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
        
        let inviteCode = args[0];
        
        // Extract code from URL if needed
        if (inviteCode.includes('chat.whatsapp.com')) {
            const match = inviteCode.match(/chat\.whatsapp\.com\/([A-Za-z0-9]+)/);
            if (match) {
                inviteCode = match[1];
            }
        }
        
        try {
            await sock.groupAcceptInvite(inviteCode);
            
            const styledName = config.applyFont(config.BOT_NAME, config.BOT_FONT);
            const message = `*╭┈┈┄⊰ ${styledName} - JOIN SUCCESS ⊱┄┄┄◈*
┋
┋ •> ✅ *Successfully joined the group!*
┋
╰┄┄┄┄┄┈┈┈┈┄┄┄◈
> ® ${config.POWERED_BY}`;
            
            if (config.sendStyledMessage) {
                await config.sendStyledMessage(sock, chatId, message, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: message }, { quoted: msg });
            }
            
        } catch (error) {
            const errorMsg = `❌ *Failed to join group!*\nError: ${error.message}`;
            if (config.sendStyledMessage) {
                await config.sendStyledMessage(sock, chatId, errorMsg, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: errorMsg }, { quoted: msg });
            }
        }
    }
};