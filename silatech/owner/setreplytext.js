// ============================================
// SETREPLYTEXT COMMAND - Set default auto reply text
// Owner Only
// Powered by SILA TECH
// ============================================

import fs from 'fs';
import path from 'path';

export default {
    name: 'setreplytext',
    description: 'Set default auto reply text',
    category: 'owner',
    alias: ['replytext', 'setautoreply', 'defaultreply'],
    ownerOnly: true,
    
    async execute(sock, msg, args, prefix, config) {
        const chatId = msg.key.remoteJid;
        const configFile = path.join(config.DATABASE_DIR, 'auto_config.json');
        
        // Load current config
        let autoConfig = {};
        try {
            if (fs.existsSync(configFile)) {
                autoConfig = JSON.parse(fs.readFileSync(configFile, 'utf8'));
            }
        } catch (e) {}
        
        const currentText = autoConfig.AUTO_REPLY_TEXT || 'Bot is currently busy. Please try again later.';
        
        if (!args[0]) {
            const message = `╭┈┈┄⊰ SET REPLY TEXT ⊱┄┄┄◈
┋
┋ •> 💬 Current Reply Text:
┋ •> ${currentText}
┋
┋ •> 📋 Usage:
┋ •> ${prefix}setreplytext <text> - Set reply text
┋ •> ${prefix}setreplytext reset - Reset to default
┋
┋ •> Example:
┋ •> ${prefix}setreplytext I am busy right now
┋
╰┄┄┄┄┄┈┈┈┈┄┄┄◈
> ® ${config.POWERED_BY}`;
            
            if (config.sendStyledMessage) {
                await config.sendStyledMessage(sock, chatId, message, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: message }, { quoted: msg });
            }
            return;
        }
        
        const action = args[0].toLowerCase();
        
        if (action === 'reset') {
            autoConfig.AUTO_REPLY_TEXT = 'Bot is currently busy. Please try again later.';
            await saveConfig(configFile, autoConfig);
            
            const message = `╭┈┈┄⊰ REPLY TEXT RESET ⊱┄┄┄◈
┋
┋ •> 🔄 Reply text reset to default!
┋
╰┄┄┄┄┄┈┈┈┈┄┄┄◈
> ® ${config.POWERED_BY}`;
            
            if (config.sendStyledMessage) {
                await config.sendStyledMessage(sock, chatId, message, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: message }, { quoted: msg });
            }
        } else {
            const newText = args.join(' ');
            autoConfig.AUTO_REPLY_TEXT = newText;
            await saveConfig(configFile, autoConfig);
            
            const message = `╭┈┈┄⊰ REPLY TEXT UPDATED ⊱┄┄┄◈
┋
┋ •> ✅ New Reply Text:
┋ •> ${newText}
┋
╰┄┄┄┄┄┈┈┈┈┄┄┄◈
> ® ${config.POWERED_BY}`;
            
            if (config.sendStyledMessage) {
                await config.sendStyledMessage(sock, chatId, message, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: message }, { quoted: msg });
            }
        }
    }
};

async function saveConfig(filePath, config) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(config, null, 2));
        return true;
    } catch (e) {
        console.error('Error saving config:', e);
        return false;
    }
}
