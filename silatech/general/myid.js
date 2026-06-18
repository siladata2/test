// silatech/myid.js
export default {
    name: 'myid',
    description: 'show your JID info',
    category: 'general',
    
    async execute(sock, msg, args, prefix, config) {
        const chatId = msg.key.remoteJid;
        let senderJid = msg.key.participant || chatId;
        const isGroup = chatId.endsWith('@g.us');
        
        const cleaned = senderJid.split('@')[0];
        
        const message = `╭━━〔 YOUR JID INFO 〕━━┈⊷
┃
┃ Your JID: ${senderJid}
┃ Clean ID: ${cleaned}
┃ Chat Type: ${isGroup ? 'Group' : 'Private Chat'}
┃
┃ Add to .env as owner:
┃ OWNER_NUMBER=${cleaned}
┃
╰━━━━━━━━━━━━━━┈⊷
> ${config.POWERED_BY}`;
        
        await sock.sendMessage(chatId, { text: message }, { quoted: msg });
    }
};
