// ============================================
// STICKER COMMAND - Convert image/video to sticker
// Powered by SILA TECH
// ============================================

export default {
    name: 'sticker',
    description: 'convert image or video to sticker',
    category: 'tools',
    alias: ['s', 'sticker', 'stick'],
    
    async execute(sock, msg, args, prefix, config) {
        const chatId = msg.key.remoteJid;
        
        // Get media from message or quoted
        let mediaBuffer = null;
        let isVideo = false;
        
        // Check if replying to a message
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        
        if (quoted) {
            if (quoted.imageMessage) {
                const stream = await downloadContentFromMessage(quoted.imageMessage, 'image');
                let buffer = Buffer.from([]);
                for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
                mediaBuffer = buffer;
            } else if (quoted.videoMessage) {
                const stream = await downloadContentFromMessage(quoted.videoMessage, 'video');
                let buffer = Buffer.from([]);
                for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
                mediaBuffer = buffer;
                isVideo = true;
            }
        } else if (msg.message?.imageMessage) {
            const stream = await downloadContentFromMessage(msg.message.imageMessage, 'image');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
            mediaBuffer = buffer;
        } else if (msg.message?.videoMessage) {
            const stream = await downloadContentFromMessage(msg.message.videoMessage, 'video');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
            mediaBuffer = buffer;
            isVideo = true;
        }
        
        if (!mediaBuffer) {
            const message = `❌ send or reply to an image/video.

usage: ${prefix}sticker (with image)
reply to image/video with ${prefix}sticker

> © Powered by Sila Tech`;
            
            await sock.sendMessage(chatId, { text: message }, { quoted: msg });
            return;
        }
        
        await sock.sendMessage(chatId, { react: { text: "🎨", key: msg.key } });
        
        try {
            await sock.sendMessage(chatId, {
                sticker: mediaBuffer,
                mimetype: 'image/webp'
            }, { quoted: msg });
            
            await sock.sendMessage(chatId, { react: { text: "✅", key: msg.key } });
            
        } catch (error) {
            await sock.sendMessage(chatId, { text: `❌ failed to create sticker.` }, { quoted: msg });
        }
    }
};
