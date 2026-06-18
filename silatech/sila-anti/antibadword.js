// ============================================
// ANTIBADWORD COMMAND - Block bad words (via module)
// This is a wrapper command - actual logic is in sila/antibadword.js
// Powered by SILA TECH
// ============================================

import { handleAntiBadwordCommand } from '../../sila/antibadword.js';

export default {
    name: 'antibadword',
    description: 'block bad language and profanity (admin only)',
    category: 'sila-anti',
    alias: ['antibad', 'badwordfilter', 'profanity'],
    
    async execute(sock, msg, args, prefix, config) {
        await handleAntiBadwordCommand(sock, msg, args, prefix, msg.key.remoteJid,
            msg.key.participant || msg.key.remoteJid, config.BOT_NAME, config.BOT_FONT);
    }
};