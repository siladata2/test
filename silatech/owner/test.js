// ============================================
// TEST COMMAND - Universal Owner Only Command
// Works with LID, Phone Numbers, WhatsApp JIDs
// Powered by SILA TECH
// ============================================

export default {
    name: 'test',
    description: 'test command for owner only - universal version',
    category: 'owner',
    alias: ['t', 'testing', 'check', 'ownercheck'],
    
    async execute(sock, msg, args, prefix, config) {
        const chatId = msg.key.remoteJid;
        let senderJid = msg.key.participant || chatId;
        const isGroup = chatId.endsWith('@g.us');
        
        // Use the universal isOwnerOrSudo function
        let isOwner = false;
        
        try {
            const { isOwnerOrSudo } = await import('../sila/isOwner.js');
            isOwner = await isOwnerOrSudo(senderJid, sock, chatId);
        } catch (error) {
            console.error('Error checking owner:', error);
        }
        
        // Also check if message is from bot itself
        if (msg.key.fromMe) {
            isOwner = true;
        }
        
        // If not owner, show access denied
        if (!isOwner) {
            const errorMsg = `╭━━〔 ACCESS DENIED 〕━━┈⊷
┃
┃ This command is only for bot owner
┃
┃ Chat Type: ${isGroup ? 'Group' : 'Private Chat'}
┃ Your ID: ${senderJid.split('@')[0].substring(0, 20)}...
┃
┃ To become owner, use:
┃ ${prefix}iamowner
┃
╰━━━━━━━━━━━━━━┈⊷
> ${config.POWERED_BY}`;
            
            await sock.sendMessage(chatId, { text: errorMsg }, { quoted: msg });
            return;
        }
        
        // Get current font
        const currentFont = config.BOT_FONT || 'normal';
        
        // Bot name with font
        const botName = config.applyFont(config.BOT_NAME, currentFont);
        
        // Get sender short ID for display
        let shortId = senderJid.split('@')[0];
        if (shortId.length > 15) {
            shortId = shortId.substring(0, 10) + '...';
        }
        
        // Get current time
        const now = new Date();
        const timeStr = now.toLocaleTimeString();
        const dateStr = now.toLocaleDateString();
        
        // Build success message
        const message = `╭━━〔 OWNER TEST 〕━━┈⊷
┃
┃ Bot: ${botName}
┃ Status: Online ✓
┃ Owner: Verified ✓
┃ User: ${shortId}
┃ Time: ${timeStr}
┃ Date: ${dateStr}
┃ Type: ${isGroup ? 'Group Chat' : 'Private Chat'}
┃
┃ You have full access to all owner commands
┃
╰━━━━━━━━━━━━━━┈⊷
> ${config.POWERED_BY}`;
        
        // Send with auto font
        if (config.sendStyledMessage) {
            await config.sendStyledMessage(sock, chatId, message, { quoted: msg });
        } else {
            await sock.sendMessage(chatId, { text: message }, { quoted: msg });
        }
    }
};
