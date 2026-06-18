// ============================================
// LEAVE COMMAND - Bot leaves the group
// Group Admin Only
// Powered by SILA TECH
// ============================================

import { isAdmin } from '../../sila/isAdmin.js';
import { isOwnerOrSudo } from '../../sila/isOwner.js';

export default {
    name: 'leave',
    description: 'Bot leaves the current group',
    category: 'group',
    alias: ['leavegroup', 'exit'],
    
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
            const errorMsg = `❌ *Only group admins can make the bot leave!*`;
            if (config.sendStyledMessage) {
                await config.sendStyledMessage(sock, chatId, errorMsg, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: errorMsg }, { quoted: msg });
            }
            return;
        }
        
        // Check if confirmation is provided
        if (args[0] !== 'confirm') {
            const styledName = config.applyFont(config.BOT_NAME, config.BOT_FONT);
            const message = `*╭┈┈┄⊰ ${styledName} - LEAVE GROUP ⊱┄┄┄◈*
┋
┋ •> ⚠️ *WARNING: This will make the bot leave the group!*
┋
┋ •> 📋 To confirm, use:
┋ •> ${prefix}leave confirm
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
        
        try {
            // Send goodbye message
            const goodbyeMsg = `*╭┈┈┄⊰ GOODBYE ⊱┄┄┄◈*\n\n*┋ •> 👋 Bot is leaving the group...*\n*┋ •> 👤 Requested by: @${senderJid.split('@')[0]}*\n*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*\n> ® ${config.POWERED_BY}`;
            
            await sock.sendMessage(chatId, {
                text: goodbyeMsg,
                contextInfo: config.getContextInfo(msg)
            }, { quoted: msg });
            
            // Leave the group
            await sock.groupParticipantsUpdate(chatId, [sock.user.id], 'remove');
            
        } catch (error) {
            console.error('Leave error:', error);
        }
    }
};