// ============================================
// LANG COMMAND - Change bot language
// Owner Only
// Powered by SILA TECH
// ============================================

import { getLanguages, getCurrentLanguage, setLanguage, SUPPORTED_LANGUAGES } from '../../sila/translate.js';

export default {
    name: 'lang',
    description: 'change bot language (auto translation)',
    category: 'owner',
    alias: ['language', 'setlang', 'translate'],
    ownerOnly: true,
    
    async execute(sock, msg, args, prefix, config) {
        const chatId = msg.key.remoteJid;
        
        if (!args[0]) {
            const current = getCurrentLanguage();
            const langs = getLanguages();
            
            let message = `╭┈┈┄⊰ LANGUAGE SYSTEM ⊱┄┄┄◈
┋
┋ •> 🌐 current language: ${current.flag} ${current.name} (${current.code})
┋
┋ •> 📋 available languages:
┋`;
            
            for (const [code, lang] of Object.entries(langs)) {
                const marker = code === current.code ? '✓' : ' ';
                message += `\n┋ •> ${marker} ${lang.flag} ${lang.name} (${code})`;
            }
            
            message += `\n┋
┋ •> usage: ${prefix}lang <language_code>
┋ •> example: ${prefix}lang sw
┋ •> example: ${prefix}lang es
┋
╰┄┄┄┄┄┈┈┈┈┄┄┄◈
> ® ${config.POWERED_BY}`;
            
            if (config.sendStyledMessage) {
                await config.sendStyledMessage(sock, chatId, message, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: message }, { quoted: msg });
            }
            return;
        }
        
        const langCode = args[0].toLowerCase();
        
        if (!SUPPORTED_LANGUAGES[langCode]) {
            const errorMsg = `❌ language not supported.

available: ${Object.keys(SUPPORTED_LANGUAGES).join(', ')}`;
            
            await sock.sendMessage(chatId, { text: errorMsg }, { quoted: msg });
            return;
        }
        
        await setLanguage(langCode);
        
        const lang = SUPPORTED_LANGUAGES[langCode];
        const message = `╭┈┈┄⊰ LANGUAGE CHANGED ⊱┄┄┄◈
┋
┋ •> ${lang.flag} language set to: *${lang.name}* (${langCode})
┋
┋ •> all bot messages will now be automatically translated
┋
╰┄┄┄┄┄┈┈┈┈┄┄┄◈
> ® ${config.POWERED_BY}`;
        
        await sock.sendMessage(chatId, { text: message }, { quoted: msg });
    }
};
