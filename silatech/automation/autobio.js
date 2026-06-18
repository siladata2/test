// ============================================
// AUTO BIO MODULE
// Automatically update profile bio/status
// Powered by SILA TECH
// ============================================

import { applyFont } from '../../sila/fonts/index.js';
import { getContextInfo, getFooter } from '../../silaconfig.js';
import fs from 'fs';

let autoBioConfig = {
    enabled: false,
    texts: ['SILA SMD - Premium WhatsApp Bot'],
    interval: 30,
    currentIndex: 0
};

let bioInterval = null;
const CONFIG_FILE = './silamd/database/auto_bio_config.json';

function loadConfig() {
    try {
        if (fs.existsSync(CONFIG_FILE)) {
            const saved = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
            autoBioConfig = { ...autoBioConfig, ...saved };
        }
    } catch (e) {}
}

function saveConfig() {
    try {
        const dir = './silamd/database';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(autoBioConfig, null, 2));
    } catch (e) {}
}

loadConfig();

export function startAutoBio(sock) {
    if (bioInterval) clearInterval(bioInterval);
    
    if (!autoBioConfig.enabled) return;
    if (autoBioConfig.texts.length === 0) return;
    
    const intervalMs = autoBioConfig.interval * 60 * 1000;
    
    updateBio(sock);
    
    bioInterval = setInterval(() => {
        updateBio(sock);
    }, intervalMs);
}

async function updateBio(sock) {
    try {
        const text = autoBioConfig.texts[autoBioConfig.currentIndex % autoBioConfig.texts.length];
        await sock.updateProfileStatus(text);
        console.log(`Auto bio updated: ${text}`);
        autoBioConfig.currentIndex++;
        saveConfig();
    } catch (error) {
        console.error('Auto bio error:', error.message);
    }
}

export function stopAutoBio() {
    if (bioInterval) {
        clearInterval(bioInterval);
        bioInterval = null;
    }
}

export async function handleAutoBioCommand(sock, msg, args, prefix, chatId, senderJid, isOwner) {
    if (!isOwner) {
        await sock.sendMessage(chatId, { text: 'Only the bot owner can use this command.' }, { quoted: msg });
        return;
    }
    
    if (!args[0]) {
        const status = autoBioConfig.enabled ? 'ENABLED' : 'DISABLED';
        const poweredBy = 'SILA TECH';
        
        const message = `╭━━〔 AUTO BIO 〕━━┈⊷
┃
┃ Status: ${status}
┃ Current Bio: ${autoBioConfig.texts[autoBioConfig.currentIndex] || autoBioConfig.texts[0]}
┃ Interval: ${autoBioConfig.interval} minutes
┃ Total Bios: ${autoBioConfig.texts.length}
┃
┃ Usage:
┃ ${prefix}autobio on - Enable
┃ ${prefix}autobio off - Disable
┃ ${prefix}autobio text <bio> - Add bio text
┃ ${prefix}autobio interval <minutes> - Set interval
┃ ${prefix}autobio list - List all bios
┃ ${prefix}autobio remove <number> - Remove bio
┃
╰━━━━━━━━━━━━━━┈⊷
> ${poweredBy}`;
        
        await sock.sendMessage(chatId, { text: message }, { quoted: msg });
        return;
    }
    
    if (args[0].toLowerCase() === 'on') {
        autoBioConfig.enabled = true;
        saveConfig();
        startAutoBio(sock);
        await sock.sendMessage(chatId, { text: 'Auto bio has been enabled.' }, { quoted: msg });
    } else if (args[0].toLowerCase() === 'off') {
        autoBioConfig.enabled = false;
        saveConfig();
        stopAutoBio();
        await sock.sendMessage(chatId, { text: 'Auto bio has been disabled.' }, { quoted: msg });
    } else if (args[0].toLowerCase() === 'text' && args.length > 1) {
        const text = args.slice(1).join(' ');
        autoBioConfig.texts.push(text);
        saveConfig();
        if (autoBioConfig.enabled) {
            stopAutoBio();
            startAutoBio(sock);
        }
        await sock.sendMessage(chatId, { text: `Bio text added: "${text}"` }, { quoted: msg });
    } else if (args[0].toLowerCase() === 'interval' && args.length > 1) {
        const interval = parseInt(args[1]);
        if (interval > 0) {
            autoBioConfig.interval = interval;
            saveConfig();
            if (autoBioConfig.enabled) {
                stopAutoBio();
                startAutoBio(sock);
            }
            await sock.sendMessage(chatId, { text: `Bio interval updated: ${interval} minutes` }, { quoted: msg });
        }
    } else if (args[0].toLowerCase() === 'list') {
        let bioList = '╭━━〔 BIO LIST 〕━━┈⊷\n┃\n';
        autoBioConfig.texts.forEach((bio, index) => {
            const marker = index === autoBioConfig.currentIndex ? '>' : '-';
            bioList += `┃ ${marker} ${index + 1}. ${bio.substring(0, 50)}${bio.length > 50 ? '...' : ''}\n`;
        });
        bioList += `┃\n╰━━━━━━━━━━━━━━┈⊷\n> SILA TECH`;
        await sock.sendMessage(chatId, { text: bioList }, { quoted: msg });
    } else if (args[0].toLowerCase() === 'remove' && args.length > 1) {
        const index = parseInt(args[1]) - 1;
        if (index >= 0 && index < autoBioConfig.texts.length) {
            const removed = autoBioConfig.texts.splice(index, 1);
            saveConfig();
            if (autoBioConfig.enabled) {
                stopAutoBio();
                startAutoBio(sock);
            }
            await sock.sendMessage(chatId, { text: `Removed bio: "${removed[0]}"` }, { quoted: msg });
        }
    } else {
        await sock.sendMessage(chatId, { text: 'Invalid option. Use on, off, text, interval, list, or remove' }, { quoted: msg });
    }
}

export default { 
    name: 'autobio',
    description: 'toggle auto bio',
    category: 'automation',
    alias: ['bioauto', 'autoprofile'],
    ownerOnly: true,
    execute: async (sock, msg, args, prefix, config) => {
        const chatId = msg.key.remoteJid;
        const isOwner = await config.isOwnerAsync(msg);
        
        if (!isOwner) {
            await sock.sendMessage(chatId, { text: 'Only the bot owner can use this command.' }, { quoted: msg });
            return;
        }
        
        await handleAutoBioCommand(sock, msg, args, prefix, chatId, msg.key.participant || chatId, isOwner);
    }
};
