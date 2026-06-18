// ============================================
// SAVE COMMAND - Save status (reply to status)
// Powered by SILA TECH
// ============================================

import { downloadContentFromMessage } from '@whiskeysockets/baileys';

export default {
    name: 'save',
    description: 'save status (reply to any status)',
    category: 'tools',
    alias: ['savestatus', 'dlstatus', 'getstatus'],
    
    async execute(sock, msg, args, prefix, config) {
        const chatId = msg.key.remoteJid;
        
        // Check if replying to a status
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        
        if (!quoted) {
            const message = `❌ reply to a status to save it.

example: reply to any status and type ${prefix}save

> © Powered by Sila Tech`;
            
            if (config.sendStyledMessage) {
                await config.sendStyledMessage(sock, chatId, message, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: message }, { quoted: msg });
            }
            return;
        }
        
        // Check if it's a status
        const isStatus = msg.message?.extendedTextMessage?.contextInfo?.remoteJid === 'status@broadcast';
        
        if (!isStatus) {
            const message = `❌ this is not a status. reply to a status to save it.

> © Powered by Sila Tech`;
            
            await sock.sendMessage(chatId, { text: message }, { quoted: msg });
            return;
        }
        
        const mediaMessage = quoted.imageMessage || quoted.videoMessage || quoted.audioMessage;
        
        if (!mediaMessage) {
            await sock.sendMessage(chatId, { text: '❌ no media found in this status.' }, { quoted: msg });
            return;
        }
        
        await sock.sendMessage(chatId, { react: { text: "💾", key: msg.key } });
        
        try {
            const type = mediaMessage.imageMessage ? 'image' : (mediaMessage.videoMessage ? 'video' : 'audio');
            const stream = await downloadContentFromMessage(mediaMessage, type);
            
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }
            
            const caption = mediaMessage.caption || '';
            
            if (type === 'image') {
                await sock.sendMessage(chatId, { image: buffer, caption: `💾 status saved\n\n${caption}` }, { quoted: msg });
            } else if (type === 'video') {
                await sock.sendMessage(chatId, { video: buffer, caption: `💾 status saved\n\n${caption}` }, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { audio: buffer, mimetype: 'audio/mp4' }, { quoted: msg });
            }
            
            await sock.sendMessage(chatId, { react: { text: "✅", key: msg.key } });
            
        } catch (error) {
            await sock.sendMessage(chatId, { text: `❌ failed to save status.` }, { quoted: msg });
        }
    }
};
