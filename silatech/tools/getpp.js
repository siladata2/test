// ============================================
// GETPP COMMAND - Get profile picture of any user
// Powered by SILA TECH
// ============================================

import { applyFont } from '../../sila/fonts/index.js';

const successMessages = [
    { text: "here's the profile picture", emoji: "🖼️" },
    { text: "profile picture fetched successfully", emoji: "📸" },
    { text: "here you go!", emoji: "✨" },
    { text: "profile picture retrieved", emoji: "🎯" },
    { text: "there it is!", emoji: "🖼️" },
    { text: "picture delivered", emoji: "✅" },
    { text: "here's what you asked for", emoji: "🎉" },
    { text: "profile picture ready", emoji: "🚀" },
    { text: "fetched successfully", emoji: "📷" },
    { text: "profile picture found", emoji: "🔍" }
];

const errorMessages = [
    { text: "user has no profile picture", emoji: "❌" },
    { text: "no profile picture found for this user", emoji: "🔍" },
    { text: "profile picture doesn't exist", emoji: "🚫" },
    { text: "couldn't find any profile picture", emoji: "😕" },
    { text: "this user hasn't set a profile picture yet", emoji: "🖼️" },
    { text: "user not found or has no pp", emoji: "❌" }
];

function getRandomMessage(messages) {
    return messages[Math.floor(Math.random() * messages.length)];
}

function formatNumber(number) {
    let num = number.replace(/[^0-9]/g, '');
    if (num.startsWith('0')) num = '255' + num.substring(1);
    if (!num.startsWith('255')) num = '255' + num;
    return num + '@s.whatsapp.net';
}

export default {
    name: 'getpp',
    description: 'get profile picture of any user',
    category: 'tools',
    alias: ['pp', 'profilepic', 'getdpp', 'getpic', 'userpp'],
    
    async execute(sock, msg, args, prefix, config) {
        const chatId = msg.key.remoteJid;
        let targetJid = null;
        let targetName = '';
        
        // Check if replying to a message
        const quotedMsg = msg.message?.extendedTextMessage?.contextInfo;
        
        if (quotedMsg?.participant) {
            // Replying to a message
            targetJid = quotedMsg.participant;
            targetName = 'replied user';
        } 
        else if (quotedMsg?.mentionedJid?.length > 0) {
            // Mentioning a user
            targetJid = quotedMsg.mentionedJid[0];
            targetName = 'mentioned user';
        }
        else if (args[0]) {
            // Providing a number
            let number = args[0];
            if (number.includes('@')) {
                targetJid = number;
            } else {
                targetJid = formatNumber(number);
            }
            targetName = number;
        }
        else {
            // No target - get sender's own profile picture
            targetJid = msg.key.participant || msg.key.remoteJid;
            targetName = 'your own';
        }
        
        await sock.sendMessage(chatId, { react: { text: "📸", key: msg.key } });
        
        try {
            const ppUrl = await sock.profilePictureUrl(targetJid, 'image');
            
            if (!ppUrl) {
                const msgData = getRandomMessage(errorMessages);
                const errorText = `${msgData.emoji} ${msgData.text}`;
                
                if (config.sendStyledMessage) {
                    await config.sendStyledMessage(sock, chatId, errorText, { 
                        quoted: msg, 
                        contextInfo: config.getContextInfo(msg) 
                    });
                } else {
                    await sock.sendMessage(chatId, { text: errorText }, { quoted: msg });
                }
                return;
            }
            
            const msgData = getRandomMessage(successMessages);
            const styledText = applyFont(msgData.text, config.BOT_FONT);
            const caption = `${msgData.emoji} ${styledText}`;
            
            await sock.sendMessage(chatId, {
                image: { url: ppUrl },
                caption: caption,
                contextInfo: config.getContextInfo(msg)
            }, { quoted: msg });
            
            await sock.sendMessage(chatId, { react: { text: "✅", key: msg.key } });
            
        } catch (error) {
            if (error.message.includes('404')) {
                const msgData = getRandomMessage(errorMessages);
                const errorText = `${msgData.emoji} ${msgData.text}`;
                
                if (config.sendStyledMessage) {
                    await config.sendStyledMessage(sock, chatId, errorText, { 
                        quoted: msg, 
                        contextInfo: config.getContextInfo(msg) 
                    });
                } else {
                    await sock.sendMessage(chatId, { text: errorText }, { quoted: msg });
                }
            } else {
                const errorText = `❌ failed to get profile picture.`;
                
                if (config.sendStyledMessage) {
                    await config.sendStyledMessage(sock, chatId, errorText, { 
                        quoted: msg, 
                        contextInfo: config.getContextInfo(msg) 
                    });
                } else {
                    await sock.sendMessage(chatId, { text: errorText }, { quoted: msg });
                }
            }
        }
    }
};
