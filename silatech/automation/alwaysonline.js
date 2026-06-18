// ============================================
// ALWAYS ONLINE MODULE
// Keep bot always online with custom presence
// Powered by SILA TECH
// ============================================

import { applyFont } from '../../sila/fonts/index.js';
import { getContextInfo, getFooter } from '../../silaconfig.js';
import fs from 'fs';

let alwaysOnlineConfig = {
    enabled: true,
    presence: 'available',
    updateInterval: 30000
};

let onlineInterval = null;
const CONFIG_FILE = './silamd/database/always_online_config.json';

function loadConfig() {
    try {
        if (fs.existsSync(CONFIG_FILE)) {
            const saved = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
            alwaysOnlineConfig = { ...alwaysOnlineConfig, ...saved };
        }
    } catch (e) {}
}

function saveConfig() {
    try {
        const dir = './silamd/database';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(alwaysOnlineConfig, null, 2));
    } catch (e) {}
}

loadConfig();

export function startAlwaysOnline(sock) {
    if (onlineInterval) clearInterval(onlineInterval);
    
    if (!alwaysOnlineConfig.enabled) return;
    
    onlineInterval = setInterval(async () => {
        try {
            await sock.sendPresenceUpdate(alwaysOnlineConfig.presence);
        } catch (error) {
            console.error('Always online error:', error.message);
        }
    }, alwaysOnlineConfig.updateInterval);
}

export function stopAlwaysOnline() {
    if (onlineInterval) {
        clearInterval(onlineInterval);
        onlineInterval = null;
    }
}

export async function handleAlwaysOnlineCommand(sock, msg, args, prefix, chatId, senderJid, isOwner) {
    if (!isOwner) {
        await sock.sendMessage(chatId, { text: 'Only the bot owner can use this command.' }, { quoted: msg });
        return;
    }
    
    if (!args[0]) {
        const status = alwaysOnlineConfig.enabled ? 'ENABLED' : 'DISABLED';
        const poweredBy = 'SILA TECH';
        
        const message = `╭━━〔 ALWAYS ONLINE 〕━━┈⊷
┃
┃ Status: ${status}
┃ Presence: ${alwaysOnlineConfig.presence}
┃
┃ Usage:
┃ ${prefix}alwaysonline on - Enable
┃ ${prefix}alwaysonline off - Disable
┃ ${prefix}alwaysonline presence available/unavailable - Set presence
┃
╰━━━━━━━━━━━━━━┈⊷
> ${poweredBy}`;
        
        await sock.sendMessage(chatId, { text: message }, { quoted: msg });
        return;
    }
    
    if (args[0].toLowerCase() === 'on') {
        alwaysOnlineConfig.enabled = true;
        saveConfig();
        startAlwaysOnline(sock);
        await sock.sendMessage(chatId, { text: 'Always online has been enabled.' }, { quoted: msg });
    } else if (args[0].toLowerCase() === 'off') {
        alwaysOnlineConfig.enabled = false;
        saveConfig();
        stopAlwaysOnline();
        await sock.sendMessage(chatId, { text: 'Always online has been disabled.' }, { quoted: msg });
    } else if (args[0].toLowerCase() === 'presence' && args.length > 1) {
        const presence = args[1].toLowerCase();
        if (presence === 'available' || presence === 'unavailable') {
            alwaysOnlineConfig.presence = presence;
            saveConfig();
            if (alwaysOnlineConfig.enabled) {
                stopAlwaysOnline();
                startAlwaysOnline(sock);
            }
            await sock.sendMessage(chatId, { text: `Presence updated: ${presence}` }, { quoted: msg });
        } else {
            await sock.sendMessage(chatId, { text: 'Invalid presence. Use available or unavailable' }, { quoted: msg });
        }
    } else {
        await sock.sendMessage(chatId, { text: 'Invalid option. Use on, off, or presence' }, { quoted: msg });
    }
}

export default { 
    name: 'alwaysonline',
    description: 'toggle always online',
    category: 'automation',
    alias: ['lastseen', 'stayonline'],
    ownerOnly: true,
    execute: async (sock, msg, args, prefix, config) => {
        const chatId = msg.key.remoteJid;
        const isOwner = await config.isOwnerAsync(msg);
        
        if (!isOwner) {
            await sock.sendMessage(chatId, { text: 'Only the bot owner can use this command.' }, { quoted: msg });
            return;
        }
        
        await handleAlwaysOnlineCommand(sock, msg, args, prefix, chatId, msg.key.participant || chatId, isOwner);
    }
};
