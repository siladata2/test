// ============================================
// ANTIBUN COMMAND - Ultimate protection (via module)
// This is a wrapper command - actual logic is in sila/antibun.js
// Powered by SILA TECH
// ============================================

import { handleAntiBunCommand } from '../../sila/antibun.js';

export default {
    name: 'antibun',
    description: 'ultimate protection against all threats (admin only)',
    category: 'sila-anti',
    alias: ['antibun', 'ultimateguard', 'totalblock'],
    
    async execute(sock, msg, args, prefix, config) {
        await handleAntiBunCommand(sock, msg, args, prefix, msg.key.remoteJid,
            msg.key.participant || msg.key.remoteJid, config.BOT_NAME, config.BOT_FONT);
    }
};