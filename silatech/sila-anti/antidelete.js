// ============================================
// ANTIDELETE COMMAND - Anti message delete (via module)
// This is a wrapper command - actual logic is in sila/antidelete.js
// Powered by SILA TECH
// ============================================

import { handleAntiDeleteCommand } from '../../sila/antidelete.js';

export default {
    name: 'antidelete',
    description: 'detect and report deleted messages (admin only)',
    category: 'sila-anti',
    alias: ['antidel', 'deleteguard', 'delprotect'],
    
    async execute(sock, msg, args, prefix, config) {
        await handleAntiDeleteCommand(sock, msg, args, prefix, msg.key.remoteJid,
            msg.key.participant || msg.key.remoteJid, config.BOT_NAME, config.BOT_FONT);
    }
};