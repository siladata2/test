// ============================================
// TEXT2IMAGE COMMAND - Generate AI Images
// Powered by SILA TECH
// ============================================

import axios from 'axios';

export default {
    name: 'text2image',
    description: 'Tengeneza picha kwa kutumia AI kutoka kwa maandishi yako',
    category: 'ai',
    alias: ['flux', 'aiimage', 'tengenezapicha'],
    
    async execute(sock, msg, args, prefix, config) {
        const chatId = msg.key.remoteJid;
        
        // Hakikisha user ameingiza prompt
        if (!args || args.length === 0) {
            const usageMsg = `📝 *Jinsi ya kutumia:*\n${prefix}text2image [maelezo yako]\n\n📌 *Mfano:*\n${prefix}text2image Cat\n${prefix}text2image Beautiful sunset on beach\n\n🎨 *Mitindo inayopatikana:* anime, realistic, artistic`;
            
            if (config.sendStyledMessage) {
                await config.sendStyledMessage(sock, chatId, usageMsg, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: usageMsg }, { quoted: msg });
            }
            return;
        }
        
        // Unganisha args kuwa prompt moja
        const prompt = args.join(' ');
        
        // Chagua aspect ratio (default 1:1)
        let aspect = '1:1';
        let style = 'anime'; // default style
        
        // Angalia kama user amespecify aspect au style (optional)
        // Kwa mfano: /text2image Cat aspect=16:9 style=realistic
        let finalPrompt = prompt;
        if (prompt.includes(' aspect=')) {
            const parts = prompt.split(' aspect=');
            finalPrompt = parts[0];
            const aspectPart = parts[1].split(' ');
            aspect = aspectPart[0];
            if (aspectPart[1] && aspectPart[1].includes('style=')) {
                style = aspectPart[1].replace('style=', '');
            }
        } else if (prompt.includes(' style=')) {
            const parts = prompt.split(' style=');
            finalPrompt = parts[0];
            style = parts[1].split(' ')[0];
        }
        
        try {
            // Tuma ujumbe wa kusubiri
            const waitMsg = `🎨 *Inatengeneza picha...*\n📝 Prompt: "${finalPrompt}"\n⏳ Tafadhali subiri sekunde chache...`;
            
            if (config.sendStyledMessage) {
                await config.sendStyledMessage(sock, chatId, waitMsg, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: waitMsg }, { quoted: msg });
            }
            
            // Call API
            const apiUrl = `https://api.theresav.biz.id/image/text2image?prompt=${encodeURIComponent(finalPrompt)}&aspect=${aspect}&style=${style}&apikey=9jJO9`;
            
            const response = await axios.get(apiUrl, {
                timeout: 30000, // 30 seconds kwa ajili ya image generation
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            // Angalia kama API imerudisha success
            if (!response.data || !response.data.status || !response.data.data || !response.data.data.imageUrl) {
                throw new Error("API haijarudisha URL ya picha");
            }
            
            const imageUrl = response.data.data.imageUrl;
            const imageDetails = response.data.data;
            
            // Caption ya picha
            const styledName = config.applyFont(config.BOT_NAME, config.BOT_FONT);
            const caption = `*╭┈┈┄⊰ ${styledName} - AI Image ⊱┄┄┄◈*\n\n` +
                           `*┋ •> 🎨 Prompt:* ${finalPrompt}\n` +
                           `*┋ •> 📐 Aspect:* ${imageDetails.aspect}\n` +
                           `*┋ •> 🎭 Style:* ${imageDetails.style}\n` +
                           `*┋ •> 📏 Size:* ${imageDetails.width}x${imageDetails.height}\n` +
                           `*┋ •> 👤 Creator:* ${response.data.creator}\n\n` +
                           `*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*\n` +
                           `> ® ${config.POWERED_BY}`;
            
            // Tuma picha
            await sock.sendMessage(chatId, {
                image: { url: imageUrl },
                caption: caption
            }, { quoted: msg });
            
        } catch (error) {
            console.error('Text2Image Error:', error.message);
            
            let errorMsg = `❌ *Imeshindwa kutengeneza picha!*\n`;
            
            if (error.response) {
                errorMsg += `🔧 *Error:* API imerudisha status ${error.response.status}\n`;
            } else if (error.code === 'ECONNABORTED') {
                errorMsg += `🔧 *Error:* Muda umekwisha. API inachukua muda mrefu.\n`;
            } else {
                errorMsg += `🔧 *Error:* ${error.message}\n`;
            }
            
            errorMsg += `💡 *Jaribu:* Tuma prompt fupi au jaribu tena baadae.`;
            
            if (config.sendStyledMessage) {
                await config.sendStyledMessage(sock, chatId, errorMsg, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: errorMsg }, { quoted: msg });
            }
        }
    }
};
