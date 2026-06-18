// ============================================
// DISAPPEAR COMMAND - Enable disappearing messages
// Group Admin Only
// Powered by SILA TECH
// ============================================

import { isAdmin } from '../../sila/isAdmin.js';
import { isOwnerOrSudo } from '../../sila/isOwner.js';

export default {
    name: 'disappear',
    description: 'Enable disappearing messages in group',
    category: 'group',
    alias: ['disappearon', 'ephemeral', 'disappeargroup'],
    
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
            const errorMsg = `❌ *Only group admins can enable disappearing messages!*`;
            if (config.sendStyledMessage) {
                await config.sendStyledMessage(sock, chatId, errorMsg, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: errorMsg }, { quoted: msg });
            }
            return;
        }
        
        let duration = 86400; // Default 24 hours (in seconds)
        
        if (args[0]) {
            const timeMap = {
                '24h': 86400,
                '12h': 43200,
                '6h': 21600,
                '1h': 3600,
                '30m': 1800,
                '5m': 300,
                '1d': 86400,
                '7d': 604800,
                '90d': 7776000
            };
            
            if (timeMap[args[0].toLowerCase()]) {
                duration = timeMap[args[0].toLowerCase()];
            } else {
                const minutes = parseInt(args[0]);
                if (!isNaN(minutes) && minutes > 0) {
                    duration = minutes * 60;
                }
            }
        }
        
        const durationText = duration >= 86400 ? `${duration / 86400} days` :
                            duration >= 3600 ? `${duration / 3600} hours` :
                            `${duration / 60} minutes`;
        
        try {
            await sock.groupToggleEphemeral(chatId, duration);
            
            const styledName = config.applyFont(config.BOT_NAME, config.BOT_FONT);
            const message = `*╭┈┈┄⊰ ${styledName} - DISAPPEARING MESSAGES ⊱┄┄┄◈*
┋
┋ •> ⏳ *Disappearing messages have been ENABLED!*
┋ •> ⏰ Messages will disappear after: ${durationText}
┋
┋ •> 👤 Enabled by: @${senderJid.split('@')[0]}
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
            const errorMsg = `❌ *Failed to enable disappearing messages!*\nError: ${error.message}`;
            if (config.sendStyledMessage) {
                await config.sendStyledMessage(sock, chatId, errorMsg, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: errorMsg }, { quoted: msg });
            }
        }
    }
};