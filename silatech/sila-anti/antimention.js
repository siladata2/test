// ============================================
// ANTIMENTION COMMAND - Block excessive mentions (via module)
// This is a wrapper command - actual logic is in sila/antimention.js
// Powered by SILA TECH
// ============================================

import { handleAntiMentionCommand } from '../../sila/antimention.js';

export default {
    name: 'antimention',
    description: 'limit excessive mentions per message (admin only)',
    category: 'sila-anti',
    alias: ['antimention', 'mentionguard', 'mentionlimit'],
    
    async execute(sock, msg, args, prefix, config) {
        await handleAntiMentionCommand(sock, msg, args, prefix, msg.key.remoteJid,
            msg.key.participant || msg.key.remoteJid, config.BOT_NAME, config.BOT_FONT);
    }
};