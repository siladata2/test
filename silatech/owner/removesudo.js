// ============================================
// REMOVESUDO COMMAND - Remove a sudo user
// Owner Only
// Powered by SILA TECH
// ============================================

import fs from 'fs';
import path from 'path';

export default {
    name: 'removesudo',
    description: 'Remove a sudo user',
    category: 'owner',
    alias: ['delsudo', 'removesudoer'],
    ownerOnly: true,
    
    async execute(sock, msg, args, prefix, config) {
        const chatId = msg.key.remoteJid;
        const senderJid = msg.key.participant || msg.key.remoteJid;
        
        let targetJid = null;
        let targetName = '';
        
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
            const message = `*╭┈┈┄⊰ ${styledName} - REMOVE SUDO ⊱┄┄┄◈*
┋
┋ •> 📋 *Usage:*
┋ •> ${prefix}removesudo @user
┋ •> ${prefix}removesudo <number>
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
            const contact = await sock.onWhatsApp(targetJid);
            if (contact && contact[0]?.name) {
                targetName = contact[0].name;
            } else {
                targetName = targetJid.split('@')[0];
            }
        } catch {
            targetName = targetJid.split('@')[0];
        }
        
        const sudoFile = path.join(config.DATABASE_DIR, 'sudo.json');
        let sudoList = [];
        try {
            if (fs.existsSync(sudoFile)) {
                sudoList = JSON.parse(fs.readFileSync(sudoFile, 'utf8'));
            }
        } catch (e) {}
        
        if (sudoList.includes(targetJid)) {
            sudoList = sudoList.filter(jid => jid !== targetJid);
            fs.writeFileSync(sudoFile, JSON.stringify(sudoList, null, 2));
        }
        
        const styledName = config.applyFont(config.BOT_NAME, config.BOT_FONT);
        const message = `*╭┈┈┄⊰ ${styledName} - SUDO REMOVED ⊱┄┄┄◈*
┋
┋ •> 🔓 *User has been removed from sudo list!*
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
    }
};