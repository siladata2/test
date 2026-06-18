// ============================================
// GROUPINFO COMMAND - Get detailed group information
// Powered by SILA TECH
// ============================================

export default {
    name: 'groupinfo',
    description: 'Get detailed information about the group',
    category: 'group',
    alias: ['ginfo', 'groupdata', 'infogroup', 'groupstats'],
    
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
            
            // Count members
            const totalMembers = participants.length;
            const admins = participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin');
            const totalAdmins = admins.length;
            const regularMembers = totalMembers - totalAdmins;
            
            // Get group creation date
            const createdDate = metadata.creation ? new Date(metadata.creation * 1000).toLocaleDateString('en-GB') : 'Unknown';
            const createdTime = metadata.creation ? new Date(metadata.creation * 1000).toLocaleTimeString('en-GB') : 'Unknown';
            
            // Get group owner (creator)
            const owner = participants.find(p => p.admin === 'superadmin');
            const ownerName = owner ? owner.id.split('@')[0] : 'Unknown';
            
            // Get group settings
            const isLocked = metadata.announce === true;
            const isRestrict = metadata.restrict === true;
            
            const styledName = config.applyFont(config.BOT_NAME, config.BOT_FONT);
            const groupName = config.applyFont(metadata.subject || 'No Name', config.BOT_FONT);
            
            const message = `*╭┈┈┄⊰ ${styledName} - GROUP INFO ⊱┄┄┄◈*
┋
┋ •> 📛 *Group Name:* ${groupName}
┋ •> 🆔 *Group ID:* ${chatId}
┋ •> 👥 *Total Members:* ${totalMembers}
┋ •> 👑 *Admins:* ${totalAdmins}
┋ •> 👤 *Regular Members:* ${regularMembers}
┋ •> 👑 *Group Owner:* @${ownerName}
┋
┋ •> 📅 *Created:* ${createdDate} at ${createdTime}
┋
┋ •> 🔒 *Settings:*
┋ •> ├ 🔇 Locked: ${isLocked ? '✅ Yes (Admins only)' : '❌ No (Everyone can send)'}
┋ •> └ 🚫 Restrict: ${isRestrict ? '✅ Yes' : '❌ No'}
┋
┋ •> 📝 *Description:* ${metadata.desc?.toString() || 'No description'}
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
            const errorMsg = `❌ *Failed to get group info!*\nError: ${error.message}`;
            if (config.sendStyledMessage) {
                await config.sendStyledMessage(sock, chatId, errorMsg, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: errorMsg }, { quoted: msg });
            }
        }
    }
};