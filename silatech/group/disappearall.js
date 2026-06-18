// ============================================
// DISAPPEARALL COMMAND - Set disappearing for all groups
// Owner Only
// Powered by SILA TECH
// ============================================

import { isOwnerOrSudo } from '../../sila/isOwner.js';

export default {
    name: 'disappearall',
    description: 'Enable disappearing messages in all groups (Owner Only)',
    category: 'owner',
    alias: ['ephemeralall', 'disappearallgroups'],
    ownerOnly: true,
    
    async execute(sock, msg, args, prefix, config) {
        const chatId = msg.key.remoteJid;
        const senderJid = msg.key.participant || msg.key.remoteJid;
        
        const isOwner = await isOwnerOrSudo(senderJid, sock, chatId);
        
        if (!isOwner) {
            const errorMsg = `❌ *Only bot owner can use this command!*`;
            if (config.sendStyledMessage) {
                await config.sendStyledMessage(sock, chatId, errorMsg, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: errorMsg }, { quoted: msg });
            }
            return;
        }
        
        let duration = 86400; // Default 24 hours
        
        if (args[0]) {
            const timeMap = {
                '24h': 86400, '12h': 43200, '6h': 21600, '1h': 3600,
                '30m': 1800, '5m': 300, '1d': 86400, '7d': 604800, '90d': 7776000
            };
            if (timeMap[args[0].toLowerCase()]) {
                duration = timeMap[args[0].toLowerCase()];
            } else {
                const minutes = parseInt(args[0]);
                if (!isNaN(minutes) && minutes > 0) duration = minutes * 60;
            }
        }
        
        try {
            const groups = await sock.groupFetchAllParticipating();
            const groupIds = Object.keys(groups);
            let successCount = 0;
            let failCount = 0;
            
            for (const groupId of groupIds) {
                try {
                    const metadata = await sock.groupMetadata(groupId);
                    const adminStatus = await isAdmin(sock, groupId, sock.user.id);
                    
                    if (adminStatus.isBotAdmin) {
                        await sock.groupToggleEphemeral(groupId, duration);
                        successCount++;
                    } else {
                        failCount++;
                    }
                } catch {
                    failCount++;
                }
            }
            
            const durationText = duration >= 86400 ? `${duration / 86400} days` :
                                duration >= 3600 ? `${duration / 3600} hours` :
                                `${duration / 60} minutes`;
            
            const styledName = config.applyFont(config.BOT_NAME, config.BOT_FONT);
            const message = `*╭┈┈┄⊰ ${styledName} - DISAPPEAR ALL GROUPS ⊱┄┄┄◈*
┋
┋ •> ⏳ *Action completed!*
┋ •> ✅ Success: ${successCount} groups
┋ •> ❌ Failed: ${failCount} groups
┋ •> ⏰ Duration: ${durationText}
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
            const errorMsg = `❌ *Failed!*\nError: ${error.message}`;
            if (config.sendStyledMessage) {
                await config.sendStyledMessage(sock, chatId, errorMsg, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: errorMsg }, { quoted: msg });
            }
        }
    }
};