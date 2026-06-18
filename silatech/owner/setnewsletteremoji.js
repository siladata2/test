// ============================================
// SETNEWSLETTEREMOJI COMMAND - Set newsletter reaction emojis
// Owner Only
// Powered by SILA TECH
// ============================================

import fs from 'fs';
import path from 'path';

export default {
    name: 'setnewsletteremoji',
    description: 'Set emojis for auto newsletter reaction',
    category: 'owner',
    alias: ['newsletteremoji', 'setchannelemoji', 'channelemoji'],
    ownerOnly: true,
    
    async execute(sock, msg, args, prefix, config) {
        const chatId = msg.key.remoteJid;
        const configFile = path.join(config.DATABASE_DIR, 'status_config.json');
        
        // Load current config
        let statusConfig = {};
        try {
            if (fs.existsSync(configFile)) {
                statusConfig = JSON.parse(fs.readFileSync(configFile, 'utf8'));
            }
        } catch (e) {}
        
        const currentEmojis = statusConfig.NEWSLETTER_REACT_EMOJIS || ['❤️', '😗', '🩷', '🔥', '💫', '👑'];
        
        if (!args[0]) {
            const message = `╭┈┈┄⊰ SET NEWSLETTER EMOJI ⊱┄┄┄◈
┋
┋ •> 📢 Current Emojis:
${currentEmojis.map(e => `┋ •> ${e}`).join('\n')}
┋
┋ •> 📋 Usage:
┋ •> ${prefix}setnewsletteremoji add <emoji> - Add emoji
┋ •> ${prefix}setnewsletteremoji remove <emoji> - Remove emoji
┋ •> ${prefix}setnewsletteremoji list - Show all emojis
┋ •> ${prefix}setnewsletteremoji reset - Reset to default
┋
┋ •> Example:
┋ •> ${prefix}setnewsletteremoji add 🎉
┋ •> ${prefix}setnewsletteremoji remove ❤️
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
            const newEmoji = args[1];
            if (!newEmoji) {
                await sock.sendMessage(chatId, { text: `❌ Please provide an emoji to add!\n\nExample: ${prefix}setnewsletteremoji add 🎉` }, { quoted: msg });
                return;
            }
            
            if (!statusConfig.NEWSLETTER_REACT_EMOJIS) statusConfig.NEWSLETTER_REACT_EMOJIS = [...currentEmojis];
            if (!statusConfig.NEWSLETTER_REACT_EMOJIS.includes(newEmoji)) {
                statusConfig.NEWSLETTER_REACT_EMOJIS.push(newEmoji);
                await saveConfig(configFile, statusConfig);
                
                const message = `╭┈┈┄⊰ NEWSLETTER EMOJI ADDED ⊱┄┄┄◈
┋
┋ •> ✅ Added: ${newEmoji}
┋ •> 📝 Total emojis: ${statusConfig.NEWSLETTER_REACT_EMOJIS.length}
┋
╰┄┄┄┄┄┈┈┈┈┄┄┄◈
> ® ${config.POWERED_BY}`;
                
                if (config.sendStyledMessage) {
                    await config.sendStyledMessage(sock, chatId, message, { quoted: msg });
                } else {
                    await sock.sendMessage(chatId, { text: message }, { quoted: msg });
                }
            } else {
                await sock.sendMessage(chatId, { text: `❌ Emoji ${newEmoji} already exists!` }, { quoted: msg });
            }
        } 
        else if (action === 'remove') {
            const removeEmoji = args[1];
            if (!removeEmoji) {
                await sock.sendMessage(chatId, { text: `❌ Please provide an emoji to remove!\n\nExample: ${prefix}setnewsletteremoji remove ❤️` }, { quoted: msg });
                return;
            }
            
            if (statusConfig.NEWSLETTER_REACT_EMOJIS && statusConfig.NEWSLETTER_REACT_EMOJIS.includes(removeEmoji)) {
                statusConfig.NEWSLETTER_REACT_EMOJIS = statusConfig.NEWSLETTER_REACT_EMOJIS.filter(e => e !== removeEmoji);
                await saveConfig(configFile, statusConfig);
                
                const message = `╭┈┈┄⊰ NEWSLETTER EMOJI REMOVED ⊱┄┄┄◈
┋
┋ •> ❌ Removed: ${removeEmoji}
┋ •> 📝 Total emojis: ${statusConfig.NEWSLETTER_REACT_EMOJIS.length}
┋
╰┄┄┄┄┄┈┈┈┈┄┄┄◈
> ® ${config.POWERED_BY}`;
                
                if (config.sendStyledMessage) {
                    await config.sendStyledMessage(sock, chatId, message, { quoted: msg });
                } else {
                    await sock.sendMessage(chatId, { text: message }, { quoted: msg });
                }
            } else {
                await sock.sendMessage(chatId, { text: `❌ Emoji ${removeEmoji} not found!` }, { quoted: msg });
            }
        }
        else if (action === 'list') {
            const emojiList = statusConfig.NEWSLETTER_REACT_EMOJIS?.map((e, i) => `${i + 1}. ${e}`).join('\n┋ •> ') || 'No emojis set';
            
            const message = `╭┈┈┄⊰ NEWSLETTER EMOJI LIST ⊱┄┄┄◈
┋
┋ •> 📢 Newsletter Reaction Emojis:
┋ •> ${emojiList}
┋
┋ •> 📝 Total: ${statusConfig.NEWSLETTER_REACT_EMOJIS?.length || 0} emojis
┋
╰┄┄┄┄┄┈┈┈┈┄┄┄◈
> ® ${config.POWERED_BY}`;
            
            if (config.sendStyledMessage) {
                await config.sendStyledMessage(sock, chatId, message, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: message }, { quoted: msg });
            }
        }
        else if (action === 'reset') {
            statusConfig.NEWSLETTER_REACT_EMOJIS = ['❤️', '😗', '🩷', '🔥', '💫', '👑'];
            await saveConfig(configFile, statusConfig);
            
            const message = `╭┈┈┄⊰ NEWSLETTER EMOJI RESET ⊱┄┄┄◈
┋
┋ •> 🔄 Emojis reset to default:
┋ •> ❤️ 😗 🩷 🔥 💫 👑
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
            await sock.sendMessage(chatId, { text: `❌ Invalid option!\n\nUse: ${prefix}setnewsletteremoji <add/remove/list/reset>` }, { quoted: msg });
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
