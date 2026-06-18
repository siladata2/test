// ============================================
// ANTIFAKE COMMAND - Block fake accounts (via module)
// This is a wrapper command - actual logic is in sila/antifake.js
// Powered by SILA TECH
// ============================================

import { handleAntiFakeCommand } from '../../sila/antifake.js';

export default {
    name: 'antifake',
    description: 'block fake or suspicious accounts (admin only)',
    category: 'sila-anti',
    alias: ['antifake', 'fakeguard', 'verify'],
    
    async execute(sock, msg, args, prefix, config) {
        await handleAntiFakeCommand(sock, msg, args, prefix, msg.key.remoteJid,
            msg.key.participant || msg.key.remoteJid, config.BOT_NAME, config.BOT_FONT);
    }
};