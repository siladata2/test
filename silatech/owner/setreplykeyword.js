// ============================================
// SETREPLYKEYWORD COMMAND - Set auto reply keywords
// Owner Only
// Powered by SILA TECH
// ============================================

import fs from 'fs';
import path from 'path';

export default {
    name: 'setreplykeyword',
    description: 'Set keywords for auto reply system',
    category: 'owner',
    alias: ['replykeyword', 'setkeyword', 'autokeyword'],
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
        
        const keywords = autoConfig.AUTO_REPLY_KEYWORDS || {};
        
        if (!args[0]) {
            const keywordList = Object.keys(keywords).length > 0 ? 
                Object.entries(keywords).map(([k, v]) => `${k} → ${v}`).join('\n┋ •> ') : 
                'No keywords set';
            
            const message = `╭┈┈┄⊰ SET REPLY KEYWORD ⊱┄┄┄◈
┋
┋ •> 💬 Current Keywords:
┋ •> ${keywordList}
┋
┋ •> 📋 Usage:
┋ •> ${prefix}setreplykeyword add <keyword> <reply> - Add keyword
┋ •> ${prefix}setreplykeyword remove <keyword> - Remove keyword
┋ •> ${prefix}setreplykeyword list - Show all keywords
┋ •> ${prefix}setreplykeyword clear - Clear all keywords
┋
┋ •> Example:
┋ •> ${prefix}setreplykeyword add hello Hello there!
┋ •> ${prefix}setreplykeyword remove hello
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
        
        if (action === 'add') {
            const keyword = args[1]?.toLowerCase();
            const replyText = args.slice(2).join(' ');
            
            if (!keyword || !replyText) {
                await sock.sendMessage(chatId, { text: `❌ Please provide keyword and reply!\n\nExample: ${prefix}setreplykeyword add hello Hello there!` }, { quoted: msg });
                return;
            }
            
            if (!autoConfig.AUTO_REPLY_KEYWORDS) autoConfig.AUTO_REPLY_KEYWORDS = {};
            autoConfig.AUTO_REPLY_KEYWORDS[keyword] = replyText;
            await saveConfig(configFile, autoConfig);
            
            const message = `╭┈┈┄⊰ REPLY KEYWORD ADDED ⊱┄┄┄◈
┋
┋ •> ✅ Keyword: ${keyword}
┋ •> 📝 Reply: ${replyText}
┋
╰┄┄┄┄┄┈┈┈┈┄┄┄◈
> ® ${config.POWERED_BY}`;
            
            if (config.sendStyledMessage) {
                await config.sendStyledMessage(sock, chatId, message, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: message }, { quoted: msg });
            }
        }
        else if (action === 'remove') {
            const keyword = args[1]?.toLowerCase();
            if (!keyword) {
                await sock.sendMessage(chatId, { text: `❌ Please provide keyword to remove!\n\nExample: ${prefix}setreplykeyword remove hello` }, { quoted: msg });
                return;
            }
            
            if (autoConfig.AUTO_REPLY_KEYWORDS && autoConfig.AUTO_REPLY_KEYWORDS[keyword]) {
                delete autoConfig.AUTO_REPLY_KEYWORDS[keyword];
                await saveConfig(configFile, autoConfig);
                
                const message = `╭┈┈┄⊰ REPLY KEYWORD REMOVED ⊱┄┄┄◈
┋
┋ •> ❌ Removed keyword: ${keyword}
┋
╰┄┄┄┄┄┈┈┈┈┄┄┄◈
> ® ${config.POWERED_BY}`;
                
                if (config.sendStyledMessage) {
                    await config.sendStyledMessage(sock, chatId, message, { quoted: msg });
                } else {
                    await sock.sendMessage(chatId, { text: message }, { quoted: msg });
                }
            } else {
                await sock.sendMessage(chatId, { text: `❌ Keyword "${keyword}" not found!` }, { quoted: msg });
            }
        }
        else if (action === 'list') {
            const keywordList = Object.keys(keywords).length > 0 ? 
                Object.entries(keywords).map(([k, v]) => `${k} → ${v}`).join('\n┋ •> ') : 
                'No keywords set';
            
            const message = `╭┈┈┄⊰ REPLY KEYWORD LIST ⊱┄┄┄◈
┋
┋ •> 💬 Keywords:
┋ •> ${keywordList}
┋
┋ •> 📝 Total: ${Object.keys(keywords).length} keywords
┋
╰┄┄┄┄┄┈┈┈┈┄┄┄◈
> ® ${config.POWERED_BY}`;
            
            if (config.sendStyledMessage) {
                await config.sendStyledMessage(sock, chatId, message, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: message }, { quoted: msg });
            }
        }
        else if (action === 'clear') {
            autoConfig.AUTO_REPLY_KEYWORDS = {};
            await saveConfig(configFile, autoConfig);
            
            const message = `╭┈┈┄⊰ REPLY KEYWORD CLEARED ⊱┄┄┄◈
┋
┋ •> 🗑️ All keywords have been cleared!
┋
╰┄┄┄┄┄┈┈┈┈┄┄┄◈
> ® ${config.POWERED_BY}`;
            
            if (config.sendStyledMessage) {
                await config.sendStyledMessage(sock, chatId, message, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: message }, { quoted: msg });
            }
        }
        else {
            await sock.sendMessage(chatId, { text: `❌ Invalid option!\n\nUse: ${prefix}setreplykeyword <add/remove/list/clear>` }, { quoted: msg });
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
