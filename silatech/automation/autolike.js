// ============================================
// AUTO LIKE STATUS MODULE
// Automatically like/react to status updates
// Powered by SILA TECH
// ============================================

import { applyFont } from '../../sila/fonts/index.js';
import { getContextInfo, getFooter } from '../../silaconfig.js';
import fs from 'fs';

let autoLikeConfig = {
    enabled: true,
    emojis: ['💗', '🔥', '❤️', '👍', '😎', '💫', '👑'],
    maxRetries: 3,
    delayBetweenRetries: 1000
};

const CONFIG_FILE = './silamd/database/auto_like_config.json';

function loadConfig() {
    try {
        if (fs.existsSync(CONFIG_FILE)) {
            const saved = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
            autoLikeConfig = { ...autoLikeConfig, ...saved };
        }
    } catch (e) {}
}

function saveConfig() {
    try {
        const dir = './silamd/database';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(autoLikeConfig, null, 2));
    } catch (e) {}
}

loadConfig();

export async function handleAutoLike(sock, messageKey, participant) {
    if (!autoLikeConfig.enabled) return false;
    
    try {
        const randomEmoji = autoLikeConfig.emojis[Math.floor(Math.random() * autoLikeConfig.emojis.length)];
        let retries = autoLikeConfig.maxRetries;
        
        while (retries > 0) {
            try {
                await sock.sendMessage(
                    'status@broadcast',
                    { react: { text: randomEmoji, key: messageKey } },
                    { statusJidList: [participant] }
                );
                console.log(`Auto liked status with ${randomEmoji}`);
                return true;
            } catch (error) {
                retries--;
                if (retries === 0) throw error;
                await new Promise(r => setTimeout(r, autoLikeConfig.delayBetweenRetries));
            }
        }
    } catch (error) {
        console.error('Auto like error:', error.message);
        return false;
    }
}

export async function handleAutoLikeCommand(sock, msg, args, prefix, chatId, senderJid, isOwner) {
    if (!isOwner) {
        await sock.sendMessage(chatId, { text: 'Only the bot owner can use this command.' }, { quoted: msg });
        return;
    }
    
    if (!args[0]) {
        const status = autoLikeConfig.enabled ? 'ENABLED' : 'DISABLED';
        const poweredBy = 'SILA TECH';
        
        const message = `╭━━〔 AUTO LIKE STATUS 〕━━┈⊷
┃
┃ Status: ${status}
┃ Emojis: ${autoLikeConfig.emojis.join(', ')}
┃
┃ Usage:
┃ ${prefix}autolike on - Enable
┃ ${prefix}autolike off - Disable
┃ ${prefix}autolike emojis 💕🔥✨ - Set emojis
┃
╰━━━━━━━━━━━━━━┈⊷
> ${poweredBy}`;
        
        await sock.sendMessage(chatId, { text: message }, { quoted: msg });
        return;
    }
    
    if (args[0].toLowerCase() === 'on') {
        autoLikeConfig.enabled = true;
        saveConfig();
        await sock.sendMessage(chatId, { text: 'Auto like status has been enabled.' }, { quoted: msg });
    } else if (args[0].toLowerCase() === 'off') {
        autoLikeConfig.enabled = false;
        saveConfig();
        await sock.sendMessage(chatId, { text: 'Auto like status has been disabled.' }, { quoted: msg });
    } else if (args[0].toLowerCase() === 'emojis' && args.length > 1) {
        const emojis = args.slice(1).join('').split('');
        if (emojis.length > 0) {
            autoLikeConfig.emojis = emojis;
            saveConfig();
            await sock.sendMessage(chatId, { text: `Reaction emojis updated: ${emojis.join(', ')}` }, { quoted: msg });
        }
    } else {
        await sock.sendMessage(chatId, { text: 'Invalid option. Use on, off, or emojis' }, { quoted: msg });
    }
}

export default { 
    name: 'autolike',
    description: 'toggle auto like status',
    category: 'automation',
    alias: ['likeauto', 'autolikestatus'],
    ownerOnly: true,
    execute: async (sock, msg, args, prefix, config) => {
        const chatId = msg.key.remoteJid;
        const isOwner = await config.isOwnerAsync(msg);
        
        if (!isOwner) {
            await sock.sendMessage(chatId, { text: 'Only the bot owner can use this command.' }, { quoted: msg });
            return;
        }
        
        await handleAutoLikeCommand(sock, msg, args, prefix, chatId, msg.key.participant || chatId, isOwner);
    }
};
