// ============================================
// DEMOTE COMMAND - Demote member from admin
// Group Admin Only
// Powered by SILA TECH
// ============================================

import { isAdmin } from '../../sila/isAdmin.js';
import { isOwnerOrSudo } from '../../sila/isOwner.js';

export default {
    name: 'demote',
    description: 'Demote a member from group admin',
    category: 'group',
    alias: ['removeadmin', 'unadmin', 'downgrade'],
    
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
            const errorMsg = `❌ *Only group admins can demote members!*`;
            if (config.sendStyledMessage) {
                await config.sendStyledMessage(sock, chatId, errorMsg, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: errorMsg }, { quoted: msg });
            }
            return;
        }
        
        // Check if bot is admin
        if (!adminStatus.isBotAdmin) {
            const errorMsg = `❌ *Bot needs to be admin to demote members!*`;
            if (config.sendStyledMessage) {
                await config.sendStyledMessage(sock, chatId, errorMsg, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: errorMsg }, { quoted: msg });
            }
            return;
        }
        
        // Get target user
        let targetJid = null;
        let targetName = '';
        
        // Check if replying to a message
        if (msg.message?.extendedTextMessage?.contextInfo?.participant) {
            targetJid = msg.message.extendedTextMessage.contextInfo.participant;
        }
        // Check if mentioning a user
        else if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
            targetJid = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
        }
        // Check if providing a number
        else if (args[0]) {
            let number = args[0].replace(/[^0-9]/g, '');
            if (number.startsWith('0')) number = '255' + number.substring(1);
            if (!number.startsWith('255')) number = '255' + number;
            targetJid = number + '@s.whatsapp.net';
        }
        
        if (!targetJid) {
            const styledName = config.applyFont(config.BOT_NAME, config.BOT_FONT);
            const message = `*╭┈┈┄⊰ ${styledName} - DEMOTE ⊱┄┄┄◈*\n\n*┋ •> 📋 Usage:*\n*┋ •> ${prefix}demote @user\n*┋ •> ${prefix}demote <number>\n*┋ •> Reply to user's message with ${prefix}demote\n*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*\n> ® ${config.POWERED_BY}`;
            
            if (config.sendStyledMessage) {
                await config.sendStyledMessage(sock, chatId, message, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: message }, { quoted: msg });
            }
            return;
        }
        
        // Get group metadata
        const metadata = await sock.groupMetadata(chatId);
        const participants = metadata.participants;
        
        // Check if target is in group
        const targetParticipant = participants.find(p => p.id === targetJid);
        if (!targetParticipant) {
            const errorMsg = `❌ *User not found in this group!*`;
            if (config.sendStyledMessage) {
                await config.sendStyledMessage(sock, chatId, errorMsg, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: errorMsg }, { quoted: msg });
            }
            return;
        }
        
        // Check if is admin
        if (!targetParticipant.admin) {
            const errorMsg = `⚠️ *User is not an admin!*`;
            if (config.sendStyledMessage) {
                await config.sendStyledMessage(sock, chatId, errorMsg, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: errorMsg }, { quoted: msg });
            }
            return;
        }
        
        // Cannot demote the bot itself
        if (targetJid === sock.user.id) {
            const errorMsg = `❌ *Cannot demote the bot itself!*`;
            if (config.sendStyledMessage) {
                await config.sendStyledMessage(sock, chatId, errorMsg, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: errorMsg }, { quoted: msg });
            }
            return;
        }
        
        // Get target name
        try {
            const contact = await sock.onWhatsApp(targetJid);
            if (contact && contact[0]?.name) {
                targetName = contact[0].name;
            } else {
                targetName = targetJid.split('@')[0];
            }
        } catch {
            targetName = targetJid.split('@')[0];
        }
        
        // Demote the user
        try {
            await sock.groupParticipantsUpdate(chatId, [targetJid], 'demote');
            
            const styledName = config.applyFont(config.BOT_NAME, config.BOT_FONT);
            const message = `*╭┈┈┄⊰ ${styledName} - DEMOTE ⊱┄┄┄◈*\n\n*┋ •> 👤 @${targetName} has been DEMOTED from admin!*\n*┋ •> 👤 Demoted by: @${senderJid.split('@')[0]}*\n*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*\n> ® ${config.POWERED_BY}`;
            
            if (config.sendStyledMessage) {
                await config.sendStyledMessage(sock, chatId, message, { 
                    quoted: msg,
                    contextInfo: {
                        mentionedJid: [targetJid, senderJid]
                    }
                });
            } else {
                await sock.sendMessage(chatId, {
                    text: message,
                    contextInfo: {
                        mentionedJid: [targetJid, senderJid]
                    }
                }, { quoted: msg });
            }
            
        } catch (error) {
            const errorMsg = `❌ *Failed to demote user!*\nError: ${error.message}`;
            if (config.sendStyledMessage) {
                await config.sendStyledMessage(sock, chatId, errorMsg, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: errorMsg }, { quoted: msg });
            }
        }
    }
};
