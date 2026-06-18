// ============================================
// OPENTIME COMMAND - Schedule group to open at specific time
// Group Admin Only
// Powered by SILA TECH
// ============================================

import { isAdmin } from '../../sila/isAdmin.js';
import { isOwnerOrSudo } from '../../sila/isOwner.js';

// Store timeouts for auto-close
const openTimeouts = new Map();

export default {
    name: 'opentime',
    description: 'Schedule group to open at specific time (e.g., 18:30, 9am, 10pm)',
    category: 'group',
    alias: ['opentimer', 'scheduleopen'],
    
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
            const errorMsg = `❌ *Only group admins can schedule group opening!*`;
            if (config.sendStyledMessage) {
                await config.sendStyledMessage(sock, chatId, errorMsg, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: errorMsg }, { quoted: msg });
            }
            return;
        }
        
        // Check if bot is admin
        if (!adminStatus.isBotAdmin) {
            const errorMsg = `❌ *Bot needs to be admin to schedule group opening!*`;
            if (config.sendStyledMessage) {
                await config.sendStyledMessage(sock, chatId, errorMsg, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: errorMsg }, { quoted: msg });
            }
            return;
        }
        
        // Parse time argument
        if (!args[0]) {
            const styledName = config.applyFont(config.BOT_NAME, config.BOT_FONT);
            const message = `*╭┈┈┄⊰ ${styledName} - OPENTIME ⊱┄┄┄◈*\n\n*┋ •> 📋 Usage:*\n*┋ •> ${prefix}opentime <time>\n*┋*\n*┋ •> ⏰ Examples:*\n*┋ •> ${prefix}opentime 18:30 (6:30 PM)*\n*┋ •> ${prefix}opentime 9am\n*┋ •> ${prefix}opentime 10pm\n*┋ •> ${prefix}opentime 14:00\n*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*\n> ® ${config.POWERED_BY}`;
            
            if (config.sendStyledMessage) {
                await config.sendStyledMessage(sock, chatId, message, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: message }, { quoted: msg });
            }
            return;
        }
        
        // Parse time
        let targetHour = 0;
        let targetMinute = 0;
        let timeStr = args[0].toLowerCase();
        
        // Handle format like "18:30" or "14:00"
        if (timeStr.includes(':')) {
            const [hour, minute] = timeStr.split(':');
            targetHour = parseInt(hour);
            targetMinute = parseInt(minute);
        }
        // Handle format like "9am", "10pm"
        else if (timeStr.includes('am') || timeStr.includes('pm')) {
            let hour = parseInt(timeStr.match(/\d+/)[0]);
            const isPm = timeStr.includes('pm');
            
            if (isPm && hour !== 12) targetHour = hour + 12;
            else if (!isPm && hour === 12) targetHour = 0;
            else targetHour = hour;
            targetMinute = 0;
        }
        // Handle format like "9", "14"
        else if (/^\d+$/.test(timeStr)) {
            targetHour = parseInt(timeStr);
            targetMinute = 0;
        }
        
        // Validate time
        if (targetHour > 23 || targetMinute > 59 || isNaN(targetHour)) {
            const errorMsg = `❌ *Invalid time format!*\n\nUse: ${prefix}opentime 18:30, 9am, 10pm, or 14`;
            if (config.sendStyledMessage) {
                await config.sendStyledMessage(sock, chatId, errorMsg, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: errorMsg }, { quoted: msg });
            }
            return;
        }
        
        // Calculate target time
        const now = new Date();
        let targetTime = new Date();
        targetTime.setHours(targetHour, targetMinute, 0, 0);
        
        // If target time is in the past, schedule for tomorrow
        if (targetTime <= now) {
            targetTime.setDate(targetTime.getDate() + 1);
        }
        
        const delayMs = targetTime - now;
        const timeDisplay = targetTime.toLocaleTimeString();
        const dateDisplay = targetTime.toLocaleDateString();
        
        try {
            // Clear any existing timeout for this group
            if (openTimeouts.has(chatId)) {
                clearTimeout(openTimeouts.get(chatId));
                openTimeouts.delete(chatId);
            }
            
            // Set timeout to open the group at specified time
            const timeout = setTimeout(async () => {
                try {
                    await sock.groupSettingUpdate(chatId, 'not_announcement');
                    console.log(`Group ${chatId} automatically opened at ${timeDisplay}`);
                    
                    const styledName = config.applyFont(config.BOT_NAME, config.BOT_FONT);
                    const autoOpenMessage = `*╭┈┈┄⊰ ${styledName} - AUTO OPEN ⊱┄┄┄◈*\n\n*┋ •> 🔓 Group has been automatically OPENED!*\n*┋ •> ⏰ Scheduled time: ${timeDisplay}*\n*┋ •> 👤 Everyone can send messages now*\n*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*\n> ® ${config.POWERED_BY}`;
                    
                    await sock.sendMessage(chatId, { text: autoOpenMessage });
                } catch (e) {
                    console.error('Auto-open failed:', e);
                }
                openTimeouts.delete(chatId);
            }, delayMs);
            
            openTimeouts.set(chatId, timeout);
            
            const styledName = config.applyFont(config.BOT_NAME, config.BOT_FONT);
            const message = `*╭┈┈┄⊰ ${styledName} - OPENTIME ⊱┄┄┄◈*\n\n*┋ •> ⏰ Group opening scheduled!*\n*┋ •> 📅 Date: ${dateDisplay}*\n*┋ •> ⏰ Time: ${timeDisplay}*\n*┋ •> ⏳ In: ${Math.floor(delayMs / 3600000)}h ${Math.floor((delayMs % 3600000) / 60000)}m*\n*┋ •> 👤 Scheduled by: @${senderJid.split('@')[0]}*\n*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*\n> ® ${config.POWERED_BY}`;
            
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
            const errorMsg = `❌ *Failed to schedule group opening!*\nError: ${error.message}`;
            if (config.sendStyledMessage) {
                await config.sendStyledMessage(sock, chatId, errorMsg, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: errorMsg }, { quoted: msg });
            }
        }
    }
};
