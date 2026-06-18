// ============================================
// MENU COMMAND - Auto-scan commands from folders
// Font is applied automatically by sila.js
// Powered by SILA TECH
// ============================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
    name: 'menu3',
    description: 'Display all available commands',
    category: 'general',
    alias: ['help3', 'commands3', 'cmdlist', 'allcmds'],
    
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
        
        const botName = config.BOT_NAME || 'SILA SMD';
        
        // Path to commands folder
        let commandsPath = path.join(process.cwd(), 'silatech', 'general');
        
        // Alternative paths if not found
        if (!fs.existsSync(commandsPath)) {
            commandsPath = path.join(process.cwd(), 'commands', 'general');
        }
        if (!fs.existsSync(commandsPath)) {
            commandsPath = path.join(process.cwd(), 'src', 'commands', 'general');
        }
        if (!fs.existsSync(commandsPath)) {
            commandsPath = path.join(__dirname, '..', 'general');
        }
        
        // Categories and their folders
        const categoryFolders = {
            'general': ['general', 'main'],
            'group': ['group'],
            'admin': ['admin'],
            'owner': ['owner'],
            'downloader': ['downloader', 'download'],
            'ai': ['ai', 'chat'],
            'fun': ['fun', 'games'],
            'tools': ['tools', 'utility'],
            'convert': ['convert', 'converter'],
            'other': ['other', 'misc']
        };
        
        const categoryIcons = {
            'general': '🔰',
            'group': '👥',
            'admin': '👑',
            'owner': '⚙️',
            'downloader': '📥',
            'ai': '🧠',
            'fun': '🎮',
            'tools': '🔧',
            'convert': '🔄',
            'other': '📁'
        };
        
        const categoryNames = {
            'general': 'GENERAL',
            'group': 'GROUP',
            'admin': 'ADMIN',
            'owner': 'OWNER',
            'downloader': 'DOWNLOADER',
            'ai': 'AI & CHAT',
            'fun': 'FUN',
            'tools': 'TOOLS',
            'convert': 'CONVERTER',
            'other': 'OTHER'
        };
        
        // Store commands by category
        const categories = {
            'general': [],
            'group': [],
            'admin': [],
            'owner': [],
            'downloader': [],
            'ai': [],
            'fun': [],
            'tools': [],
            'convert': [],
            'other': []
        };
        
        // Function to load command from file and extract info
        async function loadCommandInfo(filePath) {
            try {
                const fileUrl = pathToFileURL(filePath).href;
                const module = await import(fileUrl);
                const cmd = module.default;
                
                if (cmd && cmd.name) {
                    return {
                        name: cmd.name,
                        aliases: cmd.alias || [],
                        description: cmd.description || 'No description',
                        category: cmd.category || 'general'
                    };
                }
            } catch (error) {
                // Silent fail
            }
            return null;
        }
        
        // Scan base directory (silatech/general/)
        if (fs.existsSync(commandsPath)) {
            const files = fs.readdirSync(commandsPath);
            for (const file of files) {
                if (file.endsWith('.js') && !file.startsWith('_')) {
                    const filePath = path.join(commandsPath, file);
                    const cmdInfo = await loadCommandInfo(filePath);
                    if (cmdInfo) {
                        let category = cmdInfo.category || 'general';
                        if (!categories[category]) category = 'general';
                        
                        let displayName = cmdInfo.name;
                        if (cmdInfo.aliases && cmdInfo.aliases.length > 0) {
                            displayName = `${cmdInfo.name}|${cmdInfo.aliases.slice(0, 2).join('|')}`;
                        }
                        
                        categories[category].push({
                            name: displayName,
                            desc: cmdInfo.description,
                            originalName: cmdInfo.name
                        });
                    }
                }
            }
        }
        
        // Scan category subfolders
        for (const [category, folders] of Object.entries(categoryFolders)) {
            for (const folder of folders) {
                const folderPath = path.join(process.cwd(), 'silatech', folder);
                if (fs.existsSync(folderPath)) {
                    const files = fs.readdirSync(folderPath);
                    for (const file of files) {
                        if (file.endsWith('.js') && !file.startsWith('_')) {
                            const filePath = path.join(folderPath, file);
                            // Check if command already added
                            const alreadyAdded = categories[category].some(c => 
                                file.includes(c.originalName)
                            );
                            if (!alreadyAdded) {
                                const cmdInfo = await loadCommandInfo(filePath);
                                if (cmdInfo) {
                                    let displayName = cmdInfo.name;
                                    if (cmdInfo.aliases && cmdInfo.aliases.length > 0) {
                                        displayName = `${cmdInfo.name}|${cmdInfo.aliases.slice(0, 2).join('|')}`;
                                    }
                                    categories[category].push({
                                        name: displayName,
                                        desc: cmdInfo.description,
                                        originalName: cmdInfo.name
                                    });
                                }
                            }
                        }
                    }
                }
            }
        }
        
        // Get commands from config if available
        if (config.commands && config.commands.length > 0) {
            for (const cmd of config.commands) {
                if (cmd && cmd.name) {
                    let category = (cmd.category || 'general').toLowerCase();
                    if (!categories[category]) category = 'general';
                    
                    const alreadyExists = categories[category].some(c => c.originalName === cmd.name);
                    if (!alreadyExists) {
                        let displayName = cmd.name;
                        if (cmd.alias && cmd.alias.length > 0) {
                            displayName = `${cmd.name}|${cmd.alias.slice(0, 2).join('|')}`;
                        }
                        categories[category].push({
                            name: displayName,
                            desc: cmd.description || 'No description',
                            originalName: cmd.name
                        });
                    }
                }
            }
        }
        
        // Calculate total commands
        let totalCommands = 0;
        for (const cat in categories) {
            totalCommands += categories[cat].length;
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
            const validCategories = Object.keys(categories);
            
            if (validCategories.includes(requestedCat)) {
                const catCommands = categories[requestedCat] || [];
                if (catCommands.length > 0) {
                    const icon = categoryIcons[requestedCat] || '📌';
                    const catName = categoryNames[requestedCat] || requestedCat.toUpperCase();
                    
                    let catMenu = `╭┈┈┄⊰ ${icon} ${catName} MENU ⊱┄┄┄◈\n\n`;
                    
                    for (const cmd of catCommands) {
                        catMenu += `┋ *${currentPrefix}${cmd.name}*\n`;
                        if (cmd.desc && cmd.desc !== 'No description') {
                            const shortDesc = cmd.desc.length > 50 ? cmd.desc.substring(0, 47) + '...' : cmd.desc;
                            catMenu += `┋   ↳ ${shortDesc}\n`;
                        }
                        catMenu += `┋\n`;
                    }
                    
                    catMenu += `╰┄┄┄┄┄┈┈┈┈┄┄┄◈\n`;
                    catMenu += `> ® Powered by SILA TECH`;
                    
                    if (config.sendStyledMessage) {
                        await config.sendStyledMessage(sock, chatId, catMenu, { quoted: msg });
                    } else {
                        await sock.sendMessage(chatId, { text: catMenu }, { quoted: msg });
                    }
                    return;
                }
            }
        }
        
        // Build full menu
        let menuText = `╭┈┈┄⊰ ${botName} MENU ⊱┄┄┄◈\n\n`;
        menuText += `┋ •> 🤖 Bot: ${botName}\n`;
        menuText += `┋ •> 📊 Total Commands: ${totalCommands}\n`;
        menuText += `┋ •> 🎛️ Mode: ${botMode.toUpperCase()}\n`;
        menuText += `┋ •> 💬 Prefix: ${currentPrefix || 'none'}\n`;
        menuText += `┋ •> 📅 Date: ${date}\n`;
        menuText += `┋ •> 🕐 Time: ${time}\n\n`;
        
        // Build each category that has commands
        for (const [catKey, commands] of Object.entries(categories)) {
            if (commands.length === 0) continue;
            
            const icon = categoryIcons[catKey] || '📌';
            const catName = categoryNames[catKey] || catKey.toUpperCase();
            
            menuText += `┋ ${icon} *${catName}*\n`;
            menuText += `┋ ────────────────\n`;
            
            // Show first 10 commands per category
            const displayCommands = commands.slice(0, 10);
            for (const cmd of displayCommands) {
                menuText += `┋ •> *${currentPrefix}${cmd.name}*\n`;
            }
            
            if (commands.length > 10) {
                menuText += `┋ •> ... and ${commands.length - 10} more\n`;
            }
            menuText += `┋\n`;
        }
        
        // Footer
        menuText += `╰┄┄┄┄┄┈┈┈┈┄┄┄◈\n`;
        menuText += `> 📌 Use ${currentPrefix}menu <category> for specific commands\n`;
        menuText += `> 💡 Example: ${currentPrefix}menu ai\n`;
        menuText += `> ® Powered by SILA TECH`;
        
        // Send using styled message sender
        if (config.sendStyledMessage) {
            await config.sendStyledMessage(sock, chatId, menuText, { quoted: msg });
        } else {
            await sock.sendMessage(chatId, { text: menuText }, { quoted: msg });
        }
    }
};
