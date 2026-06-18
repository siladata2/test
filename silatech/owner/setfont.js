// ============================================
// SETFONT COMMAND - Change bot font style
// Owner Only
// Powered by SILA TECH
// ============================================

export default {
    name: 'setfont',
    description: 'Change bot font style',
    category: 'owner',
    alias: ['font', 'changefont', 'style', 'setstyle'],
    ownerOnly: true,  // Hii inaangaliwa kwenye sila.js
    
    async execute(sock, msg, args, prefix, config) {
        const chatId = msg.key.remoteJid;
        
        const fontStyles = config.getFontStyles ? config.getFontStyles() : [
            'normal', 'bold', 'italic', 'monospace', 'cursive', 'doubleStruck'
        ];
        
        if (!args[0]) {
            const currentFont = config.BOT_FONT || 'bold';
            const styledCurrent = config.applyFont(config.BOT_NAME, currentFont);
            
            const message = `╭┈┈┄⊰ SET BOT FONT ⊱┄┄┄◈
┋
┋ •> 🎨 Current Font: ${currentFont}
┋ •> 📝 Preview: ${styledCurrent}
┋
┋ •> 📋 Available Fonts:
${fontStyles.map(f => `┋ •> • ${f}`).join('\n')}
┋
┋ •> Usage: ${prefix}setfont <font_name>
┋ •> Example: ${prefix}setfont bold
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
        
        const newFont = args[0].toLowerCase();
        
        if (!fontStyles.includes(newFont)) {
            await sock.sendMessage(chatId, { 
                text: `❌ Invalid font! Available: ${fontStyles.join(', ')}`
            }, { quoted: msg });
            return;
        }
        
        if (config.updateConfig) {
            config.updateConfig('BOT_FONT', newFont);
        }
        
        process.env.BOT_FONT = newFont;
        
        const oldStyled = config.applyFont(config.BOT_NAME, config.BOT_FONT || 'bold');
        const newStyled = config.applyFont(config.BOT_NAME, newFont);
        
        const message = `╭┈┈┄⊰ FONT CHANGED ⊱┄┄┄◈
┋
┋ •> Old Font: ${config.BOT_FONT || 'bold'}
┋ •> New Font: ${newFont}
┋
┋ •> Preview: ${newStyled}
┋
╰┄┄┄┄┄┈┈┈┈┄┄┄◈
> ® ${config.POWERED_BY}`;
        
        if (config.sendStyledMessage) {
            await config.sendStyledMessage(sock, chatId, message, { quoted: msg });
        } else {
            await sock.sendMessage(chatId, { text: message }, { quoted: msg });
        }
        
        if (config.updateTerminalHeader) {
            config.updateTerminalHeader();
        }
    }
};
