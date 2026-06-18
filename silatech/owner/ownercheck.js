// silatech/ownercheck.js
export default {
    name: 'ownercheck',
    description: 'check if you are owner',
    category: 'owner',
    alias: ['amioowner', 'checkowner'],
    
    async execute(sock, msg, args, prefix, config) {
        const chatId = msg.key.remoteJid;
        let senderJid = msg.key.participant || chatId;
        
        // Get owner from config
        const ownerNumber = config.OWNER_NUMBER || process.env.OWNER_NUMBER || 'Not set';
        const ownerNumberClean = ownerNumber.toString().replace('+', '').replace(/^0+/, '');
        
        // Clean sender JID
        let senderClean = senderJid.split('@')[0];
        if (senderClean.includes(':')) senderClean = senderClean.split(':')[0];
        
        // Check if owner
        let isOwner = false;
        
        // Compare with owner number
        if (ownerNumberClean === senderClean) {
            isOwner = true;
        }
        
        // Also check using config.OWNER_JID
        if (config.OWNER_JID && config.OWNER_JID === senderJid) {
            isOwner = true;
        }
        
        // Check using jidManager
        if (config.jidManager && !isOwner) {
            try {
                isOwner = await config.jidManager.isOwner(msg, sock);
            } catch(e) {}
        }
        
        const message = `╭━━〔 OWNER CHECK 〕━━┈⊷
┃
┃ Your JID: ${senderJid}
┃ Clean ID: ${senderClean}
┃ Owner Number in .env: ${ownerNumberClean}
┃
┃ Status: ${isOwner ? '✓ YOU ARE THE OWNER' : '✗ YOU ARE NOT THE OWNER'}
┃
┃ Chat Type: ${chatId.endsWith('@g.us') ? 'Group' : 'Private Chat'}
┃
╰━━━━━━━━━━━━━━┈⊷
> ${config.POWERED_BY}`;
        
        await sock.sendMessage(chatId, { text: message }, { quoted: msg });
    }
};
