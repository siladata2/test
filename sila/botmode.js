// sila/botmode.js
// Complete Bot Mode System with Commands
// Handles Public, Private, and Self modes

import fs from 'fs';
import path from 'path';

class BotModeManager {
    constructor(databaseDir) {
        this.modeFile = path.join(databaseDir, 'botmode.json');
        this.BOT_MODE = 'public';
        this.loadBotMode();
    }

    loadBotMode() {
        try {
            if (fs.existsSync(this.modeFile)) {
                const data = JSON.parse(fs.readFileSync(this.modeFile, 'utf8'));
                this.BOT_MODE = data.mode || 'public';
            }
        } catch (e) {}
        return this.BOT_MODE;
    }

    saveBotMode(mode) {
        try {
            fs.writeFileSync(this.modeFile, JSON.stringify({ 
                mode: mode, 
                updatedAt: new Date().toISOString() 
            }, null, 2));
            this.BOT_MODE = mode;
            return true;
        } catch (e) { 
            return false; 
        }
    }

    getMode() {
        return this.BOT_MODE;
    }

    isPublic() {
        return this.BOT_MODE === 'public';
    }

    isPrivate() {
        return this.BOT_MODE === 'private';
    }

    isSelf() {
        return this.BOT_MODE === 'self';
    }

    // Check if user can interact with bot based on mode
    canInteract(senderJid, isOwner, isFromMe) {
        if (this.isPublic()) {
            return true;
        } else if (this.isPrivate()) {
            return isOwner || isFromMe;
        } else if (this.isSelf()) {
            return isFromMe;
        }
        return false;
    }

    getModeIcon() {
        switch(this.BOT_MODE) {
            case 'public': return '🌍';
            case 'private': return '🔒';
            case 'self': return '🤖';
            default: return '🌍';
        }
    }

    getModeDescription() {
        switch(this.BOT_MODE) {
            case 'public': return 'bot replies to everyone';
            case 'private': return 'bot replies only to owner';
            case 'self': return 'bot replies only to itself';
            default: return 'unknown mode';
        }
    }

    getModeDisplayText() {
        if (this.isPublic()) return '🌍 PUBLIC';
        if (this.isPrivate()) return '🔒 PRIVATE';
        if (this.isSelf()) return '🤖 SELF';
        return '🌍 PUBLIC';
    }
}

// ============ MODE COMMANDS HANDLER ============

async function handleModeCommand(sock, msg, args, prefix, chatId, senderJid, 
    botModeManager, jidManager, autoTranslate, getCurrentLanguage, config, sendStyledMessage) {
    
    const isOwner = await jidManager.isOwner(msg, sock);
    const currentLang = getCurrentLanguage();
    
    const ownerOnlyMsg = await autoTranslate('only the bot owner can use this command.', currentLang.code);
    
    if (!isOwner) {
        await sock.sendMessage(chatId, { text: ownerOnlyMsg }, { quoted: msg });
        return;
    }
    
    if (!args[0]) {
        const modeIcon = botModeManager.getModeIcon();
        const currentModeText = await autoTranslate('current mode', currentLang.code);
        const availableModesText = await autoTranslate('available modes', currentLang.code);
        const publicDesc = await autoTranslate('bot replies to everyone', currentLang.code);
        const privateDesc = await autoTranslate('bot replies only to owner', currentLang.code);
        const selfDesc = await autoTranslate('bot replies only to itself', currentLang.code);
        
        const message = `╭┈┈┄⊰ BOT MODE ⊱┄┄┄◈
┋
┋ •> ${modeIcon} ${currentModeText}: *${botModeManager.getMode().toUpperCase()}*
┋
┋ •> ${availableModesText}:
┋ •> ${prefix}mode public - ${publicDesc}
┋ •> ${prefix}mode private - ${privateDesc}
┋ •> ${prefix}mode self - ${selfDesc}
┋
╰┄┄┄┄┄┈┈┈┈┄┄┄◈
> ® ${config.POWERED_BY}`;
        
        if (sendStyledMessage) {
            await sendStyledMessage(sock, chatId, message, { quoted: msg });
        } else {
            await sock.sendMessage(chatId, { text: message }, { quoted: msg });
        }
        return;
    }
    
    const newMode = args[0].toLowerCase();
    const validModes = ['public', 'private', 'self'];
    
    if (!validModes.includes(newMode)) {
        const invalidMsg = await autoTranslate('invalid mode.', currentLang.code);
        await sock.sendMessage(chatId, { text: `${invalidMsg} use: ${prefix}mode public/private/self` }, { quoted: msg });
        return;
    }
    
    botModeManager.saveBotMode(newMode);
    
    const modeIcon = newMode === 'public' ? '🌍' : (newMode === 'private' ? '🔒' : '🤖');
    const modeChanged = await autoTranslate('mode changed to', currentLang.code);
    const modeDesc = newMode === 'public' ? await autoTranslate('bot will reply to all users', currentLang.code) : 
                     (newMode === 'private' ? await autoTranslate('bot will reply only to owner', currentLang.code) : 
                     await autoTranslate('bot will reply only to itself', currentLang.code));
    
    const message = `╭┈┈┄⊰ MODE CHANGED ⊱┄┄┄◈
┋
┋ •> ${modeIcon} ${modeChanged}: *${newMode.toUpperCase()}*
┋ •> ${modeDesc}
┋
╰┄┄┄┄┄┈┈┈┈┄┄┄◈
> ® ${config.POWERED_BY}`;
    
    if (sendStyledMessage) {
        await sendStyledMessage(sock, chatId, message, { quoted: msg });
    } else {
        await sock.sendMessage(chatId, { text: message }, { quoted: msg });
    }
    
    return newMode;
}

