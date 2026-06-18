// silatech/iamowner.js
export default {
    name: 'iamowner',
    description: 'register yourself as bot owner',
    category: 'owner',
    alias: ['setmeowner', 'ownerregister'],
    
    async execute(sock, msg, args, prefix, config) {
        const chatId = msg.key.remoteJid;
        let senderJid = msg.key.participant || chatId;
        
        const { registerOwner, getOwnerIdentifiers } = await import('../sila/isOwner.js');
        
        const result = await registerOwner(senderJid, sock);
        
        const ownerIds = getOwnerIdentifiers();
        
        const message = `╭━━〔 OWNER REGISTERED 〕━━┈⊷
┃
┃ ✓ You have been registered as owner
┃
┃ Registered formats:
┃ ${ownerIds.phoneNumbers.slice(0, 3).join('\n┃ ')}
┃
┃ Please restart the bot for changes to take effect
┃
╰━━━━━━━━━━━━━━┈⊷
> ${config.POWERED_BY}`;
        
        await sock.sendMessage(chatId, { text: message }, { quoted: msg });
        
        // Also update jidManager if available
        if (config.jidManager) {
            config.jidManager.setNewOwner(senderJid, true);
        }
    }
};
