// ============================================
// SETLIKEEMOJI COMMAND - Set auto like emojis
// Owner Only
// Powered by SILA TECH
// ============================================

import fs from 'fs';
import path from 'path';

export default {
    name: 'setlikeemoji',
    description: 'Set emojis for auto like status reaction',
    category: 'owner',
    alias: ['likeemoji', 'setlike', 'likeemojis'],
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
        
        const currentEmojis = statusConfig.AUTO_LIKE_EMOJI || ['💗', '🔥', '❤️', '👍', '😎', '💫', '👑'];
        
        if (!args[0]) {
            const message = `╭┈┈┄⊰ SET LIKE EMOJI ⊱┄┄┄◈
┋
┋ •> ❤️ Current Emojis:
${currentEmojis.map(e => `┋ •> ${e}`).join('\n')}
┋
┋ •> 📋 Usage:
┋ •> ${prefix}setlikeemoji add <emoji> - Add emoji
┋ •> ${prefix}setlikeemoji remove <emoji> - Remove emoji
┋ •> ${prefix}setlikeemoji list - Show all emojis
┋ •> ${prefix}setlikeemoji reset - Reset to default
┋
┋ •> Example:
┋ •> ${prefix}setlikeemoji add 🎉
┋ •> ${prefix}setlikeemoji remove ❤️
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
                await sock.sendMessage(chatId, { text: `❌ Please provide an emoji to add!\n\nExample: ${prefix}setlikeemoji add 🎉` }, { quoted: msg });
                return;
            }
            
            if (!statusConfig.AUTO_LIKE_EMOJI) statusConfig.AUTO_LIKE_EMOJI = [...currentEmojis];
            if (!statusConfig.AUTO_LIKE_EMOJI.includes(newEmoji)) {
                statusConfig.AUTO_LIKE_EMOJI.push(newEmoji);
                await saveConfig(configFile, statusConfig);
                
                const message = `╭┈┈┄⊰ LIKE EMOJI ADDED ⊱┄┄┄◈
┋
┋ •> ✅ Added: ${newEmoji}
┋ •> 📝 Total emojis: ${statusConfig.AUTO_LIKE_EMOJI.length}
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
                await sock.sendMessage(chatId, { text: `❌ Please provide an emoji to remove!\n\nExample: ${prefix}setlikeemoji remove ❤️` }, { quoted: msg });
                return;
            }
            
            if (statusConfig.AUTO_LIKE_EMOJI && statusConfig.AUTO_LIKE_EMOJI.includes(removeEmoji)) {
                statusConfig.AUTO_LIKE_EMOJI = statusConfig.AUTO_LIKE_EMOJI.filter(e => e !== removeEmoji);
                await saveConfig(configFile, statusConfig);
                
                const message = `╭┈┈┄⊰ LIKE EMOJI REMOVED ⊱┄┄┄◈
┋
┋ •> ❌ Removed: ${removeEmoji}
┋ •> 📝 Total emojis: ${statusConfig.AUTO_LIKE_EMOJI.length}
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
            const emojiList = statusConfig.AUTO_LIKE_EMOJI?.map((e, i) => `${i + 1}. ${e}`).join('\n┋ •> ') || 'No emojis set';
            
            const message = `╭┈┈┄⊰ LIKE EMOJI LIST ⊱┄┄┄◈
┋
┋ •> ❤️ Auto Like Emojis:
┋ •> ${emojiList}
┋
┋ •> 📝 Total: ${statusConfig.AUTO_LIKE_EMOJI?.length || 0} emojis
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
            statusConfig.AUTO_LIKE_EMOJI = ['💗', '🔥', '❤️', '👍', '😎', '💫', '👑'];
            await saveConfig(configFile, statusConfig);
            
            const message = `╭┈┈┄⊰ LIKE EMOJI RESET ⊱┄┄┄◈
┋
┋ •> 🔄 Emojis reset to default:
┋ •> 💗 🔥 ❤️ 👍 😎 💫 👑
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
            await sock.sendMessage(chatId, { text: `❌ Invalid option!\n\nUse: ${prefix}setlikeemoji <add/remove/list/reset>` }, { quoted: msg });
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
