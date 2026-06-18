// ============================================
// AUTO VIEW STATUS MODULE
// Automatically view status updates
// Powered by SILA TECH
// ============================================

import fs from 'fs';

let autoViewConfig = {
    enabled: true,
    maxRetries: 3,
    delayBetweenRetries: 1000,
    autoRecording: true
};

const CONFIG_FILE = './silamd/database/auto_view_config.json';

function loadConfig() {
    try {
        if (fs.existsSync(CONFIG_FILE)) {
            const saved = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
            autoViewConfig = { ...autoViewConfig, ...saved };
        }
    } catch (e) {}
}

function saveConfig() {
    try {
        const dir = './silamd/database';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(autoViewConfig, null, 2));
    } catch (e) {}
}

loadConfig();

export async function handleAutoView(sock, messageKey) {
    if (!autoViewConfig.enabled) return false;
    
    try {
        let retries = autoViewConfig.maxRetries;
        
        while (retries > 0) {
            try {
                await sock.readMessages([messageKey]);
                console.log('Auto viewed status');
                return true;
            } catch (error) {
                retries--;
                if (retries === 0) throw error;
                await new Promise(r => setTimeout(r, autoViewConfig.delayBetweenRetries));
            }
        }
    } catch (error) {
        console.error('Auto view error:', error.message);
        return false;
    }
}

export async function handleAutoRecording(sock, chatId) {
    if (!autoViewConfig.autoRecording) return;
    
    try {
        await sock.sendPresenceUpdate('recording', chatId);
    } catch (e) {}
}

export async function handleAutoViewCommand(sock, msg, args, prefix, chatId, senderJid, isOwner) {
    if (!isOwner) {
        await sock.sendMessage(chatId, { text: 'Only the bot owner can use this command.' }, { quoted: msg });
        return;
    }
    
    if (!args[0]) {
        const status = autoViewConfig.enabled ? 'ENABLED' : 'DISABLED';
        const recordingStatus = autoViewConfig.autoRecording ? 'ON' : 'OFF';
        
        const message = `╭━━〔 AUTO VIEW STATUS 〕━━┈⊷
┃
┃ Status: ${status}
┃ Recording: ${recordingStatus}
┃
┃ Usage:
┃ ${prefix}autoview on - Enable
┃ ${prefix}autoview off - Disable
┃ ${prefix}autoview recording on/off - Toggle recording
┃
╰━━━━━━━━━━━━━━┈⊷
> SILA TECH`;
        
        await sock.sendMessage(chatId, { text: message }, { quoted: msg });
        return;
    }
    
    if (args[0].toLowerCase() === 'on') {
        autoViewConfig.enabled = true;
        saveConfig();
        await sock.sendMessage(chatId, { text: 'Auto view status has been enabled.' }, { quoted: msg });
    } else if (args[0].toLowerCase() === 'off') {
        autoViewConfig.enabled = false;
        saveConfig();
        await sock.sendMessage(chatId, { text: 'Auto view status has been disabled.' }, { quoted: msg });
    } else if (args[0].toLowerCase() === 'recording' && args[1]) {
        if (args[1].toLowerCase() === 'on') {
            autoViewConfig.autoRecording = true;
            saveConfig();
            await sock.sendMessage(chatId, { text: 'Auto recording has been enabled.' }, { quoted: msg });
        } else if (args[1].toLowerCase() === 'off') {
            autoViewConfig.autoRecording = false;
            saveConfig();
            await sock.sendMessage(chatId, { text: 'Auto recording has been disabled.' }, { quoted: msg });
        }
    } else {
        await sock.sendMessage(chatId, { text: 'Invalid option. Use on, off, or recording' }, { quoted: msg });
    }
}

export default { 
    name: 'autoview',
    description: 'toggle auto view status',
    category: 'automation',
    alias: ['viewauto', 'autoviewstatus'],
    ownerOnly: true,
    execute: async (sock, msg, args, prefix, config) => {
        const chatId = msg.key.remoteJid;
        const senderJid = msg.key.participant || chatId;
        
        // Simple owner check using config
        let isOwner = false;
        const ownerNumber = config.OWNER_NUMBER || process.env.OWNER_NUMBER || '';
        const senderClean = senderJid.split('@')[0].split(':')[0];
        
        if (ownerNumber && (senderClean === ownerNumber || ownerNumber.includes(senderClean) || senderClean.includes(ownerNumber))) {
            isOwner = true;
        }
        
        if (config.jidManager && !isOwner) {
            try {
                isOwner = await config.jidManager.isOwner(msg, sock);
            } catch(e) {}
        }
        
        if (!isOwner) {
            await sock.sendMessage(chatId, { text: 'Only the bot owner can use this command.' }, { quoted: msg });
            return;
        }
        
        await handleAutoViewCommand(sock, msg, args, prefix, chatId, senderJid, isOwner);
    }
};
