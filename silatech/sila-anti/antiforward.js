// ============================================
// ANTIFORWARD COMMAND - Block forwarded messages (via module)
// This is a wrapper command - actual logic is in sila/antiforward.js
// Powered by SILA TECH
// ============================================

import { handleAntiForwardCommand } from '../../sila/antiforward.js';

export default {
    name: 'antiforward',
    description: 'block forwarded messages (admin only)',
    category: 'sila-anti',
    alias: ['antiforward', 'forwardguard', 'blockfw'],
    
    async execute(sock, msg, args, prefix, config) {
        await handleAntiForwardCommand(sock, msg, args, prefix, msg.key.remoteJid,
            msg.key.participant || msg.key.remoteJid, config.BOT_NAME, config.BOT_FONT);
    }
};