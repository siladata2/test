// ============================================
// ANTISTATUS COMMAND - Anti status mentions (via module)
// This is a wrapper command - actual logic is in sila/antistatus.js
// Powered by SILA TECH
// ============================================

import { handleAntiStatusCommand } from '../../sila/antistatus.js';

export default {
    name: 'antistatus',
    description: 'block status mentions (admin only)',
    category: 'sila-anti',
    alias: ['astatus', 'nostatus', 'antistatusmsg'],
    
    async execute(sock, msg, args, prefix, config) {
        await handleAntiStatusCommand(sock, msg, args, prefix, msg.key.remoteJid,
            msg.key.participant || msg.key.remoteJid, config.BOT_NAME, config.BOT_FONT);
    }
};