// ============================================
// NEWSLETTER AUTO REACT MODULE
// Automatically react to newsletter posts
// Powered by SILA TECH
// ============================================

import { applyFont } from '../../sila/fonts/index.js';
import { getContextInfo, getFooter } from '../../silaconfig.js';
import fs from 'fs';

let newsletterConfig = {
    enabled: true,
    newsletterJids: ['120363402325089913@newsletter'],
    reactEmojis: ['❤️', '😗', '🩷', '🔥', '💫', '👑'],
    maxRetries: 3,
    delayBetweenRetries: 2000
};

const CONFIG_FILE = './silamd/database/newsletter_config.json';

function loadConfig() {
    try {
        if (fs.existsSync(CONFIG_FILE)) {
            const saved = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
            newsletterConfig = { ...newsletterConfig, ...saved };
        }
    } catch (e) {}
}

function saveConfig() {
    try {
        const dir = './silamd/database';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(newsletterConfig, null, 2));
    } catch (e) {}
}

loadConfig();

export async function handleNewsletterReact(sock, message) {
    if (!newsletterConfig.enabled) return false;
    
    try {
        const isNewsletter = newsletterConfig.newsletterJids.some(jid =>
            message.key.remoteJid === jid || message.key.remoteJid?.includes(jid)
        );

        if (!isNewsletter) return false;

        const randomEmoji = newsletterConfig.reactEmojis[
            Math.floor(Math.random() * newsletterConfig.reactEmojis.length)
        ];
        const messageId = message.newsletterServerId;

        if (!messageId) return false;

        let retries = newsletterConfig.maxRetries;
        while (retries > 0) {
            try {
                await sock.newsletterReactMessage(
                    message.key.remoteJid,
                    messageId.toString(),
                    randomEmoji
                );
                console.log(`Auto-reacted to newsletter: ${randomEmoji}`);
                return true;
            } catch (error) {
                retries--;
                if (retries === 0) throw error;
                await new Promise(r => setTimeout(r, newsletterConfig.delayBetweenRetries));
            }
        }
    } catch (error) {
        console.error('Newsletter react error:', error.message);
        return false;
    }
}

export async function handleNewsletterCommand(sock, msg, args, prefix, chatId, senderJid, isOwner) {
    if (!isOwner) {
        await sock.sendMessage(chatId, { text: 'Only the bot owner can use this command.' }, { quoted: msg });
        return;
    }
    
    if (!args[0]) {
        const status = newsletterConfig.enabled ? 'ENABLED' : 'DISABLED';
        const poweredBy = 'SILA TECH';
        
        const message = `╭━━〔 NEWSLETTER AUTO REACT 〕━━┈⊷
┃
┃ Status: ${status}
┃ Emojis: ${newsletterConfig.reactEmojis.join(', ')}
┃ Newsletters: ${newsletterConfig.newsletterJids.length}
┃
┃ Usage:
┃ ${prefix}newsletter on - Enable
┃ ${prefix}newsletter off - Disable
┃ ${prefix}newsletter emojis 💕🔥 - Set emojis
┃ ${prefix}newsletter add <jid> - Add newsletter
┃ ${prefix}newsletter remove <jid> - Remove newsletter
┃ ${prefix}newsletter list - List all
┃
╰━━━━━━━━━━━━━━┈⊷
> ${poweredBy}`;
        
        await sock.sendMessage(chatId, { text: message }, { quoted: msg });
        return;
    }
    
    if (args[0].toLowerCase() === 'on') {
        newsletterConfig.enabled = true;
        saveConfig();
        await sock.sendMessage(chatId, { text: 'Newsletter auto react has been enabled.' }, { quoted: msg });
    } else if (args[0].toLowerCase() === 'off') {
        newsletterConfig.enabled = false;
        saveConfig();
        await sock.sendMessage(chatId, { text: 'Newsletter auto react has been disabled.' }, { quoted: msg });
    } else if (args[0].toLowerCase() === 'emojis' && args.length > 1) {
        const emojis = args.slice(1).join('').split('');
        if (emojis.length > 0) {
            newsletterConfig.reactEmojis = emojis;
            saveConfig();
            await sock.sendMessage(chatId, { text: `Reaction emojis updated: ${emojis.join(', ')}` }, { quoted: msg });
        }
    } else if (args[0].toLowerCase() === 'add' && args.length > 1) {
        const jid = args[1];
        if (!newsletterConfig.newsletterJids.includes(jid)) {
            newsletterConfig.newsletterJids.push(jid);
            saveConfig();
            await sock.sendMessage(chatId, { text: `Added newsletter: ${jid}` }, { quoted: msg });
        }
    } else if (args[0].toLowerCase() === 'remove' && args.length > 1) {
        const jid = args[1];
        const index = newsletterConfig.newsletterJids.indexOf(jid);
        if (index !== -1) {
            newsletterConfig.newsletterJids.splice(index, 1);
            saveConfig();
            await sock.sendMessage(chatId, { text: `Removed newsletter: ${jid}` }, { quoted: msg });
        }
    } else if (args[0].toLowerCase() === 'list') {
        let list = '╭━━〔 NEWSLETTER LIST 〕━━┈⊷\n┃\n';
        newsletterConfig.newsletterJids.forEach((jid, index) => {
            list += `┃ ${index + 1}. ${jid}\n`;
        });
        list += `┃\n╰━━━━━━━━━━━━━━┈⊷\n> SILA TECH`;
        await sock.sendMessage(chatId, { text: list }, { quoted: msg });
    } else {
        await sock.sendMessage(chatId, { text: 'Invalid option. Use on, off, emojis, add, remove, or list' }, { quoted: msg });
    }
}

export default { 
    name: 'newsletter',
    description: 'toggle newsletter auto react',
    category: 'automation',
    alias: ['nl', 'newsletterauto'],
    ownerOnly: true,
    execute: async (sock, msg, args, prefix, config) => {
        const chatId = msg.key.remoteJid;
        const isOwner = await config.isOwnerAsync(msg);
        
        if (!isOwner) {
            await sock.sendMessage(chatId, { text: 'Only the bot owner can use this command.' }, { quoted: msg });
            return;
        }
        
        await handleNewsletterCommand(sock, msg, args, prefix, chatId, msg.key.participant || chatId, isOwner);
    }
};
