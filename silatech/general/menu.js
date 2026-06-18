// ============================================
// MENU COMMAND - Full automatic category detection
// Uses SILA_PIC_URL from config for the banner image
// Powered by SILA TECH
// ============================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
    name: 'menu',
    description: 'Display all available commands',
    category: 'general',
    alias: ['help', 'commands', 'cmdlist', 'allcmds'],
    
    async execute(sock, msg, args, prefix, config) {
        const chatId = msg.key.remoteJid;
        
        // Get current prefix
        let currentPrefix = prefix || '.';
        try {
            if (config.getCurrentPrefix) {
                const p = config.getCurrentPrefix();
                if (p !== undefined) currentPrefix = p;
            }
            if (config.isPrefixless) {
                currentPrefix = '';
            }
        } catch (e) {}
        
        const botName = config.BOT_NAME || 'CIPHER MD';
        
        // Get SILA picture from config (RELOAD to get latest)
        let silaPicUrl = config.SILA_PIC_URL || 'https://i.ibb.co/BKZGzcbr/Sila-cipher.jpg';
        
        // Try to reload config to get latest URL
        try {
            if (config.reloadConfig) {
                const freshConfig = config.reloadConfig();
                if (freshConfig && freshConfig.SILA_PIC_URL) {
                    silaPicUrl = freshConfig.SILA_PIC_URL;
                }
            }
        } catch (e) {}
        
        console.log(`[MENU] Using image URL: ${silaPicUrl}`);
        
        // Auto-detect commands paths
        let commandsPaths = [
            path.join(process.cwd(), 'silatech', 'general'),
            path.join(process.cwd(), 'silatech', 'group'),
            path.join(process.cwd(), 'silatech', 'admin'),
            path.join(process.cwd(), 'silatech', 'owner'),
            path.join(process.cwd(), 'silatech', 'downloader'),
            path.join(process.cwd(), 'silatech', 'ai'),
            path.join(process.cwd(), 'silatech', 'fun'),
            path.join(process.cwd(), 'silatech', 'tools'),
            path.join(process.cwd(), 'silatech', 'automation'),
            path.join(process.cwd(), 'silatech', 'sila'),
            path.join(process.cwd(), 'commands', 'general'),
            path.join(process.cwd(), 'src', 'commands', 'general'),
            path.join(__dirname, '..', 'general'),
            path.join(__dirname, '..', 'group'),
            path.join(__dirname, '..', 'admin'),
            path.join(__dirname, '..', 'owner'),
            path.join(__dirname, '..', 'downloader'),
            path.join(__dirname, '..', 'ai'),
            path.join(__dirname, '..', 'fun'),
            path.join(__dirname, '..', 'tools'),
            path.join(__dirname, '..', 'automation'),
            path.join(__dirname, '..', 'sila')
        ];
        
        // Category icons
        const categoryIconMap = {
            'general': '🔰', 'group': '👥', 'admin': '👑', 'owner': '⚙️',
            'downloader': '📥', 'ai': '🧠', 'fun': '🎮', 'tools': '🔧',
            'automation': '🤖', 'sila': '⭐', 'convert': '🔄', 'other': '📁'
        };
        
        const categoryNameMap = {
            'general': 'GENERAL', 'group': 'GROUP', 'admin': 'ADMIN', 'owner': 'OWNER',
            'downloader': 'DOWNLOADER', 'ai': 'AI & CHAT', 'fun': 'FUN', 'tools': 'TOOLS',
            'automation': 'AUTOMATION', 'sila': 'SILA', 'convert': 'CONVERTER', 'other': 'OTHER'
        };
        
        // Store commands by category
        const categories = new Map();
        const addedCommands = new Set();
        
        async function loadCommandInfo(filePath) {
            try {
                const fileUrl = pathToFileURL(filePath).href;
                const module = await import(fileUrl);
                const cmd = module.default;
                
                if (cmd && cmd.name && !addedCommands.has(cmd.name)) {
                    addedCommands.add(cmd.name);
                    let category = (cmd.category || 'general').toLowerCase();
                    
                    return {
                        name: cmd.name,
                        description: cmd.description || 'No description',
                        category: category
                    };
                }
            } catch (error) {}
            return null;
        }
        
        // Scan all paths for commands
        for (const scanPath of commandsPaths) {
            if (fs.existsSync(scanPath)) {
                try {
                    const files = fs.readdirSync(scanPath);
                    for (const file of files) {
                        if (file.endsWith('.js') && !file.startsWith('_')) {
                            const filePath = path.join(scanPath, file);
                            const cmdInfo = await loadCommandInfo(filePath);
                            if (cmdInfo) {
                                let category = cmdInfo.category;
                                if (!categories.has(category)) {
                                    categories.set(category, []);
                                }
                                categories.get(category).push({
                                    name: cmdInfo.name,
                                    desc: cmdInfo.description
                                });
                            }
                        }
                    }
                } catch (err) {}
            }
        }
        
        // Sort commands alphabetically
        for (const [cat, cmds] of categories) {
            cmds.sort((a, b) => a.name.localeCompare(b.name));
            categories.set(cat, cmds);
        }
        
        // Sort categories
        const categoryOrder = ['general', 'ai', 'downloader', 'tools', 'group', 'admin', 'owner', 'automation', 'sila', 'fun', 'convert', 'other'];
        const sortedCategories = Array.from(categories.keys()).sort((a, b) => {
            const indexA = categoryOrder.indexOf(a);
            const indexB = categoryOrder.indexOf(b);
            if (indexA === -1 && indexB === -1) return a.localeCompare(b);
            if (indexA === -1) return 1;
            if (indexB === -1) return -1;
            return indexA - indexB;
        });
        
        // Calculate total commands
        let totalCommands = 0;
        for (const cmds of categories.values()) {
            totalCommands += cmds.length;
        }
        
        // Get bot mode
        let botMode = 'public';
        try {
            if (config.botModeManager) {
                botMode = config.botModeManager.getMode();
            }
        } catch (e) {}
        
        // Date & Time
        const now = new Date();
        const date = now.toLocaleDateString('en-GB');
        const time = now.toLocaleTimeString('en-GB');
        
        // Check if user requested specific category
        if (args && args.length > 0) {
            const requestedCat = args[0].toLowerCase();
            
            if (categories.has(requestedCat)) {
                const catCommands = categories.get(requestedCat);
                const icon = categoryIconMap[requestedCat] || '📌';
                const catName = categoryNameMap[requestedCat] || requestedCat.toUpperCase();
                
                let catMenu = `╭┈┈┄⊰ ${icon} ${catName} MENU ⊱┄┄┄◈\n\n`;
                catMenu += `┋ 📊 Total: ${catCommands.length} commands\n`;
                catMenu += `┋ 💬 Prefix: ${currentPrefix || 'none'}\n\n`;
                
                for (const cmd of catCommands) {
                    catMenu += `┋ *${currentPrefix}${cmd.name}*\n`;
                    if (cmd.desc && cmd.desc !== 'No description') {
                        catMenu += `┋   ↳ ${cmd.desc}\n`;
                    }
                    catMenu += `┋\n`;
                }
                
                catMenu += `╰┄┄┄┄┄┈┈┈┈┄┄┄◈\n`;
                catMenu += `> ® Powered by SILA TECH`;
                
                await sendMenuWithImage(sock, chatId, silaPicUrl, catMenu, msg);
                return;
            } else {
                let availableCats = '╭┈┈┄⊰ AVAILABLE CATEGORIES ⊱┄┄┄◈\n\n';
                for (const cat of sortedCategories) {
                    const icon = categoryIconMap[cat] || '📌';
                    const catName = categoryNameMap[cat] || cat.toUpperCase();
                    const count = categories.get(cat).length;
                    availableCats += `┋ ${icon} *${catName}* (${count} cmds)\n`;
                    availableCats += `┋    ↳ Use: ${currentPrefix}menu ${cat}\n`;
                    availableCats += `┋\n`;
                }
                availableCats += `╰┄┄┄┄┄┈┈┈┈┄┄┄◈\n`;
                availableCats += `> ® Powered by SILA TECH`;
                
                await sock.sendMessage(chatId, { text: availableCats }, { quoted: msg });
                return;
            }
        }
        
        // Build full menu text
        let menuText = `╭┈┈┄⊰ ${botName} MENU ⊱┄┄┄◈\n\n`;
        menuText += `┋ 🤖 Bot: ${botName}\n`;
        menuText += `┋ 📊 Total: ${totalCommands} commands\n`;
        menuText += `┋ 🎛️ Mode: ${botMode.toUpperCase()}\n`;
        menuText += `┋ 💬 Prefix: ${currentPrefix || 'none'}\n`;
        menuText += `┋ 📅 Date: ${date}\n`;
        menuText += `┋ 🕐 Time: ${time}\n\n`;
        
        for (const category of sortedCategories) {
            const commands = categories.get(category);
            if (commands.length === 0) continue;
            
            const icon = categoryIconMap[category] || '📌';
            const catName = categoryNameMap[category] || category.toUpperCase();
            
            menuText += `┋ ${icon} *${catName}* (${commands.length})\n`;
            menuText += `┋ ─────────────────\n`;
            
            for (const cmd of commands) {
                menuText += `┋ •> *${currentPrefix}${cmd.name}*\n`;
            }
            menuText += `┋\n`;
        }
        
        menuText += `╰┄┄┄┄┄┈┈┈┈┄┄┄◈\n`;
        menuText += `> 📌 Use: ${currentPrefix}menu <category> for specific category\n`;
        menuText += `> 💡 Example: ${currentPrefix}menu ai\n`;
        menuText += `> ® Powered by SILA TECH`;
        
        // Send menu with image
        await sendMenuWithImage(sock, chatId, silaPicUrl, menuText, msg);
    }
};

// Helper function to send menu with image
async function sendMenuWithImage(sock, chatId, imageUrl, caption, quotedMsg) {
    try {
        // Add cache buster to URL to force refresh
        const cacheBuster = Date.now();
        const urlWithCache = `${imageUrl}?t=${cacheBuster}`;
        
        console.log(`[MENU] Fetching image from: ${urlWithCache}`);
        
        const fetch = (await import('node-fetch')).default;
        const response = await fetch(urlWithCache, {
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache'
            }
        });
        
        if (response.ok) {
            const buffer = await response.buffer();
            
            // Send as image message with caption
            await sock.sendMessage(chatId, {
                image: buffer,
                caption: caption,
                mimetype: 'image/jpeg'
            }, { quoted: quotedMsg });
        } else {
            throw new Error(`HTTP ${response.status}`);
        }
    } catch (error) {
        console.log('Image send failed, sending text only:', error.message);
        
        // Apply font to caption if sendStyledMessage exists
        if (quotedMsg?.config?.sendStyledMessage) {
            await quotedMsg.config.sendStyledMessage(sock, chatId, caption, { quoted: quotedMsg });
        } else {
            await sock.sendMessage(chatId, { text: caption }, { quoted: quotedMsg });
        }
    }
}
