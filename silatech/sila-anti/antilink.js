// ============================================
// ANTILINK COMMAND - Anti group links (via module)
// This is a wrapper command - actual logic is in sila/antilink.js
// Powered by SILA TECH
// ============================================

import { handleAntiLinkCommand } from '../../sila/antilink.js';

export default {
    name: 'antilink',
    description: 'block whatsapp group links (admin only)',
    category: 'sila-anti',
    alias: ['antilinkgroup', 'linkguard', 'dellink'],
    
    async execute(sock, msg, args, prefix, config) {
        // Call the actual module function
        await handleAntiLinkCommand(sock, msg, args, prefix, msg.key.remoteJid, 
            msg.key.participant || msg.key.remoteJid, config.BOT_NAME, config.BOT_FONT);
    }
};