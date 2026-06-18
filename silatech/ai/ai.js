// ============================================
// CHATGPT COMMAND - AI Chat using GPT-4 Mini
// Powered by SILA TECH
// ============================================

export default {
    name: 'chatgpt',
    description: 'chat with gpt-4 mini ai',
    category: 'ai',
    alias: ['ai', 'gpt', 'ask', 'silaai'],
    
    async execute(sock, msg, args, prefix, config) {
        const chatId = msg.key.remoteJid;
        const query = args.join(' ');

        if (!query) {
            const helpText = `*╭┈┈┄⊰ CHATGPT AI ⊱┄┄┄◈*
*┋*
*┋ •> 🤖 ask me anything!*
*┋*
*┋ •> 📋 usage:*
*┋ •> ${prefix}chatgpt <your question>*
*┋*
*┋ •> example:*
*┋ •> ${prefix}chatgpt what is the meaning of life?*
*┋ •> ${prefix}chatgpt tell me a joke*
*┋*
*┋ •> aliases: ${prefix}ai, ${prefix}gpt, ${prefix}ask*
*┋*
*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*
> ® ${config.POWERED_BY}`;
            
            if (config.sendStyledMessage) {
                await config.sendStyledMessage(sock, chatId, helpText, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: helpText }, { quoted: msg });
            }
            return;
        }

        // Send typing indicator
        await sock.sendPresenceUpdate('composing', chatId);
        
        // Send loading reaction
        await sock.sendMessage(chatId, { react: { text: "🤔", key: msg.key } });

        try {
            const apiUrl = `https://api.silatech.site/silaApi/Gpt-4-mini?message=${encodeURIComponent(query)}`;
            const response = await fetch(apiUrl);
            
            if (!response.ok) {
                throw new Error(`API responded with status ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!data.success || !data.answer) {
                throw new Error(data.error || 'Invalid response from API');
            }
            
            const answer = data.answer;
            const model = data.model || 'gpt-4o-mini';
            const sessionId = data.sessionId || 'new';
            
            // Format the response
            const responseText = `*╭┈┈┄⊰ CHATGPT - ${model.toUpperCase()} ⊱┄┄┄◈*
*┋*
*┋ •> 💬 question:* ${query}
*┋*
*┋ •> 🤖 answer:* 
*┋ •> ${answer}
*┋*
*┋ •> 🆔 session: ${sessionId.substring(0, 8)}...*
*┋*
*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*
> ® ${config.POWERED_BY}`;
            
            await sock.sendMessage(chatId, { react: { text: "✅", key: msg.key } });
            
            if (config.sendStyledMessage) {
                await config.sendStyledMessage(sock, chatId, responseText, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: responseText }, { quoted: msg });
            }

        } catch (error) {
            console.error('ChatGPT API Error:', error);
            
            const errorText = `*╭┈┈┄⊰ CHATGPT ERROR ⊱┄┄┄◈*
*┋*
*┋ •> ❌ failed to get response.*
*┋ •> error: ${error.message}*
*┋*
*┋ •> please try again later.*
*┋*
*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*
> ® ${config.POWERED_BY}`;
            
            if (config.sendStyledMessage) {
                await config.sendStyledMessage(sock, chatId, errorText, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: errorText }, { quoted: msg });
            }
        }
    }
};