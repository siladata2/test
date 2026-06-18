// ============================================
// TRASH COMMAND - Delete bot's message
// Powered by SILA TECH
// ============================================

export default {
    name: 'trash',
    description: 'delete bot\'s replied message',
    category: 'tools',
    alias: ['del', 'delete', 'remove'],
    
    async execute(sock, msg, args, prefix, config) {
        const chatId = msg.key.remoteJid;
        const isOwner = await config.isOwnerAsync(msg);
        
        if (!isOwner) {
            await sock.sendMessage(chatId, { text: '❌ owner only command.' }, { quoted: msg });
            return;
        }
        
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        
        if (!quoted) {
            const message = `❌ reply to a message to delete it.

usage: reply to a message with ${prefix}trash

> © Powered by Sila Tech`;
            
            await sock.sendMessage(chatId, { text: message }, { quoted: msg });
            return;
        }
        
        const quotedKey = msg.message.extendedTextMessage.contextInfo.stanzaId;
        const quotedParticipant = msg.message.extendedTextMessage.contextInfo.participant;
        
        try {
            await sock.sendMessage(chatId, { delete: { remoteJid: chatId, fromMe: true, id: quotedKey, participant: quotedParticipant } });
            await sock.sendMessage(chatId, { react: { text: "🗑️", key: msg.key } });
        } catch (error) {
            await sock.sendMessage(chatId, { text: `❌ failed to delete message.` }, { quoted: msg });
        }
    }
};
