// ============================================
// ALIVE3 COMMAND - Bot status with automatic font
// Font is applied automatically by sila.js
// Powered by SILA TECH
// ============================================

export default {
    name: 'alive3',
    description: 'Check bot status with automatic font',
    category: 'general',
    alias: ['status3', 'botinfo3', 'run'],
    
    async execute(sock, msg, args, prefix, config) {
        const chatId = msg.key.remoteJid;
        
        // Get bot info
        const botName = config.BOT_NAME || 'SILA SMD';
        const version = config.BOT_VERSION || '2.0.0';
        
        // Uptime
        const uptime = process.uptime();
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);
        
        // Memory
        const memoryUsage = process.memoryUsage();
        const rss = Math.round(memoryUsage.rss / 1024 / 1024);
        const heapUsed = Math.round(memoryUsage.heapUsed / 1024 / 1024);
        const heapTotal = Math.round(memoryUsage.heapTotal / 1024 / 1024);
        
        // Platform
        let platform = 'Local/VPS';
        if (process.env.DYNO) platform = 'Heroku';
        else if (process.env.PANEL) platform = 'Panel';
        else if (process.env.RENDER) platform = 'Render';
        else if (process.env.REPLIT) platform = 'Replit';
        
        // Bot Mode
        let botMode = 'public';
        try {
            if (config.botModeManager) {
                botMode = config.botModeManager.getMode();
            }
        } catch (e) {}
        
        // Current font
        const currentFont = config.BOT_FONT || 'bold';
        
        // Prefix
        let prefixDisplay = prefix || '.';
        try {
            if (config.getCurrentPrefix) {
                const p = config.getCurrentPrefix();
                if (p !== undefined) prefixDisplay = p;
            }
            if (config.isPrefixless) {
                prefixDisplay = 'none';
            }
        } catch (e) {}
        
        // Owner
        let ownerNumber = 'Not set';
        try {
            if (config.OWNER_NUMBER && config.OWNER_NUMBER !== '255700000000') {
                ownerNumber = `+${config.OWNER_NUMBER}`;
            }
        } catch (e) {}
        
        // Commands count
        let commandsCount = 0;
        try {
            if (config.commandsCount) commandsCount = config.commandsCount;
        } catch (e) {}
        
        // Date & Time
        const now = new Date();
        const date = now.toLocaleDateString('en-GB');
        const time = now.toLocaleTimeString('en-GB');
        
        // Build message - NO applyFont needed here!
        const message = `╭┈┈┄⊰ ${botName} STATUS ⊱┄┄┄◈

┋ •> 🤖 Bot: ${botName}
┋ •> 📌 Version: ${version}
┋ •> ⏱️ Uptime: ${hours}h ${minutes}m ${seconds}s
┋ •> 💾 Memory: ${rss} MB RSS | ${heapUsed}/${heapTotal} MB
┋ •> 🏗️ Platform: ${platform}
┋ •> 🎛️ Mode: ${botMode.toUpperCase()}
┋ •> 🎨 Font: ${currentFont}
┋ •> 💬 Prefix: ${prefixDisplay}
┋ •> 👑 Owner: ${ownerNumber}
┋ •> 📊 Commands: ${commandsCount}
┋ •> 📅 Date: ${date}
┋ •> 🕐 Time: ${time}
┋ •> ✅ Status: 🟢 ACTIVE & RUNNING
╰┄┄┄┄┄┈┈┈┈┄┄┄◈
> ® Powered by SILA TECH`;
        
        // Send using styled message sender (font applied automatically)
        if (config.sendStyledMessage) {
            await config.sendStyledMessage(sock, chatId, message, { quoted: msg });
        } else {
            // Fallback
            await sock.sendMessage(chatId, { text: message }, { quoted: msg });
        }
    }
};
