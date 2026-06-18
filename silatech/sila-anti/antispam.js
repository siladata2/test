// ============================================
// ANTISPAM COMMAND - Block message spam (via module)
// This is a wrapper command - actual logic is in sila/antispam.js
// Powered by SILA TECH
// ============================================

import { handleAntiSpamCommand } from '../../sila/antispam.js';

export default {
    name: 'antispam',
    description: 'prevent message spamming (admin only)',
    category: 'sila-anti',
    alias: ['antispam', 'spamguard', 'slowmode'],
    
    async execute(sock, msg, args, prefix, config) {
        await handleAntiSpamCommand(sock, msg, args, prefix, msg.key.remoteJid,
            msg.key.participant || msg.key.remoteJid, config.BOT_NAME, config.BOT_FONT);
    }
};