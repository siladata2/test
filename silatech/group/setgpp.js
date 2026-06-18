// ============================================
// SETGPP COMMAND - Set group profile picture
// Group Admin Only
// Powered by SILA TECH
// ============================================

import { isAdmin } from '../../sila/isAdmin.js';
import { isOwnerOrSudo } from '../../sila/isOwner.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { downloadContentFromMessage } from '@whiskeysockets/baileys';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMP_DIR = path.join(__dirname, '../../temp');

// Ensure temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
}

export default {
    name: 'setgpp',
    description: 'Set group profile picture',
    category: 'group',
    alias: ['setgrouppp', 'setgrouppic', 'grouppp', 'gpp'],
    
    async execute(sock, msg, args, prefix, config) {
        const chatId = msg.key.remoteJid;
        const senderJid = msg.key.participant || msg.key.remoteJid;
        
        // Check if in group
        if (!chatId.endsWith('@g.us')) {
            const errorMsg = `❌ *This command can only be used in groups!*`;
            if (config.sendStyledMessage) {
                await config.sendStyledMessage(sock, chatId, errorMsg, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: errorMsg }, { quoted: msg });
            }
            return;
        }
        
        // Check if sender is admin or owner
        const adminStatus = await isAdmin(sock, chatId, senderJid);
        const isOwner = await isOwnerOrSudo(senderJid, sock, chatId);
        
        if (!adminStatus.isSenderAdmin && !isOwner) {
            const errorMsg = `❌ *Only group admins can set group profile picture!*`;
            if (config.sendStyledMessage) {
                await config.sendStyledMessage(sock, chatId, errorMsg, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: errorMsg }, { quoted: msg });
            }
            return;
        }
        
        // Check if bot is admin
        if (!adminStatus.isBotAdmin) {
            const errorMsg = `❌ *Bot needs to be admin to set group profile picture!*`;
            if (config.sendStyledMessage) {
                await config.sendStyledMessage(sock, chatId, errorMsg, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: errorMsg }, { quoted: msg });
            }
            return;
        }
        
        // Get image from message
        let imageBuffer = null;
        let imageUrl = null;
        
        // Check if replying to an image message
        if (msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage) {
            const quotedMsg = msg.message.extendedTextMessage.contextInfo.quotedMessage;
            const stream = await downloadContentFromMessage(quotedMsg.imageMessage, 'image');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }
            imageBuffer = buffer;
        }
        // Check if message has image
        else if (msg.message?.imageMessage) {
            const stream = await downloadContentFromMessage(msg.message.imageMessage, 'image');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }
            imageBuffer = buffer;
        }
        // Check if URL provided
        else if (args[0] && (args[0].startsWith('http://') || args[0].startsWith('https://'))) {
            imageUrl = args[0];
            try {
                const fetch = (await import('node-fetch')).default;
                const response = await fetch(imageUrl);
                imageBuffer = await response.buffer();
            } catch (error) {
                const errorMsg = `❌ *Failed to download image from URL!*\nError: ${error.message}`;
                if (config.sendStyledMessage) {
                    await config.sendStyledMessage(sock, chatId, errorMsg, { quoted: msg });
                } else {
                    await sock.sendMessage(chatId, { text: errorMsg }, { quoted: msg });
                }
                return;
            }
        }
        
        if (!imageBuffer) {
            const styledName = config.applyFont(config.BOT_NAME, config.BOT_FONT);
            const message = `*╭┈┈┄⊰ ${styledName} - SET GROUP PP ⊱┄┄┄◈*
┋
┋ •> 📋 *Usage:*
┋ •> Send an image with caption ${prefix}setgpp
┋ •> Reply to an image with ${prefix}setgpp
┋ •> ${prefix}setgpp <image_url>
┋
┋ •> 📝 *Example:*
┋ •> ${prefix}setgpp https://example.com/image.jpg
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
        
        // Save temporary file
        const tempFile = path.join(TEMP_DIR, `gpp_${Date.now()}.jpg`);
        fs.writeFileSync(tempFile, imageBuffer);
        
        try {
            // Update group profile picture
            await sock.updateProfilePicture(chatId, { url: tempFile });
            
            // Clean up temp file
            fs.unlinkSync(tempFile);
            
            const styledName = config.applyFont(config.BOT_NAME, config.BOT_FONT);
            const message = `*╭┈┈┄⊰ ${styledName} - GROUP PP UPDATED ⊱┄┄┄◈*
┋
┋ •> 🖼️ *Group profile picture has been updated successfully!*
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
            
        } catch (error) {
            // Clean up temp file if exists
            if (fs.existsSync(tempFile)) {
                fs.unlinkSync(tempFile);
            }
            
            const errorMsg = `❌ *Failed to update group profile picture!*\nError: ${error.message}`;
            if (config.sendStyledMessage) {
                await config.sendStyledMessage(sock, chatId, errorMsg, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: errorMsg }, { quoted: msg });
            }
        }
    }
};