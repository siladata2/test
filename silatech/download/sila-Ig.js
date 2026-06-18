// ============================================
// IG COMMAND - Download Instagram Media
// Powered by SILA TECH
// ============================================

import { igdl } from 'ruhend-scraper';

export default {
    name: 'ig',
    description: 'download instagram media (reels, posts, videos)',
    category: 'download',
    alias: ['insta', 'instagram', 'reels', 'igdl'],
    
    async execute(sock, msg, args, prefix, config) {
        const chatId = msg.key.remoteJid;
        
        // Check if URL provided
        if (!args[0]) {
            const message = `👉 please provide an instagram link.

example: ${prefix}ig https://www.instagram.com/reel/xxxxx

> © Powered by Sila Tech`;
            
            if (config.sendStyledMessage) {
                await config.sendStyledMessage(sock, chatId, message, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: message }, { quoted: msg });
            }
            return;
        }
        
        const instagramUrl = args[0];
        
        // Send loading reaction
        await sock.sendMessage(chatId, { react: { text: "⏳", key: msg.key } });
        
        try {
            // Download from Instagram
            const downloadData = await igdl(instagramUrl);
            
            if (!downloadData || !downloadData.data || downloadData.data.length === 0) {
                await sock.sendMessage(chatId, { 
                    text: `❌ no media found. make sure the link is public and accessible.`
                }, { quoted: msg });
                return;
            }
            
            // Filter unique media URLs
            const uniqueMedia = [];
            const seenUrls = new Set();
            for (const media of downloadData.data) {
                if (media.url && !seenUrls.has(media.url)) {
                    seenUrls.add(media.url);
                    uniqueMedia.push(media);
                }
            }
            
            // Send each media
            for (let i = 0; i < uniqueMedia.length; i++) {
                const media = uniqueMedia[i];
                
                // Check if video or image
                const isVideo = /\.(mp4|mov|avi|mkv|webm)/i.test(media.url) || 
                               media.type === 'video' || 
                               instagramUrl.includes('/reel/') || 
                               instagramUrl.includes('/tv/');
                
                const caption = `✨ instagram downloader by sila md

✅ ${isVideo ? 'video' : 'image'} [${i + 1}/${uniqueMedia.length}]

> © Powered by Sila Tech`;
                
                if (isVideo) {
                    await sock.sendMessage(chatId, {
                        video: { url: media.url },
                        caption: caption,
                        mimetype: "video/mp4",
                        fileName: `sila_md_${Date.now()}.mp4`,
                        contextInfo: config.getContextInfo(msg)
                    }, { quoted: msg });
                } else {
                    await sock.sendMessage(chatId, {
                        image: { url: media.url },
                        caption: caption,
                        contextInfo: config.getContextInfo(msg)
                    }, { quoted: msg });
                }
                
                // Delay between multiple media
                if (uniqueMedia.length > 1 && i < uniqueMedia.length - 1) {
                    await new Promise(r => setTimeout(r, 1500));
                }
            }
            
            // Send success reaction
            await sock.sendMessage(chatId, { react: { text: "✅", key: msg.key } });
            
        } catch (error) {
            console.error('Instagram download error:', error);
            
            const errorMsg = `⚠️ error: ${error.message}

> © Powered by Sila Tech`;
            
            if (config.sendStyledMessage) {
                await config.sendStyledMessage(sock, chatId, errorMsg, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: errorMsg }, { quoted: msg });
            }
        }
    }
};
