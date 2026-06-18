// ============================================
// SETBIOTIME COMMAND - Set auto bio rotation interval
// Owner Only
// Powered by SILA TECH
// ============================================

import fs from 'fs';
import path from 'path';

export default {
    name: 'setbiotime',
    description: 'Set auto bio rotation interval in minutes',
    category: 'owner',
    alias: ['biotime', 'setbiointerval', 'biointerval'],
    ownerOnly: true,
    
    async execute(sock, msg, args, prefix, config) {
        const chatId = msg.key.remoteJid;
        const configFile = path.join(config.DATABASE_DIR, 'auto_config.json');
        
        // Load current config
        let autoConfig = {};
        try {
            if (fs.existsSync(configFile)) {
                autoConfig = JSON.parse(fs.readFileSync(configFile, 'utf8'));
            }
        } catch (e) {}
        
        const currentInterval = autoConfig.AUTO_BIO_INTERVAL || 30;
        
        if (!args[0]) {
            const message = `╭┈┈┄⊰ SET BIO TIME ⊱┄┄┄◈
┋
┋ •> ⏱️ Current Interval: ${currentInterval} minutes
┋
┋ •> 📋 Usage:
┋ •> ${prefix}setbiotime <minutes> - Set interval
┋ •> ${prefix}setbiotime 60 - Change every hour
┋ •> ${prefix}setbiotime 5 - Change every 5 minutes
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
        
        const interval = parseInt(args[0]);
        if (isNaN(interval) || interval < 1) {
            await sock.sendMessage(chatId, { text: `❌ Please provide a valid number (minutes)!\n\nExample: ${prefix}setbiotime 30` }, { quoted: msg });
            return;
        }
        
        autoConfig.AUTO_BIO_INTERVAL = interval;
        await saveConfig(configFile, autoConfig);
        
        const message = `╭┈┈┄⊰ BIO TIME UPDATED ⊱┄┄┄◈
┋
┋ •> ⏱️ Interval set to: ${interval} minutes
┋ •> Bio will update every ${interval} minutes
┋
╰┄┄┄┄┄┈┈┈┈┄┄┄◈
> ® ${config.POWERED_BY}`;
        
        if (config.sendStyledMessage) {
            await config.sendStyledMessage(sock, chatId, message, { quoted: msg });
        } else {
            await sock.sendMessage(chatId, { text: message }, { quoted: msg });
        }
        
        // Restart auto bio if enabled
        if (autoConfig.AUTO_BIO === true && config.restartAutoBio) {
            config.restartAutoBio(sock);
        }
    }
};

async function saveConfig(filePath, config) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(config, null, 2));
        return true;
    } catch (e) {
        console.error('Error saving config:', e);
        return false;
    }
}
