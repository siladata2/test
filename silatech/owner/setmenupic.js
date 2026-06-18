// ============================================
// SETMENUPIC COMMAND - Set menu banner image using URL only
// Owner Only
// Powered by SILA TECH
// ============================================

import { isOwnerOrSudo } from '../../sila/isOwner.js';

export default {
    name: 'setmenupic',
    description: 'Set menu banner image using URL',
    category: 'owner',
    alias: ['setmenupicture', 'setbanner', 'menupic', 'setmenubanner'],
    ownerOnly: true,
    
    async execute(sock, msg, args, prefix, config) {
        const chatId = msg.key.remoteJid;
        const senderJid = msg.key.participant || msg.key.remoteJid;
        
        // Check if URL is provided
        if (!args[0]) {
            const styledName = config.applyFont(config.BOT_NAME, config.BOT_FONT);
            const message = `*╭┈┈┄⊰ ${styledName} - SET MENU PICTURE ⊱┄┄┄◈*
┋
┋ •> 📋 *Usage:*
┋ •> ${prefix}setmenupic <image_url>
┋
┋ •> 📝 *Example:*
┋ •> ${prefix}setmenupic https://i.ibb.co/BKZGzcbr/Sila-cipher.jpg
┋
┋ •> 💡 *Note:*
┋ •> Use any direct image URL (jpg, png, jpeg)
┋ •> The image will be used as the menu banner
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
        
        const imageUrl = args[0];
        
        // Validate URL
        if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
            const errorMsg = `❌ *Invalid URL!*\n\nPlease provide a valid image URL starting with http:// or https://`;
            if (config.sendStyledMessage) {
                await config.sendStyledMessage(sock, chatId, errorMsg, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: errorMsg }, { quoted: msg });
            }
            return;
        }
        
        // Validate that URL points to an image (optional check)
        try {
            const fetch = (await import('node-fetch')).default;
            const response = await fetch(imageUrl, { method: 'HEAD' });
            const contentType = response.headers.get('content-type');
            
            if (!contentType || !contentType.startsWith('image/')) {
                const warnMsg = `⚠️ *Warning:* URL might not be an image. Proceeding anyway...`;
                await sock.sendMessage(chatId, { text: warnMsg }, { quoted: msg });
            }
        } catch (error) {
            // Ignore validation errors, still proceed
            console.log('URL validation failed:', error.message);
        }
        
        // Update config with new image URL
        if (config.updateConfig) {
            config.updateConfig('SILA_PIC_URL', imageUrl);
            config.updateConfig('BOT_THUMBNAIL_URL', imageUrl);
        }
        
        const styledName = config.applyFont(config.BOT_NAME, config.BOT_FONT);
        const message = `*╭┈┈┄⊰ ${styledName} - MENU PICTURE UPDATED ⊱┄┄┄◈*
┋
┋ •> 🖼️ *Menu picture has been updated successfully!*
┋
┋ •> 🔗 *New Image URL:* 
┋ •> ${imageUrl}
┋
┋ •> 📝 *Note:* Use .menu to see the new banner
┋
┋ •> 👤 Updated by: @${senderJid.split('@')[0]}
┋
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
        
        // Preview the new image
        try {
            const fetch = (await import('node-fetch')).default;
            const response = await fetch(imageUrl);
            if (response.ok) {
                const buffer = await response.arrayBuffer();
                const previewMsg = `*🖼️ New Menu Banner Preview:*`;
                await sock.sendMessage(chatId, {
                    image: Buffer.from(buffer),
                    caption: previewMsg,
                    contextInfo: config.getContextInfo(msg)
                }, { quoted: msg });
            }
        } catch (error) {
            console.log('Preview failed:', error.message);
        }
    }
};
