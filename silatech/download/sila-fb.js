// ============================================
// FB COMMAND - Facebook Video Downloader
// Powered by SILA TECH
// ============================================

import getFBInfo from '@xaviabot/fb-downloader';

// Store pending downloads
const pendingDownloads = new Map();

export default {
    name: 'fb',
    description: 'download facebook videos with quality options',
    category: 'download',
    alias: ['facebook', 'fbdl', 'facebook1'],
    
    async execute(sock, msg, args, prefix, config) {
        const chatId = msg.key.remoteJid;
        const senderJid = msg.key.participant || msg.key.remoteJid;
        
        const fbUrl = args[0] && args[0].trim();
        
        // Check if this is a reply to a pending download
        const quotedMsgId = msg.message?.extendedTextMessage?.contextInfo?.stanzaId;
        if (quotedMsgId && pendingDownloads.has(quotedMsgId)) {
            const downloadData = pendingDownloads.get(quotedMsgId);
            const option = args[0]?.toLowerCase();
            
            let quality = '';
            let mediaUrl = null;
            let mediaType = 'video';
            
            // Parse option
            if (option === '1' || option === 'sd' || option === '➊') {
                quality = 'SD';
                mediaUrl = downloadData.sd;
                mediaType = 'video';
            } else if (option === '2' || option === 'hd' || option === '➋') {
                quality = 'HD';
                mediaUrl = downloadData.hd || downloadData.sd;
                if (!downloadData.hd) quality = 'SD (HD not available)';
                mediaType = 'video';
            } else if (option === '3' || option === 'audio' || option === '➌') {
                quality = 'AUDIO';
                mediaUrl = downloadData.sd;
                mediaType = 'audio';
            } else if (option === '4' || option === 'doc' || option === '➍') {
                quality = 'DOCUMENT';
                mediaUrl = downloadData.sd;
                mediaType = 'document';
            } else if (option === '5' || option === 'voice' || option === '➎') {
                quality = 'VOICE';
                mediaUrl = downloadData.sd;
                mediaType = 'voice';
            } else {
                const errorMsg = `*╭┈┈┄⊰ FACEBOOK DOWNLOADER ⊱┄┄┄◈*
*┋*
*┋ •> ❌ invalid option!*
*┋ •> please choose 1, 2, 3, 4, or 5*
*┋*
*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*
> ® ${config.POWERED_BY}`;
                
                if (config.sendStyledMessage) {
                    await config.sendStyledMessage(sock, chatId, errorMsg, { quoted: msg });
                } else {
                    await sock.sendMessage(chatId, { text: errorMsg }, { quoted: msg });
                }
                return;
            }
            
            await sock.sendMessage(chatId, { react: { text: "⬇️", key: msg.key } });
            
            try {
                if (mediaType === 'video') {
                    await sock.sendMessage(chatId, {
                        video: { url: mediaUrl },
                        caption: `*╭┈┈┄⊰ FACEBOOK DOWNLOADER ⊱┄┄┄◈*
*┋*
*┋ •> 📹 quality: ${quality}*
*┋ •> 📌 title: ${downloadData.title.substring(0, 40)}${downloadData.title.length > 40 ? '...' : ''}*
*┋*
*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*
> ® ${config.POWERED_BY}`,
                        contextInfo: config.getContextInfo(msg)
                    }, { quoted: msg });
                } else if (mediaType === 'audio') {
                    await sock.sendMessage(chatId, {
                        audio: { url: mediaUrl },
                        mimetype: 'audio/mpeg',
                        caption: `*╭┈┈┄⊰ FACEBOOK DOWNLOADER ⊱┄┄┄◈*
*┋*
*┋ •> 🎵 quality: ${quality}*
*┋ •> 📌 title: ${downloadData.title.substring(0, 40)}${downloadData.title.length > 40 ? '...' : ''}*
*┋*
*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*
> ® ${config.POWERED_BY}`,
                        contextInfo: config.getContextInfo(msg)
                    }, { quoted: msg });
                } else if (mediaType === 'document') {
                    await sock.sendMessage(chatId, {
                        document: { url: mediaUrl },
                        mimetype: 'video/mp4',
                        fileName: `SILA_MD_${Date.now()}.mp4`,
                        caption: `*╭┈┈┄⊰ FACEBOOK DOWNLOADER ⊱┄┄┄◈*
*┋*
*┋ •> 📄 quality: ${quality} (as document)*
*┋ •> 📌 title: ${downloadData.title.substring(0, 40)}${downloadData.title.length > 40 ? '...' : ''}*
*┋*
*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*
> ® ${config.POWERED_BY}`,
                        contextInfo: config.getContextInfo(msg)
                    }, { quoted: msg });
                } else if (mediaType === 'voice') {
                    await sock.sendMessage(chatId, {
                        audio: { url: mediaUrl },
                        mimetype: 'audio/ogg; codecs=opus',
                        ptt: true,
                        caption: `*╭┈┈┄⊰ FACEBOOK DOWNLOADER ⊱┄┄┄◈*
*┋*
*┋ •> 🎙️ quality: ${quality} (as voice)*
*┋ •> 📌 title: ${downloadData.title.substring(0, 40)}${downloadData.title.length > 40 ? '...' : ''}*
*┋*
*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*
> ® ${config.POWERED_BY}`,
                        contextInfo: config.getContextInfo(msg)
                    }, { quoted: msg });
                }
                
                await sock.sendMessage(chatId, { react: { text: "✅", key: msg.key } });
                
                // Clean up
                pendingDownloads.delete(quotedMsgId);
                
            } catch (error) {
                console.error('FB Download Error:', error);
                const errorMsg = `*╭┈┈┄⊰ FACEBOOK DOWNLOADER ⊱┄┄┄◈*
*┋*
*┋ •> ❌ failed to download!*
*┋ •> error: ${error.message}*
*┋*
*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*
> ® ${config.POWERED_BY}`;
                
                if (config.sendStyledMessage) {
                    await config.sendStyledMessage(sock, chatId, errorMsg, { quoted: msg });
                } else {
                    await sock.sendMessage(chatId, { text: errorMsg }, { quoted: msg });
                }
            }
            return;
        }
        
        // Normal flow - new download request
        if (!fbUrl) {
            const message = `*╭┈┈┄⊰ FACEBOOK DOWNLOADER ⊱┄┄┄◈*
*┋*
*┋ •> 📋 usage:*
*┋ •> ${prefix}fb <facebook_video_link>*
*┋*
*┋ •> example:*
*┋ •> ${prefix}fb https://www.facebook.com/xxxxx*
*┋*
*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*
> ® ${config.POWERED_BY}`;
            
            if (config.sendStyledMessage) {
                await config.sendStyledMessage(sock, chatId, message, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: message }, { quoted: msg });
            }
            return;
        }
        
        if (!fbUrl.includes('https://') || !fbUrl.includes('facebook.com')) {
            const message = `*╭┈┈┄⊰ FACEBOOK DOWNLOADER ⊱┄┄┄◈*
*┋*
*┋ •> ❌ invalid facebook link!*
*┋ •> please send a valid facebook video url*
*┋*
*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*
> ® ${config.POWERED_BY}`;
            
            if (config.sendStyledMessage) {
                await config.sendStyledMessage(sock, chatId, message, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: message }, { quoted: msg });
            }
            return;
        }
        
        await sock.sendMessage(chatId, { react: { text: "📽️", key: msg.key } });
        
        try {
            const videoData = await getFBInfo(fbUrl);
            
            if (!videoData || !videoData.sd) {
                const errorMsg = `*╭┈┈┄⊰ FACEBOOK DOWNLOADER ⊱┄┄┄◈*
*┋*
*┋ •> ❌ failed to fetch video!*
*┋ •> the link might be private or invalid*
*┋*
*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*
> ® ${config.POWERED_BY}`;
                
                if (config.sendStyledMessage) {
                    await config.sendStyledMessage(sock, chatId, errorMsg, { quoted: msg });
                } else {
                    await sock.sendMessage(chatId, { text: errorMsg }, { quoted: msg });
                }
                return;
            }
            
            const title = videoData.title || 'no title available';
            const thumbnail = videoData.thumbnail || config.BOT_AVATAR_URL;
            const hasHd = videoData.hd ? true : false;
            
            const caption = `*╭┈┈┄⊰ FACEBOOK DOWNLOADER ⊱┄┄┄◈*
*┋*
*┋ •> 📌 title: ${title.substring(0, 50)}${title.length > 50 ? '...' : ''}*
*┋*
*┋ •> 🎬 reply with number below*
*┋*
*┋ •> ━━━━━━━━━━━━━━━━*
*┋ •> 📹 VIDEO*
*┋ •> ➊ sd quality*
${hasHd ? '*┋ •> ➋ hd quality*' : '*┋ •> ➋ hd quality (not available)*'}
*┋*
*┋ •> 🎵 AUDIO*
*┋ •> ➌ audio only*
*┋ •> ➍ as document*
*┋ •> ➎ as voice message*
*┋*
*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*
> ® ${config.POWERED_BY}`;
            
            const sentMsg = await sock.sendMessage(chatId, {
                image: { url: thumbnail },
                caption: caption,
                contextInfo: config.getContextInfo(msg)
            }, { quoted: msg });
            
            // Store download data
            pendingDownloads.set(sentMsg.key.id, {
                sd: videoData.sd,
                hd: videoData.hd,
                title: title
            });
            
            // Clean up after 5 minutes
            setTimeout(() => {
                pendingDownloads.delete(sentMsg.key.id);
            }, 5 * 60 * 1000);
            
            await sock.sendMessage(chatId, { react: { text: "✅", key: msg.key } });
            
        } catch (error) {
            console.error('Facebook Download Error:', error);
            
            const errorMsg = `*╭┈┈┄⊰ FACEBOOK DOWNLOADER ⊱┄┄┄◈*
*┋*
*┋ •> ❌ failed to download video!*
*┋ •> error: ${error.message}*
*┋*
*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*
> ® ${config.POWERED_BY}`;
            
            if (config.sendStyledMessage) {
                await config.sendStyledMessage(sock, chatId, errorMsg, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: errorMsg }, { quoted: msg });
            }
        }
    }
};
