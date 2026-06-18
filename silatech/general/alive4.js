// ============================================
// ALIVE4 COMMAND - Short & Clean Bot Status
// Powered by SILA TECH
// ============================================

export default {
    name: 'alive4',
    description: 'show bot status',
    category: 'general',
    alias: ['a4', 'status4', 'run4'],
    
    async execute(sock, msg, args, prefix, config) {
        const chatId = msg.key.remoteJid;
        
        // Get current font
        const currentFont = config.BOT_FONT || 'normal';
        
        // Bot name with font
        const botName = config.applyFont(config.BOT_NAME, currentFont);
        
        // Uptime
        const uptime = process.uptime();
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);
        
        // Memory
        const memory = Math.round(process.memoryUsage().rss / 1024 / 1024);
        
        // Platform
        let platform = 'VPS';
        if (process.env.DYNO) platform = 'Heroku';
        else if (process.env.PANEL) platform = 'Panel';
        
        // Bot mode
        const botMode = config.botModeManager ? config.botModeManager.getMode() : 'public';
        
        // Current language
        let currentLang = { flag: '🇬🇧', name: 'English' };
        if (config.getCurrentLanguage) {
            currentLang = config.getCurrentLanguage();
        }
        
        // Prefix
        const prefixDisplay = config.isPrefixless ? 'none' : (config.getCurrentPrefix ? config.getCurrentPrefix() : prefix);
        
        // Build message
        const message = `╭━━〔 ${botName} 〕━━┈⊷
┃
┃ ⏱️ ${hours}h ${minutes}m ${seconds}s
┃ 💾 ${memory} MB
┃ 🏗️ ${platform}
┃ 🎛️ ${botMode}
┃ 🌐 ${currentLang.flag} ${currentLang.name}
┃ 💬 ${prefixDisplay}
┃
╰━━━━━━━━━━━━━━┈⊷
> ® ${config.POWERED_BY}`;
        
        // Send with auto font
        if (config.sendStyledMessage) {
            await config.sendStyledMessage(sock, chatId, message, { quoted: msg });
        } else {
            await sock.sendMessage(chatId, { text: message }, { quoted: msg });
        }
    }
};
