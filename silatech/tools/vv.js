// ============================================
// VV COMMAND - Reveal view-once images and videos
// Powered by SILA TECH
// ============================================

import { downloadContentFromMessage } from '@whiskeysockets/baileys';

export default {
    name: 'vv',
    description: 'reveal view-once images and videos',
    category: 'tools',
    alias: ['viewonce', 'reveal', 'vo'],
    
    async execute(sock, msg, args, prefix, config) {
        const chatId = msg.key.remoteJid;
        
        // Check if replying to a message
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        
        if (!quoted) {
            const message = `❌ reply to a view-once image or video.

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
        
        // Random reaction emoji
        const reactionEmojis = ['🔥', '⚡', '🚀', '💨', '🎯', '🎉', '🌟', '💥', '👁️'];
        const reactEmoji = reactionEmojis[Math.floor(Math.random() * reactionEmojis.length)];
        
        // Send reaction
        await sock.sendMessage(chatId, { react: { text: reactEmoji, key: msg.key } });
        
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
            
            // Send revealed media
            if (isImage) {
                await sock.sendMessage(chatId, {
                    image: buffer,
                    caption: mediaMessage.caption || '',
                    contextInfo: config.getContextInfo(msg)
                }, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, {
                    video: buffer,
                    caption: mediaMessage.caption || '',
                    contextInfo: config.getContextInfo(msg)
                }, { quoted: msg });
            }
            
        } catch (error) {
            console.error('View Once Error:', error);
            
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
