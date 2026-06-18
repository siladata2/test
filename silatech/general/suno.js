// ============================================
// SONU COMMAND - AI Song Generator
// Generate songs from text prompts
// Powered by SILA TECH
// ============================================

export default {
    name: 'sonu',
    description: 'generate ai song from text prompt',
    category: 'general',
    alias: ['song', 'aisong', 'musicai', 'generatesong'],
    
    async execute(sock, msg, args, prefix, config) {
        const chatId = msg.key.remoteJid;
        
        // Get prompt from arguments
        const prompt = args.join(' ');
        
        if (!prompt) {
            const message = `*╭┈┈┄⊰ AI SONG GENERATOR ⊱┄┄┄◈*
*┋*
*┋ •> 🎵 generate a song from text*
*┋*
*┋ •> usage:*
*┋ •> ${prefix}sonu <your prompt>*
*┋*
*┋ •> example:*
*┋ •> ${prefix}sonu love song about nature*
*┋ •> ${prefix}sonu happy birthday song*
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
        
        // Send loading reaction
        await sock.sendMessage(chatId, { react: { text: "🎵", key: msg.key } });
        
        try {
            const apiUrl = `https://omegatech-api.dixonomega.tech/api/ai/sonu3?action=full&prompt=${encodeURIComponent(prompt)}&taskId=Baba+wewe+mwema`;
            
            const fetch = (await import('node-fetch')).default;
            const response = await fetch(apiUrl);
            const data = await response.json();
            
            if (!data.success || !data.url) {
                const errorMsg = `*╭┈┈┄⊰ AI SONG GENERATOR ⊱┄┄┄◈*
*┋*
*┋ •> ❌ failed to generate song*
*┋ •> please try again with a different prompt*
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
            
            const title = data.title || 'Generated Song';
            const duration = data.duration ? `${Math.floor(data.duration / 60)}:${(data.duration % 60).toString().padStart(2, '0')}` : 'unknown';
            const tags = data.tags || 'ai generated';
            const lyrics = data.lyrics || '';
            
            // Send song info first
            const infoMessage = `*╭┈┈┄⊰ AI SONG GENERATOR ⊱┄┄┄◈*
*┋*
*┋ •> 🎵 title: ${title}*
*┋ •> ⏱️ duration: ${duration}*
*┋ •> 🏷️ tags: ${tags}*
*┋*
*┋ •> 📝 prompt: ${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}*
*┋*
*┋ •> 🎤 lyrics:*
${lyrics.split('\n').slice(0, 8).map(line => `*┋ •> ${line}*`).join('\n')}${lyrics.split('\n').length > 8 ? '\n*┋ •> ...*' : ''}
*┋*
*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*
> ® ${config.POWERED_BY}`;
            
            if (config.sendStyledMessage) {
                await config.sendStyledMessage(sock, chatId, infoMessage, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: infoMessage }, { quoted: msg });
            }
            
            // Send the audio file
            await sock.sendMessage(chatId, {
                audio: { url: data.url },
                mimetype: 'audio/mpeg',
                fileName: `${title}.mp3`,
                caption: `🎵 ${title}\n> ® ${config.POWERED_BY}`
            }, { quoted: msg });
            
            // Send success reaction
            await sock.sendMessage(chatId, { react: { text: "✅", key: msg.key } });
            
        } catch (error) {
            console.error('Sonu API Error:', error);
            
            const errorMsg = `*╭┈┈┄⊰ AI SONG GENERATOR ⊱┄┄┄◈*
*┋*
*┋ •> ❌ error: ${error.message}*
*┋ •> please try again later*
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
