// silatech/general/menu2.js
export default {
    name: 'menu2',
    description: 'Show all commands (public)',
    category: 'general',
    
    async execute(sock, msg, args, prefix, config) {
        const chatId = msg.key.remoteJid;
        const styledName = config.applyFont(config.BOT_NAME, config.BOT_FONT);
        
        const commandCategories = config.commandCategoriesMap || new Map();
        const avatarUrl = config.BOT_AVATAR_URL || 'https://i.ibb.co/DqkJRTr/sila-smd-menu.jpg';
        
        const categoryOrder = ['owner', 'group', 'general', 'automation', 'downloader', 'fun', 'tools'];
        
        const sortedCategories = [...commandCategories.keys()].sort((a, b) => {
            const indexA = categoryOrder.indexOf(a.toLowerCase());
            const indexB = categoryOrder.indexOf(b.toLowerCase());
            if (indexA === -1 && indexB === -1) return a.localeCompare(b);
            if (indexA === -1) return 1;
            if (indexB === -1) return -1;
            return indexA - indexB;
        });
        
        let menuText = `╭┈┈┄⊰ ${styledName} MENU ⊱┄┄┄◈\n┋\n`;
        
        for (const category of sortedCategories) {
            const cmdList = commandCategories.get(category);
            if (cmdList && cmdList.length > 0) {
                // Don't show owner commands to non-owners in menu
                if (category === 'owner' && !config.isOwner(msg)) {
                    continue;
                }
                menuText += `┋ •> 📁 ${category.toUpperCase()}\n`;
                for (const cmd of cmdList) {
                    menuText += `┋ •> ${prefix}${cmd}\n`;
                }
                menuText += `┋\n`;
            }
        }
        
        menuText += `┋ •> 📊 Total: ${config.commandsCount} commands\n`;
        menuText += `┋ •> 💬 Prefix: ${config.isPrefixless ? 'none' : prefix}\n`;
        menuText += `╰┄┄┄┄┄┈┈┈┈┄┄┄◈\n> ® ${config.POWERED_BY}`;
        
        await sock.sendMessage(chatId, {
            text: menuText,
            contextInfo: {
                forwardingScore: 999,
                isForwarded: false,
                externalAdReply: {
                    title: config.BOT_NAME,
                    body: `Version ${config.BOT_VERSION}`,
                    mediaType: 1,
                    thumbnailUrl: avatarUrl,
                    sourceUrl: 'https://whatsapp.com/channel/0029VbBG4gfISTkCpKxyMH02',
                    mediaUrl: avatarUrl,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: msg });
    }
};
