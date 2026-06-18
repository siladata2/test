// ============================================
// ANTIBUG COMMAND - Block bug/crash messages (via module)
// This is a wrapper command - actual logic is in sila/antibug.js
// Powered by SILA TECH
// ============================================

import { handleAntiBugCommand } from '../../sila/antibug.js';

export default {
    name: 'antibug',
    description: 'block harmful/bug messages (admin only)',
    category: 'sila-anti',
    alias: ['antibug', 'bugguard', 'crashblock'],
    
    async execute(sock, msg, args, prefix, config) {
        await handleAntiBugCommand(sock, msg, args, prefix, msg.key.remoteJid,
            msg.key.participant || msg.key.remoteJid, config.BOT_NAME, config.BOT_FONT);
    }
};