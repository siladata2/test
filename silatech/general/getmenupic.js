// ============================================
// GETMENUPIC COMMAND - Get current menu picture
// Powered by SILA TECH
// ============================================

export default {
    name: 'getmenupic',
    description: 'Get current menu banner image URL',
    category: 'general',
    alias: ['menupic', 'menubanner', 'getbanner'],
    
    async execute(sock, msg, args, prefix, config) {
        const chatId = msg.key.remoteJid;
        
        const currentPicUrl = config.SILA_PIC_URL || 'https://i.ibb.co/BKZGzcbr/Sila-cipher.jpg';
        
        const styledName = config.applyFont(config.BOT_NAME, config.BOT_FONT);
        
        // Try to send the image directly
        try {
            const response = await fetch(currentPicUrl);
            if (response.ok) {
                const buffer = await response.arrayBuffer();
                
                const message = `*╭┈┈┄⊰ ${styledName} - MENU PICTURE ⊱┄┄┄◈*
┋
┋ •> 🖼️ *Current Menu Banner*
┋
┋ •> 🔗 *URL:* ${currentPicUrl}
┋
┋ •> 📝 *To change:* ${prefix}setmenupic <image_or_url>
┋
╰┄┄┄┄┄┈┈┈┈┄┄┄◈
> ® ${config.POWERED_BY}`;
                
                await sock.sendMessage(chatId, {
                    image: Buffer.from(buffer),
                    caption: message,
                    mimetype: 'image/png',
                    contextInfo: config.getContextInfo(msg)
                }, { quoted: msg });
            } else {
                throw new Error('Failed to fetch');
            }
        } catch (error) {
            // If image fails to send, send just the URL
            const message = `*╭┈┈┄⊰ ${styledName} - MENU PICTURE ⊱┄┄┄◈*
┋
┋ •> 🖼️ *Current Menu Banner URL:*
┋ •> ${currentPicUrl}
┋
┋ •> 📝 *To change:* ${prefix}setmenupic <image_or_url>
┋
╰┄┄┄┄┄┈┈┈┈┄┄┄◈
> ® ${config.POWERED_BY}`;
            
            if (config.sendStyledMessage) {
                await config.sendStyledMessage(sock, chatId, message, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: message }, { quoted: msg });
            }
        }
    }
};
