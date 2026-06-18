// ============================================
// SETFOOTER COMMAND - Set bot footer text
// Owner Only
// Powered by SILA TECH
// ============================================

export default {
    name: 'setfooter',
    description: 'Set bot footer text',
    category: 'owner',
    alias: ['footer', 'changefooter', 'setpoweredby'],
    ownerOnly: true,
    
    async execute(sock, msg, args, prefix, config) {
        const chatId = msg.key.remoteJid;
        
        if (!args[0]) {
            const currentFooter = config.POWERED_BY || '𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐛𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡';
            const styledName = config.applyFont(config.BOT_NAME, config.BOT_FONT);
            
            const message = `*╭┈┈┄⊰ ${styledName} - SET FOOTER ⊱┄┄┄◈*
┋
┋ •> 📝 *Current Footer:*
┋ •> ${currentFooter}
┋
┋ •> 📋 *Usage:*
┋ •> ${prefix}setfooter <text>
┋
┋ •> 📌 *Example:*
┋ •> ${prefix}setfooter "Powered by SILA TECH"
┋ •> ${prefix}setfooter "© 2024 SILA MD"
┋
╰┄┄┄┄┄┈┈┈┈┄┄┄◈
> ® ${currentFooter}`;
            
            if (config.sendStyledMessage) {
                await config.sendStyledMessage(sock, chatId, message, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: message }, { quoted: msg });
            }
            return;
        }
        
        const newFooter = args.join(' ');
        
        // Update config using updateConfig
        if (config.updateConfig) {
            config.updateConfig('POWERED_BY', newFooter);
        }
        
        // Update process.env for compatibility
        process.env.POWERED_BY = newFooter;
        
        const styledName = config.applyFont(config.BOT_NAME, config.BOT_FONT);
        const styledFooter = config.applyFont(newFooter, config.BOT_FONT);
        
        const message = `*╭┈┈┄⊰ ${styledName} - FOOTER UPDATED ⊱┄┄┄◈*
┋
┋ •> 📝 *Old Footer:* ${config.POWERED_BY}
┋ •> 📝 *New Footer:* ${newFooter}
┋
┋ •> ✨ *Preview:* 
┋ •> ${styledFooter}
┋
┋ •> ✅ Footer updated successfully!
┋
╰┄┄┄┄┄┈┈┈┈┄┄┄◈
> ® ${styledFooter}`;
        
        if (config.sendStyledMessage) {
            await config.sendStyledMessage(sock, chatId, message, { quoted: msg });
        } else {
            await sock.sendMessage(chatId, { text: message }, { quoted: msg });
        }
        
        // Update terminal header if function exists
        if (config.updateTerminalHeader) {
            config.updateTerminalHeader();
        }
    }
};
