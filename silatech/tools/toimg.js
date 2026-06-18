// ============================================
// TOIMG COMMAND - Convert sticker to image
// Powered by SILA TECH
// ============================================

import { downloadContentFromMessage } from '@whiskeysockets/baileys';

export default {
    name: 'toimg',
    description: 'convert sticker to image',
    category: 'tools',
    alias: ['sticker2img', 's2i', 'toimage'],
    
    async execute(sock, msg, args, prefix, config) {
        const chatId = msg.key.remoteJid;
        
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        
        if (!quoted || !quoted.stickerMessage) {
            const message = `❌ reply to a sticker.

usage: reply to a sticker with ${prefix}toimg

> © Powered by Sila Tech`;
            
            await sock.sendMessage(chatId, { text: message }, { quoted: msg });
            return;
        }
        
        await sock.sendMessage(chatId, { react: { text: "🖼️", key: msg.key } });
        
        try {
            const stream = await downloadContentFromMessage(quoted.stickerMessage, 'sticker');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
            
            await sock.sendMessage(chatId, { image: buffer, caption: '🖼️ sticker converted to image' }, { quoted: msg });
            await sock.sendMessage(chatId, { react: { text: "✅", key: msg.key } });
            
        } catch (error) {
            await sock.sendMessage(chatId, { text: `❌ failed to convert sticker.` }, { quoted: msg });
        }
    }
};
