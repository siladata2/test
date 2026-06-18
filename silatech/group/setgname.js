// ============================================
// SETGROUPNAME COMMAND - Set group name
// Group Admin Only
// Powered by SILA TECH
// ============================================

import { isAdmin } from '../../sila/isAdmin.js';
import { isOwnerOrSudo } from '../../sila/isOwner.js';

export default {
    name: 'setgroupname',
    description: 'Set group name',
    category: 'group',
    alias: ['setgname', 'groupname', 'renamegroup'],
    
    async execute(sock, msg, args, prefix, config) {
        const chatId = msg.key.remoteJid;
        const senderJid = msg.key.participant || msg.key.remoteJid;
        
        // Check if in group
        if (!chatId.endsWith('@g.us')) {
            const errorMsg = `❌ *This command can only be used in groups!*`;
            if (config.sendStyledMessage) {
                await config.sendStyledMessage(sock, chatId, errorMsg, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: errorMsg }, { quoted: msg });
            }
            return;
        }
        
        // Check if sender is admin or owner
        const adminStatus = await isAdmin(sock, chatId, senderJid);
        const isOwner = await isOwnerOrSudo(senderJid, sock, chatId);
        
        if (!adminStatus.isSenderAdmin && !isOwner) {
            const errorMsg = `❌ *Only group admins can change group name!*`;
            if (config.sendStyledMessage) {
                await config.sendStyledMessage(sock, chatId, errorMsg, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: errorMsg }, { quoted: msg });
            }
            return;
        }
        
        if (!args[0]) {
            const styledName = config.applyFont(config.BOT_NAME, config.BOT_FONT);
            const message = `*╭┈┈┄⊰ ${styledName} - SET GROUP NAME ⊱┄┄┄◈*\n\n*┋ •> 📋 Usage:*\n*┋ •> ${prefix}setgroupname <name>\n*┋ •> ${prefix}setgroupname My Awesome Group\n*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*\n> ® ${config.POWERED_BY}`;
            
            if (config.sendStyledMessage) {
                await config.sendStyledMessage(sock, chatId, message, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: message }, { quoted: msg });
            }
            return;
        }
        
        const groupName = args.join(' ');
        
        try {
            await sock.groupUpdateSubject(chatId, groupName);
            
            const styledName = config.applyFont(config.BOT_NAME, config.BOT_FONT);
            const message = `*╭┈┈┄⊰ ${styledName} - GROUP NAME UPDATED ⊱┄┄┄◈*\n\n*┋ •> 📝 New Group Name:* ${groupName}\n*┋*\n*┋ •> 👤 Updated by: @${senderJid.split('@')[0]}*\n*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*\n> ® ${config.POWERED_BY}`;
            
            if (config.sendStyledMessage) {
                await config.sendStyledMessage(sock, chatId, message, { 
                    quoted: msg,
                    contextInfo: {
                        mentionedJid: [senderJid]
                    }
                });
            } else {
                await sock.sendMessage(chatId, {
                    text: message,
                    contextInfo: {
                        mentionedJid: [senderJid]
                    }
                }, { quoted: msg });
            }
            
        } catch (error) {
            const errorMsg = `❌ *Failed to set group name!*\nError: ${error.message}`;
            if (config.sendStyledMessage) {
                await config.sendStyledMessage(sock, chatId, errorMsg, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: errorMsg }, { quoted: msg });
            }
        }
    }
};
