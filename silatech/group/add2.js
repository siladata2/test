// ============================================
// ADDDIRECT COMMAND - Try to add member directly
// Bot attempts to add even if not admin (may fail)
// Powered by SILA TECH
// ============================================

export default {
    name: 'add2',
    description: 'Try to add member directly (experimental)',
    category: 'group',
    alias: ['addd', 'directadd', 'addnow'],
    
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
        
        // Get target number
        if (!args[0]) {
            const styledName = config.applyFont(config.BOT_NAME, config.BOT_FONT);
            const message = `*╭┈┈┄⊰ ${styledName} - DIRECT ADD ⊱┄┄┄◈*
┋
┋ •> 📋 *Usage:*
┋ •> ${prefix}adddirect <number>
┋
┋ •> 📌 *Examples:*
┋ •> ${prefix}adddirect 255712345678
┋ •> ${prefix}adddirect 0712345678
┋
┋ •> ⚠️ *Bot attempts direct add (may fail if not admin)*
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
        
        let number = args[0].replace(/[^0-9]/g, '');
        if (number.startsWith('0')) number = '255' + number.substring(1);
        if (!number.startsWith('255')) number = '255' + number;
        const targetJid = number + '@s.whatsapp.net';
        
        const styledName = config.applyFont(config.BOT_NAME, config.BOT_FONT);
        
        // Send "attempting" message
        const attemptingMsg = `*╭┈┈┄⊰ ${styledName} - ATTEMPTING ⊱┄┄┄◈*
┋
┋ •> 🔄 *Attempting to add +${number} directly...*
┋ •> ⏳ Please wait...
┋
╰┄┄┄┄┄┈┈┈┈┄┄┄◈
> ® ${config.POWERED_BY}`;
        
        await sock.sendMessage(chatId, { text: attemptingMsg }, { quoted: msg });
        
        // Try to add directly
        try {
            await sock.groupParticipantsUpdate(chatId, [targetJid], 'add');
            
            const successMsg = `*╭┈┈┄⊰ ${styledName} - ADDED SUCCESSFULLY ⊱┄┄┄◈*
┋
┋ •> ✅ *+${number} has been ADDED directly to the group!*
┋
┋ •> 👤 Added by: @${senderJid.split('@')[0]}
┋
╰┄┄┄┄┄┈┈┈┈┄┄┄◈
> ® ${config.POWERED_BY}`;
            
            if (config.sendStyledMessage) {
                await config.sendStyledMessage(sock, chatId, successMsg, { 
                    quoted: msg,
                    contextInfo: config.getContextInfo(msg)
                });
            } else {
                await sock.sendMessage(chatId, {
                    text: successMsg,
                    contextInfo: config.getContextInfo(msg)
                }, { quoted: msg });
            }
            
        } catch (error) {
            // Failed - show error message
            let errorMsg = `*╭┈┈┄⊰ ${styledName} - ADD FAILED ⊱┄┄┄◈*
┋
┋ •> ❌ *Failed to add +${number} directly!*
┋
┋ •> 📝 *Reason:* 
┋`;
            
            if (error.message.includes('403') || error.message.includes('not-authorized')) {
                errorMsg += `┋ •> Bot is NOT an admin in this group!`;
            } else if (error.message.includes('404')) {
                errorMsg += `┋ •> User not found on WhatsApp`;
            } else {
                errorMsg += `┋ •> ${error.message}`;
            }
            
            errorMsg += `\n┋
┋ •> 💡 *Alternative:* Use ${prefix}add2 to send invite link
┋
╰┄┄┄┄┄┈┈┈┈┄┄┄◈
> ® ${config.POWERED_BY}`;
            
            if (config.sendStyledMessage) {
                await config.sendStyledMessage(sock, chatId, errorMsg, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: errorMsg }, { quoted: msg });
            }
        }
    }
};
