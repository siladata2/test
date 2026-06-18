// ============================================
// TAGALL COMMAND - Tag all members in group
// Group Admin Only
// Powered by SILA TECH
// ============================================

import { isAdmin } from '../../sila/isAdmin.js';
import { isOwnerOrSudo } from '../../sila/isOwner.js';

export default {
    name: 'tagall',
    description: 'Tag all members in the group',
    category: 'group',
    alias: ['mentionall', 'everyone', 'all'],
    
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
            const errorMsg = `❌ *Only group admins can use tagall!*`;
            if (config.sendStyledMessage) {
                await config.sendStyledMessage(sock, chatId, errorMsg, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: errorMsg }, { quoted: msg });
            }
            return;
        }
        
        try {
            const metadata = await sock.groupMetadata(chatId);
            const participants = metadata.participants;
            
            const messageText = args.length > 0 ? args.join(' ') : 'Attention everyone!';
            const mentionJids = participants.map(p => p.id);
            
            const styledName = config.applyFont(config.BOT_NAME, config.BOT_FONT);
            
            // Create a formatted message with all mentions
            let mentionText = `*╭┈┈┄⊰ ${styledName} - TAG ALL ⊱┄┄┄◈*\n\n`;
            mentionText += `*┋ •> 📝 Message:* ${messageText}\n`;
            mentionText += `*┋ •> 👥 Total Members:* ${participants.length}\n`;
            mentionText += `*┋*\n`;
            mentionText += `*┋ •> 👤 Tagged by: @${senderJid.split('@')[0]}*\n`;
            mentionText += `*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*\n`;
            mentionText += `> ® ${config.POWERED_BY}`;
            
            // Add all mentions in the text
            for (const jid of mentionJids) {
                mentionText += ` @${jid.split('@')[0]}`;
            }
            
            if (config.sendStyledMessage) {
                await config.sendStyledMessage(sock, chatId, mentionText, { 
                    quoted: msg,
                    contextInfo: {
                        ...config.getContextInfo(msg),
                        mentionedJid: mentionJids
                    }
                });
            } else {
                await sock.sendMessage(chatId, {
                    text: mentionText,
                    contextInfo: {
                        ...config.getContextInfo(msg),
                        mentionedJid: mentionJids
                    }
                }, { quoted: msg });
            }
            
        } catch (error) {
            const errorMsg = `❌ *Failed to tag all!*\nError: ${error.message}`;
            if (config.sendStyledMessage) {
                await config.sendStyledMessage(sock, chatId, errorMsg, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: errorMsg }, { quoted: msg });
            }
        }
    }
};