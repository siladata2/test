// ============================================
// ANTITAG COMMAND - Block excessive tagging (via module)
// This is a wrapper command - actual logic is in sila/antitag.js
// Powered by SILA TECH
// ============================================

import { handleAntiTagCommand } from '../../sila/antitag.js';

export default {
    name: 'antitag',
    description: 'limit excessive tagging/mentions (admin only)',
    category: 'sila-anti',
    alias: ['antitag', 'tagguard', 'mentionlimit'],
    
    async execute(sock, msg, args, prefix, config) {
        await handleAntiTagCommand(sock, msg, args, prefix, msg.key.remoteJid,
            msg.key.participant || msg.key.remoteJid, config.BOT_NAME, config.BOT_FONT);
    }
};