async function handlePublicCommand(sock, msg, prefix, chatId, senderJid, 
    botModeManager, jidManager, autoTranslate, getCurrentLanguage, config, sendStyledMessage) {
    
    const isOwner = await jidManager.isOwner(msg, sock);
    const currentLang = getCurrentLanguage();
    const ownerOnlyMsg = await autoTranslate('only the bot owner can use this command.', currentLang.code);
    
    if (!isOwner) {
        await sock.sendMessage(chatId, { text: ownerOnlyMsg }, { quoted: msg });
        return;
    }
    
    botModeManager.saveBotMode('public');
    
    const modeChanged = await autoTranslate('mode changed to', currentLang.code);
    const modeDesc = await autoTranslate('bot will reply to all users', currentLang.code);
    
    const message = `╭┈┈┄⊰ MODE CHANGED ⊱┄┄┄◈
┋
┋ •> 🌍 ${modeChanged}: *PUBLIC*
┋ •> ${modeDesc}
┋
╰┄┄┄┄┄┈┈┈┈┄┄┄◈
> ® ${config.POWERED_BY}`;
    
    if (sendStyledMessage) {
        await sendStyledMessage(sock, chatId, message, { quoted: msg });
    } else {
        await sock.sendMessage(chatId, { text: message }, { quoted: msg });
    }
}

async function handlePrivateCommand(sock, msg, prefix, chatId, senderJid, 
    botModeManager, jidManager, autoTranslate, getCurrentLanguage, config, sendStyledMessage) {
    
    const isOwner = await jidManager.isOwner(msg, sock);
    const currentLang = getCurrentLanguage();
    const ownerOnlyMsg = await autoTranslate('only the bot owner can use this command.', currentLang.code);
    
    if (!isOwner) {
        await sock.sendMessage(chatId, { text: ownerOnlyMsg }, { quoted: msg });
        return;
    }
    
    botModeManager.saveBotMode('private');
    
    const modeChanged = await autoTranslate('mode changed to', currentLang.code);
    const modeDesc = await autoTranslate('bot will reply only to owner', currentLang.code);
    
    const message = `╭┈┈┄⊰ MODE CHANGED ⊱┄┄┄◈
┋
┋ •> 🔒 ${modeChanged}: *PRIVATE*
┋ •> ${modeDesc}
┋
╰┄┄┄┄┄┈┈┈┈┄┄┄◈
> ® ${config.POWERED_BY}`;
    
    if (sendStyledMessage) {
        await sendStyledMessage(sock, chatId, message, { quoted: msg });
    } else {
        await sock.sendMessage(chatId, { text: message }, { quoted: msg });
    }
}

async function handleSelfCommand(sock, msg, prefix, chatId, senderJid, 
    botModeManager, jidManager, autoTranslate, getCurrentLanguage, config, sendStyledMessage) {
    
    const isOwner = await jidManager.isOwner(msg, sock);
    const currentLang = getCurrentLanguage();
    const ownerOnlyMsg = await autoTranslate('only the bot owner can use this command.', currentLang.code);
    
    if (!isOwner) {
        await sock.sendMessage(chatId, { text: ownerOnlyMsg }, { quoted: msg });
        return;
    }
    
    botModeManager.saveBotMode('self');
    
    const modeChanged = await autoTranslate('mode changed to', currentLang.code);
    const modeDesc = await autoTranslate('bot will reply only to itself', currentLang.code);
    
    const message = `╭┈┈┄⊰ MODE CHANGED ⊱┄┄┄◈
┋
┋ •> 🤖 ${modeChanged}: *SELF*
┋ •> ${modeDesc}
┋
╰┄┄┄┄┄┈┈┈┈┄┄┄◈
> ® ${config.POWERED_BY}`;
    
    if (sendStyledMessage) {
        await sendStyledMessage(sock, chatId, message, { quoted: msg });
    } else {
        await sock.sendMessage(chatId, { text: message }, { quoted: msg });
    }
}

// ============ MODE STATUS COMMAND ============

async function handleModeStatusCommand(sock, msg, prefix, chatId, senderJid, 
    botModeManager, autoTranslate, getCurrentLanguage, config, sendStyledMessage) {
    
    const currentLang = getCurrentLanguage();
    const modeIcon = botModeManager.getModeIcon();
    const currentModeText = await autoTranslate('current mode', currentLang.code);
    const modeDesc = await autoTranslate(botModeManager.getModeDescription(), currentLang.code);
    
    const message = `╭┈┈┄⊰ MODE STATUS ⊱┄┄┄◈
┋
┋ •> ${modeIcon} ${currentModeText}: *${botModeManager.getMode().toUpperCase()}*
┋ •> 📝 ${modeDesc}
┋
╰┄┄┄┄┄┈┈┈┈┄┄┄◈
> ® ${config.POWERED_BY}`;
    
    if (sendStyledMessage) {
        await sendStyledMessage(sock, chatId, message, { quoted: msg });
    } else {
        await sock.sendMessage(chatId, { text: message }, { quoted: msg });
    }
}

// ============ EXPORT ALL ============

export { 
    BotModeManager,
    handleModeCommand, 
    handlePublicCommand, 
    handlePrivateCommand, 
    handleSelfCommand,
    handleModeStatusCommand
};
