// ============================================
// VVINBOX COMMAND - Reveal view-once media to owner inbox
// Powered by SILA TECH
// ============================================

import { downloadContentFromMessage } from '@whiskeysockets/baileys';

export default {
    name: 'vvinbox',
    description: 'reveal view-once media and send to owner inbox',
    category: 'tools',
    alias: ['vvdm', 'vvinbox', 'vvo', 'vvinbox'],
    
    async execute(sock, msg, args, prefix, config) {
        const chatId = msg.key.remoteJid;
        const senderJid = msg.key.participant || msg.key.remoteJid;
        
        // Get owner JID
        const ownerJid = config.OWNER_CLEAN_JID || config.OWNER_JID || ownerNumber + '@s.whatsapp.net';
        const ownerNumber = config.OWNER_CLEAN_NUMBER || config.OWNER_NUMBER;
        
        // Check if replying to a message
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        
        if (!quoted) {
            const message = `❌ reply to a view-once image or video.

the media will be sent to owner's inbox.

> © Powered by Sila Tech`;
            
            if (config.sendStyledMessage) {
                await config.sendStyledMessage(sock, chatId, message, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: message }, { quoted: msg });
            }
            return;
        }
        
        // Handle view-once wrapper
        const viewOnceMsg = quoted.viewOnceMessageV2 || quoted.viewOnceMessage || null;
        
        const mediaMessage = viewOnceMsg?.message?.imageMessage ||
            viewOnceMsg?.message?.videoMessage ||
            quoted.imageMessage ||
            quoted.videoMessage;
        
        if (!mediaMessage) {
            const message = `❌ unsupported message type.

> © Powered by Sila Tech`;
            
            if (config.sendStyledMessage) {
                await config.sendStyledMessage(sock, chatId, message, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: message }, { quoted: msg });
            }
            return;
        }
        
        const isImage = !!mediaMessage.imageMessage || mediaMessage.mimetype?.startsWith("image");
        const isVideo = !!mediaMessage.videoMessage || mediaMessage.mimetype?.startsWith("video");
        
        // Check if view-once
        if (!mediaMessage.viewOnce) {
            const message = `❌ this is not a view-once media.

> © Powered by Sila Tech`;
            
            if (config.sendStyledMessage) {
                await config.sendStyledMessage(sock, chatId, message, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: message }, { quoted: msg });
            }
            return;
        }
        
        // Send reaction
        await sock.sendMessage(chatId, { react: { text: "📤", key: msg.key } });
        
        // Send confirmation to group/DM
        const senderName = senderJid.split('@')[0];
        const confirmMsg = `📤 view-once media detected from @${senderName}. sending to owner inbox...`;
        
        await sock.sendMessage(chatId, { 
            text: confirmMsg,
            contextInfo: { mentionedJid: [senderJid] }
        }, { quoted: msg });
        
        try {
            // Download media
            const stream = await downloadContentFromMessage(
                mediaMessage,
                isImage ? "image" : "video"
            );
            
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }
            
            const timestamp = new Date().toLocaleString();
            const caption = mediaMessage.caption || '';
            
            // Prepare info message for owner
            const infoText = `╭━━〔 👁️ VIEW-ONCE REVEALED 〕━━┈⊷
┃
┃ 📅 date: ${timestamp}
┃ 👤 from: @${senderName}
┃ 📱 number: +${senderName}
┃ 📍 chat: ${chatId.includes('@g.us') ? 'group' : 'private'}
┃ 📝 caption: ${caption || 'no caption'}
┃
╰━━━━━━━━━━━━━━━━━━┈⊷
> © Powered by Sila Tech`;
            
            // Send to owner inbox
            if (isImage) {
                await sock.sendMessage(ownerJid, {
                    image: buffer,
                    caption: infoText,
                    contextInfo: { mentionedJid: [senderJid] }
                });
            } else {
                await sock.sendMessage(ownerJid, {
                    video: buffer,
                    caption: infoText,
                    contextInfo: { mentionedJid: [senderJid] }
                });
            }
            
            // Send success message to chat
            const successMsg = `✅ view-once media has been sent to owner inbox.

> © Powered by Sila Tech`;
            
            await sock.sendMessage(chatId, { text: successMsg }, { quoted: msg });
            
            // Send reaction
            await sock.sendMessage(chatId, { react: { text: "✅", key: msg.key } });
            
        } catch (error) {
            console.error('View Once Inbox Error:', error);
            
            const errorMsg = `❌ failed to reveal view-once media.

> © Powered by Sila Tech`;
            
            if (config.sendStyledMessage) {
                await config.sendStyledMessage(sock, chatId, errorMsg, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: errorMsg }, { quoted: msg });
            }
        }
    }
};
