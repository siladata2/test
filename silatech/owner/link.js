// ============================================
// LINK COMMAND - Connect bot to owner
// Automatically sets the sender as bot owner
// Powered by SILA TECH
// ============================================

import { cleanJid } from '../../sila/silafunctions.js';

export default {
    name: 'link',
    description: 'Link your WhatsApp account as bot owner',
    category: 'owner',
    alias: ['connect', 'setowner', 'linkowner'],
    
    async execute(sock, msg, args, prefix, config) {
        const chatId = msg.key.remoteJid;
        const senderJid = msg.key.participant || msg.key.remoteJid;
        
        // Get sender info
        const cleaned = cleanJid(senderJid);
        const senderNumber = cleaned.cleanNumber;
        const senderJidClean = cleaned.cleanJid;
        
        // Check if already linked
        const isAlreadyOwner = await config.isOwnerAsync(msg);
        
        if (isAlreadyOwner) {
            const message = `╭┈┈┄⊰ LINK STATUS ⊱┄┄┄◈
┋
┋ •> ✅ You are already linked as bot owner!
┋ •> 👤 Number: +${senderNumber}
┋
┋ •> 📋 To unlink, ask the current owner
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
        
        // Check if there's already an owner set
        const currentOwner = config.jidManager.getOwnerInfo();
        
        if (currentOwner.ownerNumber && currentOwner.ownerNumber !== 'Not set' && currentOwner.ownerNumber !== null) {
            // Owner exists, need verification
            const message = `╭┈┈┄⊰ LINK SYSTEM ⊱┄┄┄◈
┋
┋ •> ⚠️ This bot already has an owner!
┋ •> 👑 Current Owner: +${currentOwner.ownerNumber}
┋
┋ •> To become the new owner, you need:
┋ •> 1. Contact the current owner
┋ •> 2. Or have the current owner unlink first
┋
┋ •> 💡 If you are the owner but lost access,
┋ •> use the session file to regain access
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
        
        // No owner set - link this user as owner
        const result = config.jidManager.setNewOwner(senderJid, false);
        
        if (result.success) {
            const styledName = config.applyFont(config.BOT_NAME, config.BOT_FONT);
            
            const message = `╭┈┈┄⊰ LINK SUCCESSFUL ⊱┄┄┄◈
┋
┋ •> 🔗 You have been linked as bot owner!
┋
┋ •> 👤 Your Number: +${senderNumber}
┋ •> 🤖 Bot Name: ${styledName}
┋ •> 📌 Version: ${config.BOT_VERSION}
┋
┋ •> 🎉 Welcome! You now have full control.
┋ •> Use ${prefix}help to see all commands
┋
╰┄┄┄┄┄┈┈┈┈┄┄┄◈
> ® ${config.POWERED_BY}`;
            
            if (config.sendStyledMessage) {
                await config.sendStyledMessage(sock, chatId, message, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: message }, { quoted: msg });
            }
            
            // Also send to owner's DM for confirmation
            try {
                const confirmMessage = `✅ *LINK SUCCESSFUL!*\n\nYou have been successfully linked as the owner of ${styledName}.\n\nUse .help to explore all owner commands.`;
                await sock.sendMessage(senderJid, { text: confirmMessage });
            } catch (e) {}
            
        } else {
            const message = `╭┈┈┄⊰ LINK FAILED ⊱┄┄┄◈
┋
┋ •> ❌ Failed to link your account!
┋ •> 📝 Error: ${result.error || 'Unknown error'}
┋
┋ •> Please try again or contact support
┋
╰┄┄┄┄┄┈┈┈┈┄┄┄◈
> ® ${config.POWERED_BY}`;
            
            if (config.sendStyledMessage) {
                await config.sendStyledMessage(sock, chatId, message, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: message }, { quoted: msg });
            }
        }
    }
};
