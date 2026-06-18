// ============================================
// ANTIGROUPLINK COMMAND - Block external group links (via module)
// This is a wrapper command - actual logic is in sila/antigrouplink.js
// Powered by SILA TECH
// ============================================

import { handleAntiGroupLinkCommand } from '../../sila/antigrouplink.js';

export default {
    name: 'antigrouplink',
    description: 'block external whatsapp group links (admin only)',
    category: 'sila-anti',
    alias: ['antiglink', 'grouplinkguard', 'extlink'],
    
    async execute(sock, msg, args, prefix, config) {
        await handleAntiGroupLinkCommand(sock, msg, args, prefix, msg.key.remoteJid,
            msg.key.participant || msg.key.remoteJid, config.BOT_NAME, config.BOT_FONT);
    }
};