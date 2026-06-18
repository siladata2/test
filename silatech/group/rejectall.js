// ============================================
// REJECTALL COMMAND - Reject all pending join requests
// Group Admin Only
// Powered by SILA TECH
// ============================================

import { isAdmin } from '../../sila/isAdmin.js';
import { isOwnerOrSudo } from '../../sila/isOwner.js';

export default {
    name: 'rejectall',
    description: 'Reject all pending join requests',
    category: 'group',
    alias: ['denyall', 'rejectallrequests', 'rejectalljoin'],
    
    async execute(sock, msg, args, prefix, config) {
        const chatId = msg.key.remoteJid;
        const senderJid = msg.key.participant || msg.key.remoteJid;
        
        if (!chatId.endsWith('@g.us')) {
            const errorMsg = `❌ *This command can only be used in groups!*`;
            if (config.sendStyledMessage) {
                await config.sendStyledMessage(sock, chatId, errorMsg, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: errorMsg }, { quoted: msg });
            }
            return;
        }
        
        const adminStatus = await isAdmin(sock, chatId, senderJid);
        const isOwner = await isOwnerOrSudo(senderJid, sock, chatId);
        
        if (!adminStatus.isSenderAdmin && !isOwner) {
            const errorMsg = `❌ *Only group admins can reject all join requests!*`;
            if (config.sendStyledMessage) {
                await config.sendStyledMessage(sock, chatId, errorMsg, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: errorMsg }, { quoted: msg });
            }
            return;
        }
        
        try {
            const requests = await sock.groupRequestParticipantsList(chatId);
            
            if (!requests || requests.length === 0) {
                const noRequestsMsg = `*╭┈┈┄⊰ NO REQUESTS ⊱┄┄┄◈*\n\n*┋ •> 📭 No pending join requests found!*\n*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*\n> ® ${config.POWERED_BY}`;
                
                if (config.sendStyledMessage) {
                    await config.sendStyledMessage(sock, chatId, noRequestsMsg, { quoted: msg });
                } else {
                    await sock.sendMessage(chatId, { text: noRequestsMsg }, { quoted: msg });
                }
                return;
            }
            
            let rejectedCount = requests.length;
            
            const styledName = config.applyFont(config.BOT_NAME, config.BOT_FONT);
            const message = `*╭┈┈┄⊰ ${styledName} - ALL REQUESTS REJECTED ⊱┄┄┄◈*
┋
┋ •> ❌ *Rejected:* ${rejectedCount} pending requests
┋
┋ •> 👤 Action by: @${senderJid.split('@')[0]}
┋
╰┄┄┄┄┄┈┈┈┈┄┄┄◈
> ® ${config.POWERED_BY}`;
            
            if (config.sendStyledMessage) {
                await config.sendStyledMessage(sock, chatId, message, { 
                    quoted: msg,
                    contextInfo: config.getContextInfo(msg)
                });
            } else {
                await sock.sendMessage(chatId, {
                    text: message,
                    contextInfo: config.getContextInfo(msg)
                }, { quoted: msg });
            }
            
        } catch (error) {
            const errorMsg = `❌ *Failed to reject requests!*\nError: ${error.message}`;
            if (config.sendStyledMessage) {
                await config.sendStyledMessage(sock, chatId, errorMsg, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: errorMsg }, { quoted: msg });
            }
        }
    }
};