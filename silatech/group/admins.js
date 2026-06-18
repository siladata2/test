// ============================================
// ADMINS COMMAND - List all group admins
// Powered by SILA TECH
// ============================================

export default {
    name: 'admins',
    description: 'List all admins in the group',
    category: 'group',
    alias: ['adminlist', 'listadmins', 'whoadmin'],
    
    async execute(sock, msg, args, prefix, config) {
        const chatId = msg.key.remoteJid;
        
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
        
        try {
            const metadata = await sock.groupMetadata(chatId);
            const participants = metadata.participants;
            
            const admins = participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin');
            const superAdmin = participants.find(p => p.admin === 'superadmin');
            
            let adminList = '';
            let superAdminName = '';
            
            for (let i = 0; i < admins.length; i++) {
                const admin = admins[i];
                const adminNumber = admin.id.split('@')[0];
                const isSuper = admin.admin === 'superadmin';
                adminList += `*┋ •> ${i + 1}. @${adminNumber}${isSuper ? ' 👑 (Owner)*' : ' 👤'}\n`;
                if (isSuper) superAdminName = adminNumber;
            }
            
            const styledName = config.applyFont(config.BOT_NAME, config.BOT_FONT);
            const message = `*╭┈┈┄⊰ ${styledName} - GROUP ADMINS ⊱┄┄┄◈*
┋
┋ •> 👑 *Group Owner:* @${superAdminName}
┋
┋ •> 👥 *Total Admins:* ${admins.length}
┋
${adminList}
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
            const errorMsg = `❌ *Failed to get admin list!*\nError: ${error.message}`;
            if (config.sendStyledMessage) {
                await config.sendStyledMessage(sock, chatId, errorMsg, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: errorMsg }, { quoted: msg });
            }
        }
    }
};