// ============================================
// BLOCK COMMAND - Block a user
// Owner Only
// Powered by SILA TECH
// ============================================

import { isOwnerOrSudo } from '../../sila/isOwner.js';

export default {
    name: 'block',
    description: 'Block a user from using the bot',
    category: 'owner',
    alias: ['blockuser', 'ban'],
    ownerOnly: true,
    
    async execute(sock, msg, args, prefix, config) {
        const chatId = msg.key.remoteJid;
        const senderJid = msg.key.participant || msg.key.remoteJid;
        
        let targetJid = null;
        let targetName = '';
        
        // Get target from reply or mention
        if (msg.message?.extendedTextMessage?.contextInfo?.participant) {
            targetJid = msg.message.extendedTextMessage.contextInfo.participant;
        } else if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
            targetJid = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
        } else if (args[0]) {
            let number = args[0].replace(/[^0-9]/g, '');
            if (number.startsWith('0')) number = '255' + number.substring(1);
            if (!number.startsWith('255')) number = '255' + number;
            targetJid = number + '@s.whatsapp.net';
        }
        
        if (!targetJid) {
            const styledName = config.applyFont(config.BOT_NAME, config.BOT_FONT);
            const message = `*╭┈┈┄⊰ ${styledName} - BLOCK USER ⊱┄┄┄◈*
┋
┋ •> 📋 *Usage:*
┋ •> ${prefix}block @user
┋ •> ${prefix}block <number>
┋ •> Reply to user's message with ${prefix}block
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
        
        try {
            await sock.updateBlockStatus(targetJid, 'block');
            
            // Add to blocked list in database
            if (config.blockedUsersManager) {
                config.blockedUsersManager.add(targetJid);
            }
            
            const styledName = config.applyFont(config.BOT_NAME, config.BOT_FONT);
            const message = `*╭┈┈┄⊰ ${styledName} - USER BLOCKED ⊱┄┄┄◈*
┋
┋ •> 🔨 *User has been BLOCKED!*
┋ •> 👤 User: @${targetName}
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
            const errorMsg = `❌ *Failed to block user!*\nError: ${error.message}`;
            if (config.sendStyledMessage) {
                await config.sendStyledMessage(sock, chatId, errorMsg, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: errorMsg }, { quoted: msg });
            }
        }
    }
};