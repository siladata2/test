// silatech/ownerstatus.js
export default {
    name: 'ownerstatus',
    description: 'check owner registration status',
    category: 'owner',
    alias: ['ownerinfo2', 'myownerstatus'],
    
    async execute(sock, msg, args, prefix, config) {
        const chatId = msg.key.remoteJid;
        let senderJid = msg.key.participant || chatId;
        
        const { isOwnerOrSudo, getOwnerIdentifiers } = await import('../sila/isOwner.js');
        const isOwner = await isOwnerOrSudo(senderJid, sock, chatId);
        const ownerIds = getOwnerIdentifiers();
        
        let shortId = senderJid.split('@')[0];
        if (shortId.length > 20) {
            shortId = shortId.substring(0, 17) + '...';
        }
        
        const message = `╭━━〔 OWNER STATUS 〕━━┈⊷
┃
┃ Your ID: ${shortId}
┃ Owner Status: ${isOwner ? '✓ VERIFIED' : '✗ NOT VERIFIED'}
┃
┃ Registered Owner Formats:
┃ • ${ownerIds.phoneNumbers[0] || 'None'}
┃ • ${ownerIds.lidNumbers[0] || 'None'}
┃
┃ If not verified, use:
┃ ${prefix}iamowner
┃
╰━━━━━━━━━━━━━━┈⊷
> ${config.POWERED_BY}`;
        
        await sock.sendMessage(chatId, { text: message }, { quoted: msg });
    }
};
