// silatech/ownerinfo.js
export default {
    name: 'ownerinfo',
    description: 'show owner information',
    category: 'owner',
    alias: ['whoowner', 'ownerdetails'],
    
    async execute(sock, msg, args, prefix, config) {
        const chatId = msg.key.remoteJid;
        
        const ownerNumber = config.OWNER_NUMBER || process.env.OWNER_NUMBER || 'Not set';
        const ownerJid = config.OWNER_JID || (ownerNumber + '@s.whatsapp.net');
        
        const message = `╭━━〔 OWNER INFO 〕━━┈⊷
┃
┃ Owner Number: ${ownerNumber}
┃ Owner JID: ${ownerJid}
┃
┃ To set owner, add to .env file:
┃ OWNER_NUMBER=255XXXXXXXXX
┃
╰━━━━━━━━━━━━━━┈⊷
> ${config.POWERED_BY}`;
        
        await sock.sendMessage(chatId, { text: message }, { quoted: msg });
    }
};
