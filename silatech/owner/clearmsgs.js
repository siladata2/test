// ============================================
// CLEARMSGS COMMAND - Clear all messages in chat
// Owner Only
// Powered by SILA TECH
// ============================================

export default {
    name: 'clearmsgs',
    description: 'Clear all messages in current chat',
    category: 'owner',
    alias: ['clearchat', 'deleteall', 'clearall'],
    ownerOnly: true,
    
    async execute(sock, msg, args, prefix, config) {
        const chatId = msg.key.remoteJid;
        
        if (args[0] !== 'confirm') {
            const styledName = config.applyFont(config.BOT_NAME, config.BOT_FONT);
            const message = `*╭┈┈┄⊰ ${styledName} - CLEAR MESSAGES ⊱┄┄┄◈*
┋
┋ •> ⚠️ *WARNING: This will clear ALL messages in this chat!*
┋
┋ •> 📋 To confirm, use:
┋ •> ${prefix}clearmsgs confirm
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
            // Clear messages from store
            if (config.store && config.store.clearChat) {
                config.store.clearChat(chatId);
            }
            
            const styledName = config.applyFont(config.BOT_NAME, config.BOT_FONT);
            const message = `*╭┈┈┄⊰ ${styledName} - MESSAGES CLEARED ⊱┄┄┄◈*
┋
┋ •> 🗑️ *All messages have been cleared from this chat!*
┋
╰┄┄┄┄┄┈┈┈┈┄┄┄◈
> ® ${config.POWERED_BY}`;
            
            if (config.sendStyledMessage) {
                await config.sendStyledMessage(sock, chatId, message, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: message }, { quoted: msg });
            }
            
        } catch (error) {
            const errorMsg = `❌ *Failed to clear messages!*\nError: ${error.message}`;
            if (config.sendStyledMessage) {
                await config.sendStyledMessage(sock, chatId, errorMsg, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: errorMsg }, { quoted: msg });
            }
        }
    }
};