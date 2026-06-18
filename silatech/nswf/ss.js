// ============================================
// NSFW OPAI ANIME COMMAND - Get NSFW Anime Images
// Powered by SILA TECH
// ============================================

import axios from 'axios';

export default {
    name: 'opaianime',
    description: 'Pata picha za NSFW za anime (18+ pekee)',
    category: 'nsfw',
    alias: ['ss', 'animeboobs', 'boobies'],
    
    async execute(sock, msg, args, prefix, config) {
        const chatId = msg.key.remoteJid;
        
        try {
            // Tuma ujumbe wa kusubiri
            const waitMsg = `⏳ *Tafadhali subiri, natafuta picha za anime...*`;
            
            if (config.sendStyledMessage) {
                await config.sendStyledMessage(sock, chatId, waitMsg, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: waitMsg }, { quoted: msg });
            }

            // Call API - EXACTLY kama ilivyo kwenye text2image
            const response = await axios.get('https://api.theresav.biz.id/nsfw/opaianime?apikey=9jJO9', {
                timeout: 15000,
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            // Angalia kama API imerudisha success (kama text2image)
            if (!response.data || !response.data.status) {
                throw new Error("API haijarudisha status success");
            }
            
            // Kuchukua imageUrl - kama vile text2image inavyochukua response.data.data.imageUrl
            let imageUrl = null;
            
            // Kama response ina muundo sawa na text2image
            if (response.data.data && response.data.data.imageUrl) {
                imageUrl = response.data.data.imageUrl;
            }
            // Kama ni muundo mwingine
            else if (response.data.url) {
                imageUrl = response.data.url;
            }
            else if (response.data.imageUrl) {
                imageUrl = response.data.imageUrl;
            }
            else if (response.data.result && response.data.result.url) {
                imageUrl = response.data.result.url;
            }
            else if (typeof response.data === 'string') {
                imageUrl = response.data;
            }
            
            if (!imageUrl) {
                throw new Error("API haijarudisha URL ya picha. Response: " + JSON.stringify(response.data));
            }
            
            // Caption kama ile ya text2image
            const styledName = config.applyFont(config.BOT_NAME, config.BOT_FONT);
            const caption = `*╭┈┈┄⊰ ${styledName} - NSFW Anime ⊱┄┄┄◈*\n\n` +
                           `*┋ •> 🔞 Aina:* Oppai Anime\n` +
                           `*┋ •> 👤 Creator:* ${response.data.creator || 'Theresav API'}\n` +
                           `*┋ •> ⚠️ Onyo:* Maudhui haya ni ya watu wazima (18+)\n\n` +
                           `*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*\n` +
                           `> ® ${config.POWERED_BY}`;
            
            // Tuma picha - EXACTLY kama text2image inavyotuma
            await sock.sendMessage(chatId, {
                image: { url: imageUrl },
                caption: caption
            }, { quoted: msg });
            
        } catch (error) {
            console.error('OpaiAnime Error:', error.message);
            
            let errorMsg = `❌ *Imeshindwa kupata picha za anime!*\n`;
            
            if (error.response) {
                errorMsg += `🔧 *Error:* API imerudisha status ${error.response.status}\n`;
            } else if (error.code === 'ECONNABORTED') {
                errorMsg += `🔧 *Error:* Muda umekwisha. API inachukua muda mrefu.\n`;
            } else {
                errorMsg += `🔧 *Error:* ${error.message}\n`;
            }
            
            errorMsg += `💡 *Jaribu:* Tuma opaianime tena baadae.`;
            
            if (config.sendStyledMessage) {
                await config.sendStyledMessage(sock, chatId, errorMsg, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: errorMsg }, { quoted: msg });
            }
        }
    }
};
