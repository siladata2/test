// ============================================
// ANTIBOTS COMMAND - Block bot accounts (via module)
// This is a wrapper command - actual logic is in sila/antibots.js
// Powered by SILA TECH
// ============================================

import { handleAntiBotCommand } from '../../sila/antibots.js';

export default {
    name: 'antibots',
    description: 'block bot accounts from messaging (admin only)',
    category: 'sila-anti',
    alias: ['antibots', 'botguard', 'blockbots'],
    
    async execute(sock, msg, args, prefix, config) {
        await handleAntiBotCommand(sock, msg, args, prefix, msg.key.remoteJid,
            msg.key.participant || msg.key.remoteJid, config.BOT_NAME, config.BOT_FONT);
    }
};