// ============================================
// SUDOS COMMAND - List all sudo users
// Owner Only
// Powered by SILA TECH
// ============================================

import fs from 'fs';
import path from 'path';

export default {
    name: 'sudos',
    description: 'List all sudo users',
    category: 'owner',
    alias: ['sudolist', 'listsudo', 'sudousers'],
    ownerOnly: true,
    
    async execute(sock, msg, args, prefix, config) {
        const chatId = msg.key.remoteJid;
        
        const sudoFile = path.join(config.DATABASE_DIR, 'sudo.json');
        let sudoList = [];
        try {
            if (fs.existsSync(sudoFile)) {
                sudoList = JSON.parse(fs.readFileSync(sudoFile, 'utf8'));
            }
        } catch (e) {}
        
        const styledName = config.applyFont(config.BOT_NAME, config.BOT_FONT);
        
        if (sudoList.length === 0) {
            const message = `*╭┈┈┄⊰ ${styledName} - SUDO USERS ⊱┄┄┄◈*
┋
┋ •> 📭 *No sudo users found!*
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
        
        let userList = '';
        for (let i = 0; i < sudoList.length; i++) {
            const user = sudoList[i];
            const userName = user.split('@')[0];
            userList += `*┋ •> ${i + 1}. @${userName}*\n`;
        }
        
        const message = `*╭┈┈┄⊰ ${styledName} - SUDO USERS ⊱┄┄┄◈*
┋
┋ •> 👑 *Total Sudo Users:* ${sudoList.length}
┋
${userList}
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