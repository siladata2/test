// ============================================
// GETGPP COMMAND - Get group profile picture
// Powered by SILA TECH
// ============================================

const successMessages = [
    { text: "here's the group profile picture 🖼️", emoji: "🖼️" },
    { text: "group picture fetched successfully 📸", emoji: "📸" },
    { text: "here you go! group pp 🎯", emoji: "🎯" },
    { text: "profile picture retrieved ✨", emoji: "✨" },
    { text: "boom! group picture 🖼️", emoji: "💥" },
    { text: "there it is! group photo 🖼️", emoji: "🎨" },
    { text: "group profile picture ready 📷", emoji: "📷" },
    { text: "here's what you asked for 🖼️", emoji: "✅" },
    { text: "group pp fetched! enjoy 🎉", emoji: "🎉" },
    { text: "picture delivered 🖼️", emoji: "🚀" }
];

const errorMessages = [
    { text: "this group has no profile picture", emoji: "❌" },
    { text: "no profile picture found for this group", emoji: "🔍" },
    { text: "group picture doesn't exist", emoji: "🚫" },
    { text: "couldn't find any profile picture here", emoji: "😕" },
    { text: "this group hasn't set a profile picture yet", emoji: "🖼️" }
];

function getRandomMessage(messages) {
    return messages[Math.floor(Math.random() * messages.length)];
}

export default {
    name: 'getgpp',
    description: 'get group profile picture',
    category: 'group',
    alias: ['getgrouppp', 'grouppic', 'gpp', 'getgcpp', 'grouppp'],
    
    async execute(sock, msg, args, prefix, config) {
        const chatId = msg.key.remoteJid;
        
        if (!chatId.endsWith('@g.us')) {
            const msgData = getRandomMessage(errorMessages);
            const errorText = `❌ this command can only be used in groups.`;
            
            if (config.sendStyledMessage) {
                await config.sendStyledMessage(sock, chatId, errorText, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: errorText }, { quoted: msg });
            }
            return;
        }
        
        await sock.sendMessage(chatId, { react: { text: "📸", key: msg.key } });
        
        try {
            const ppUrl = await sock.profilePictureUrl(chatId, 'image');
            
            if (!ppUrl) {
                const msgData = getRandomMessage(errorMessages);
                const errorText = `${msgData.emoji} ${msgData.text}`;
                
                if (config.sendStyledMessage) {
                    await config.sendStyledMessage(sock, chatId, errorText, { quoted: msg });
                } else {
                    await sock.sendMessage(chatId, { text: errorText }, { quoted: msg });
                }
                return;
            }
            
            const msgData = getRandomMessage(successMessages);
            const caption = `${msgData.emoji} ${msgData.text}`;
            
            await sock.sendMessage(chatId, {
                image: { url: ppUrl },
                caption: caption
            }, { quoted: msg });
            
            await sock.sendMessage(chatId, { react: { text: "✅", key: msg.key } });
            
        } catch (error) {
            if (error.message.includes('404')) {
                const msgData = getRandomMessage(errorMessages);
                const errorText = `${msgData.emoji} ${msgData.text}`;
                
                if (config.sendStyledMessage) {
                    await config.sendStyledMessage(sock, chatId, errorText, { quoted: msg });
                } else {
                    await sock.sendMessage(chatId, { text: errorText }, { quoted: msg });
                }
            } else {
                const errorText = `❌ failed to get profile picture.`;
                
                if (config.sendStyledMessage) {
                    await config.sendStyledMessage(sock, chatId, errorText, { quoted: msg });
                } else {
                    await sock.sendMessage(chatId, { text: errorText }, { quoted: msg });
                }
            }
        }
    }
};
