// ============================================
// NSFW ASS COMMAND - Get NSFW Ass Images
// Powered by SILA TECH
// ============================================

import axios from 'axios';

export default {
    name: 'ass',
    description: 'Pata picha za NSFW Ass (Inaruhusiwa 18+ pekee)',
    category: 'nsfw',
    alias: ['bikiniass', 'booty'],
    
    async execute(sock, msg, args, prefix, config) {
        const chatId = msg.key.remoteJid;
        
        // [ANGALIZO] Unaweza kuweka ulinzi hapa kama hutaki itumike ovyo kwenye magroup
        
        try {
            // Tuma ujumbe wa kusubiri
            const waitMsg = `⏳ *Tafadhali subiri, natafuta picha...*`;
            
            if (config.sendStyledMessage) {
                await config.sendStyledMessage(sock, chatId, waitMsg, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: waitMsg }, { quoted: msg });
            }

            // Kufanya request kwenye API yako
            const response = await axios.get('https://api.theresav.biz.id/nsfw/ass?apikey=9jJO9', {
                timeout: 10000,
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            // REKEBISHO: Angalia muundo tofauti wa API response
            let imageUrl = null;
            
            // Jaribu kupata URL kwenye response
            if (response.data && typeof response.data === 'object') {
                // Angalia njia za kawaida za API response
                if (response.data.url) {
                    imageUrl = response.data.url;
                } else if (response.data.result && response.data.result.url) {
                    imageUrl = response.data.result.url;
                } else if (response.data.data && response.data.data.url) {
                    imageUrl = response.data.data.url;
                } else if (response.data.image) {
                    imageUrl = response.data.image;
                } else if (response.data.link) {
                    imageUrl = response.data.link;
                } else if (response.data.message && typeof response.data.message === 'string') {
                    imageUrl = response.data.message;
                } else if (typeof response.data === 'string') {
                    imageUrl = response.data;
                } else {
                    // Kama hakuna URL, angalia kama response ni array ya images
                    const firstKey = Object.keys(response.data)[0];
                    if (firstKey && response.data[firstKey] && typeof response.data[firstKey] === 'string') {
                        imageUrl = response.data[firstKey];
                    }
                }
            }
            
            // Thibitisha kuwa imageUrl ni string halali
            if (!imageUrl || typeof imageUrl !== 'string') {
                throw new Error("API haijarudisha URL halali. Tafadhali angalia API response: " + JSON.stringify(response.data));
            }
            
            const styledName = config.applyFont(config.BOT_NAME, config.BOT_FONT);
            
            // Maelezo ya chini ya picha
            const caption = `*╭┈┈┄⊰ ${styledName} - NSFW ⊱┄┄┄◈*\n\n*┋ •> 🔞 Aina:* NSFW Ass\n*┋ •> ⚠️ Onyo:* Maudhui haya ni ya watu wazima (18+)\n\n*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*\n> ® ${config.POWERED_BY}`;

            // Tuma picha
            await sock.sendMessage(chatId, {
                image: { url: imageUrl },
                caption: caption
            }, { quoted: msg });

        } catch (error) {
            // Kama kukitokea tatizo
            console.error('Error details:', error.message);
            
            const errorMsg = `❌ *Imeshindwa kupata picha kwa sasa!*\n🔧 *Error:* ${error.message || 'API Error'}\n💡 *Tafadhali jaribu tena baadae.*`;
            
            if (config.sendStyledMessage) {
                await config.sendStyledMessage(sock, chatId, errorMsg, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: errorMsg }, { quoted: msg });
            }
        }
    }
};
