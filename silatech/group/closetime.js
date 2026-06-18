// ============================================
// CLOSETIME COMMAND - Close group for specific time
// Group Admin Only
// Powered by SILA TECH
// ============================================

import { isAdmin } from '../../sila/isAdmin.js';
import { isOwnerOrSudo } from '../../sila/isOwner.js';

// Store timeouts for auto-open
const closeTimeouts = new Map();

export default {
    name: 'closetime',
    description: 'Close group for specific time (e.g., 1h, 30m, 2d)',
    category: 'group',
    alias: ['closetime', 'closetimer', 'mute time'],
    
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
            const errorMsg = `❌ *Only group admins can close the group!*`;
            if (config.sendStyledMessage) {
                await config.sendStyledMessage(sock, chatId, errorMsg, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: errorMsg }, { quoted: msg });
            }
            return;
        }
        
        // Check if bot is admin
        if (!adminStatus.isBotAdmin) {
            const errorMsg = `❌ *Bot needs to be admin to close the group!*`;
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
            const message = `*╭┈┈┄⊰ ${styledName} - CLOSETIME ⊱┄┄┄◈*\n\n*┋ •> 📋 Usage:*\n*┋ •> ${prefix}closetime <time>\n*┋*\n*┋ •> ⏰ Examples:*\n*┋ •> ${prefix}closetime 30m (30 minutes)*\n*┋ •> ${prefix}closetime 2h (2 hours)*\n*┋ •> ${prefix}closetime 1d (1 day)*\n*┋ •> ${prefix}closetime 1h30m (1 hour 30 min)*\n*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*\n> ® ${config.POWERED_BY}`;
            
            if (config.sendStyledMessage) {
                await config.sendStyledMessage(sock, chatId, message, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: message }, { quoted: msg });
            }
            return;
        }
        
        // Parse time string
        let totalMinutes = 0;
        const timeStr = args[0].toLowerCase();
        
        // Parse minutes
        const minutesMatch = timeStr.match(/(\d+)\s*m/);
        if (minutesMatch) totalMinutes += parseInt(minutesMatch[1]);
        
        // Parse hours
        const hoursMatch = timeStr.match(/(\d+)\s*h/);
        if (hoursMatch) totalMinutes += parseInt(hoursMatch[1]) * 60;
        
        // Parse days
        const daysMatch = timeStr.match(/(\d+)\s*d/);
        if (daysMatch) totalMinutes += parseInt(daysMatch[1]) * 24 * 60;
        
        // If no valid time found
        if (totalMinutes === 0) {
            const errorMsg = `❌ *Invalid time format!*\n\nUse: ${prefix}closetime 30m, 2h, 1d, or 1h30m`;
            if (config.sendStyledMessage) {
                await config.sendStyledMessage(sock, chatId, errorMsg, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: errorMsg }, { quoted: msg });
            }
            return;
        }
        
        // Display time string
        let timeDisplay = '';
        if (totalMinutes >= 1440) {
            const days = Math.floor(totalMinutes / 1440);
            const hours = Math.floor((totalMinutes % 1440) / 60);
            const mins = totalMinutes % 60;
            timeDisplay = `${days}d ${hours}h ${mins}m`;
        } else if (totalMinutes >= 60) {
            const hours = Math.floor(totalMinutes / 60);
            const mins = totalMinutes % 60;
            timeDisplay = `${hours}h ${mins}m`;
        } else {
            timeDisplay = `${totalMinutes}m`;
        }
        
        try {
            // Close the group
            await sock.groupSettingUpdate(chatId, 'announcement');
            
            // Clear any existing timeout for this group
            if (closeTimeouts.has(chatId)) {
                clearTimeout(closeTimeouts.get(chatId));
                closeTimeouts.delete(chatId);
            }
            
            // Set timeout to auto-open after specified time
            const timeout = setTimeout(async () => {
                try {
                    await sock.groupSettingUpdate(chatId, 'not_announcement');
                    console.log(`Group ${chatId} automatically opened after ${timeDisplay}`);
                    
                    const styledName = config.applyFont(config.BOT_NAME, config.BOT_FONT);
                    const autoOpenMessage = `*╭┈┈┄⊰ ${styledName} - AUTO OPEN ⊱┄┄┄◈*\n\n*┋ •> 🔓 Group has been automatically OPENED!*\n*┋ •> ⏰ Closed for: ${timeDisplay}*\n*┋ •> 👤 Everyone can send messages now*\n*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*\n> ® ${config.POWERED_BY}`;
                    
                    await sock.sendMessage(chatId, { text: autoOpenMessage });
                } catch (e) {
                    console.error('Auto-open failed:', e);
                }
                closeTimeouts.delete(chatId);
            }, totalMinutes * 60 * 1000);
            
            closeTimeouts.set(chatId, timeout);
            
            const styledName = config.applyFont(config.BOT_NAME, config.BOT_FONT);
            const message = `*╭┈┈┄⊰ ${styledName} - CLOSETIME ⊱┄┄┄◈*\n\n*┋ •> 🔒 Group has been CLOSED!*\n*┋ •> ⏰ Duration: ${timeDisplay}*\n*┋ •> 📅 Will auto-open at: ${new Date(Date.now() + totalMinutes * 60 * 1000).toLocaleTimeString()}*\n*┋ •> 👤 Only admins can send messages now*\n*┋ •> 👤 Action by: @${senderJid.split('@')[0]}*\n*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*\n> ® ${config.POWERED_BY}`;
            
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
            const errorMsg = `❌ *Failed to close group!*\nError: ${error.message}`;
            if (config.sendStyledMessage) {
                await config.sendStyledMessage(sock, chatId, errorMsg, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: errorMsg }, { quoted: msg });
            }
        }
    }
};