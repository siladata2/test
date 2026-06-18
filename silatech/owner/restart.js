// ============================================
// RESTART COMMAND - Restart the bot
// Owner Only
// Powered by SILA TECH
// ============================================

export default {
    name: 'restart',
    description: 'Restart the bot',
    category: 'owner',
    alias: ['reboot', 'resetbot'],
    ownerOnly: true,
    
    async execute(sock, msg, args, prefix, config) {
        const chatId = msg.key.remoteJid;
        const senderJid = msg.key.participant || msg.key.remoteJid;
        
        if (args[0] !== 'confirm') {
            const styledName = config.applyFont(config.BOT_NAME, config.BOT_FONT);
            const message = `*╭┈┈┄⊰ ${styledName} - RESTART BOT ⊱┄┄┄◈*
┋
┋ •> ⚠️ *WARNING: This will restart the bot!*
┋
┋ •> 📋 To confirm, use:
┋ •> ${prefix}restart confirm
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
        
        const styledName = config.applyFont(config.BOT_NAME, config.BOT_FONT);
        const message = `*╭┈┈┄⊰ ${styledName} - RESTARTING ⊱┄┄┄◈*
┋
┋ •> 🔄 *Bot is restarting...*
┋ •> 👤 Requested by: @${senderJid.split('@')[0]}
┋
╰┄┄┄┄┄┈┈┈┈┄┄┄◈
> ® ${config.POWERED_BY}`;
        
        await sock.sendMessage(chatId, { text: message }, { quoted: msg });
        
        setTimeout(() => {
            process.exit(0);
        }, 2000);
    }
};