// ============================================
// CHANNELID COMMAND - Get WhatsApp Channel information
// Powered by SILA TECH
// ============================================

export default {
    name: 'channelid',
    description: 'get whatsapp channel information from link',
    category: 'general',
    alias: ['newsletter', 'id', 'cinfo', 'chid', 'cid'],
    
    async execute(sock, msg, args, prefix, config) {
        const chatId = msg.key.remoteJid;
        
        // Check if link provided
        if (!args[0]) {
            const message = `❎ please provide a whatsapp channel link.

example: ${prefix}channelid https://whatsapp.com/channel/123456789

> © Powered by Sila Tech`;
            
            if (config.sendStyledMessage) {
                await config.sendStyledMessage(sock, chatId, message, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: message }, { quoted: msg });
            }
            return;
        }
        
        const channelLink = args[0];
        const match = channelLink.match(/whatsapp\.com\/channel\/([\w-]+)/);
        
        if (!match) {
            const message = `⚠️ invalid channel link format.

make sure it looks like:
https://whatsapp.com/channel/xxxxxxxxx

> © Powered by Sila Tech`;
            
            if (config.sendStyledMessage) {
                await config.sendStyledMessage(sock, chatId, message, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: message }, { quoted: msg });
            }
            return;
        }
        
        const inviteId = match[1];
        
        try {
            // Send initial loading message
            const loadingMsg = await sock.sendMessage(chatId, { 
                text: `⏳ fetching channel information...`
            }, { quoted: msg });
            
            // Fetch channel metadata
            let metadata;
            try {
                metadata = await sock.newsletterMetadata("invite", inviteId);
            } catch (e) {
                console.error('Metadata fetch error:', e);
                await sock.sendMessage(chatId, { 
                    text: `❌ failed to fetch channel metadata. make sure the link is correct.`
                }, { quoted: msg });
                return;
            }
            
            if (!metadata || !metadata.id) {
                await sock.sendMessage(chatId, { 
                    text: `❌ channel not found or inaccessible.`
                }, { quoted: msg });
                return;
            }
            
            const channelId = metadata.id;
            const channelName = metadata.name || 'unknown';
            const subscribers = metadata.subscribers || metadata.subscriber_count || 'N/A';
            const subCount = typeof subscribers === 'number' ? subscribers.toLocaleString() : subscribers;
            const createdTime = metadata.creation_time ? new Date(metadata.creation_time * 1000).toLocaleString() : 'unknown';
            const verified = metadata.verified || false;
            const verifiedBadge = verified ? '✓ verified' : 'unverified';
            const description = metadata.description || metadata.about || 'no description available';
            
            const infoText = `╭━━〔 📡 CHANNEL INFO 〕━━┈⊷
┃
┃ 🛠️ id: ${channelId}
┃ 📌 name: ${channelName}
┃ 👥 followers: ${subCount}
┃ ✓ status: ${verifiedBadge}
┃ 📅 created: ${createdTime}
┃
┃ 📝 about:
┃ ${description.substring(0, 100)}${description.length > 100 ? '...' : ''}
┃
╰━━━━━━━━━━━━━━━━━━┈⊷
> © Powered by Sila Tech`;
            
            // Delete loading message
            await sock.sendMessage(chatId, { delete: loadingMsg.key });
            
            // Send channel info with preview if available
            if (metadata.preview) {
                const previewUrl = metadata.preview.startsWith('http') ? metadata.preview : `https://pps.whatsapp.net${metadata.preview}`;
                await sock.sendMessage(chatId, {
                    image: { url: previewUrl },
                    caption: infoText,
                    contextInfo: config.getContextInfo(msg)
                }, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { 
                    text: infoText,
                    contextInfo: config.getContextInfo(msg)
                }, { quoted: msg });
            }
            
        } catch (error) {
            console.error('Channel ID error:', error);
            
            const errorMsg = `⚠️ an unexpected error occurred.

> © Powered by Sila Tech`;
            
            if (config.sendStyledMessage) {
                await config.sendStyledMessage(sock, chatId, errorMsg, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: errorMsg }, { quoted: msg });
            }
        }
    }
};
