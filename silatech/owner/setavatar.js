// ============================================
// SETAVATAR COMMAND - Change SILA picture URL
// Owner Only
// Powered by SILA TECH
// ============================================

export default {
    name: 'setbotpic',
    description: 'Change SILA picture/image URL',
    category: 'owner',
    alias: ['silapic', 'changesila', 'setimage', 'setsilapic', 'avatar'],
    ownerOnly: true,
    
    async execute(sock, msg, args, prefix, config) {
        const chatId = msg.key.remoteJid;
        
        if (!args[0]) {
            await sock.sendMessage(chatId, { 
                text: `*╭┈┈┄⊰ SET SILA PICTURE ⊱┄┄┄◈*\n\n` +
                      `*┋ •> 🖼️ Current SILA Picture:* \n` +
                      `*┋     📍 ${config.SILA_PIC_URL || 'Not set'}*\n` +
                      `*┋*\n` +
                      `*┋ •> 📋 Usage:* ${prefix}setbotpic <image_url>\n` +
                      `*┋ •> Example:* ${prefix}setsilapic https://i.ibb.co/BKZGzcbr/Sila-cipher.jpg\n` +
                      `*┋*\n` +
                      `*┋ •> 💡 Note:* This changes the SILA picture used in menu and banners\n` +
                      `*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*\n` +
                      `${config.getFooter()}`,
                contextInfo: config.getContextInfo(msg)
            }, { quoted: msg });
            return;
        }
        
        const newSilaPicUrl = args[0];
        
        // Validate URL
        if (!newSilaPicUrl.startsWith('http://') && !newSilaPicUrl.startsWith('https://')) {
            await sock.sendMessage(chatId, { 
                text: `❌ *Invalid URL!*\n\nPlease provide a valid image URL starting with http:// or https://\n\n` +
                      `💡 *Tip:* Use image hosting sites like:\n` +
                      `• https://imgbb.com/\n` +
                      `• https://postimages.org/\n` +
                      `• https://i.ibb.co/`,
                contextInfo: config.getContextInfo(msg)
            }, { quoted: msg });
            return;
        }
        
        // Test if URL is accessible (optional but recommended)
        let isValidImage = false;
        try {
            const response = await fetch(newSilaPicUrl, { method: 'HEAD' });
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.startsWith('image/')) {
                isValidImage = true;
            }
        } catch (error) {
            // Even if test fails, still proceed but warn
            console.log('Could not validate image URL:', error.message);
        }
        
        // Update SILA_PIC_URL using config.updateConfig
        if (config.updateConfig) {
            config.updateConfig('SILA_PIC_URL', newSilaPicUrl);
            // Also update BOT_THUMBNAIL_URL if you want consistency
            config.updateConfig('BOT_THUMBNAIL_URL', newSilaPicUrl);
        } else {
            // Direct update if updateConfig not available
            config.SILA_PIC_URL = newSilaPicUrl;
            config.BOT_THUMBNAIL_URL = newSilaPicUrl;
            
            // Save to database if function exists
            if (config.saveConfigToDatabase) {
                config.saveConfigToDatabase();
            }
        }
        
        // Update process.env for compatibility
        process.env.SILA_PIC_URL = newSilaPicUrl;
        process.env.BOT_THUMBNAIL_URL = newSilaPicUrl;
        
        // Prepare response message
        let responseText = `*╭┈┈┄⊰ SILA PICTURE UPDATED ⊱┄┄┄◈*\n\n`;
        responseText += `*┋ •> 🖼️ New SILA Picture:* \n`;
        responseText += `*┋     📍 ${newSilaPicUrl}*\n`;
        responseText += `*┋*\n`;
        responseText += `*┋ •> ✅ Picture updated successfully!*\n`;
        
        if (!isValidImage && newSilaPicUrl) {
            responseText += `*┋*\n`;
            responseText += `*┋ •> ⚠️ Warning: Could not verify image URL*\n`;
            responseText += `*┋     Make sure the URL points to a valid image*\n`;
        }
        
        responseText += `*┋*\n`;
        responseText += `*┋ •> 💡 Tip:* Use ${config.getCurrentPrefix ? config.getCurrentPrefix() : prefix}menu to see the new picture\n`;
        responseText += `*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*\n`;
        responseText += `${config.getFooter()}`;
        
        await sock.sendMessage(chatId, { 
            text: responseText,
            contextInfo: config.getContextInfo(msg)
        }, { quoted: msg });
    }
};
