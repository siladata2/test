// ============================================
// FOLLOWCHANNEL COMMAND - Follow a channel/newsletter
// Powered by SILA TECH
// ============================================

export default {
    name: 'followchannel',
    description: 'follow a whatsapp channel or newsletter',
    category: 'general',
    alias: ['follow', 'subscribe', 'joinchannel'],
    
    async execute(sock, msg, args, prefix, config) {
        const chatId = msg.key.remoteJid;
        
        let channelJid = config.NEWSLETTER_JID || '120363402325089913@newsletter';
        
        if (args[0]) {
            let input = args[0];
            if (input.includes('whatsapp.com/channel/')) {
                const match = input.match(/channel\/([0-9a-zA-Z]+)/);
                if (match) {
                    channelJid = `${match[1]}@newsletter`;
                }
            } else if (input.includes('@newsletter')) {
                channelJid = input;
            } else if (input.match(/^[0-9a-zA-Z]+$/)) {
                channelJid = `${input}@newsletter`;
            }
        }
        
        const styledName = config.applyFont(config.BOT_NAME, config.BOT_FONT);
        
        try {
            await sock.newsletterFollow(channelJid);
            
            const message = `╭┈┈┄⊰ ${styledName} - FOLLOW CHANNEL ⊱┄┄┄◈
┋
┋ •> ✅ successfully followed channel!
┋ •> 🆔 id: ${channelJid}
┋
┋ •> 🔗 you will now receive updates from this channel
┋
╰┄┄┄┄┄┈┈┈┈┄┄┄◈
> ® ${config.POWERED_BY}`;
            
            if (config.sendStyledMessage) {
                await config.sendStyledMessage(sock, chatId, message, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: message }, { quoted: msg });
            }
            
        } catch (error) {
            const errorMsg = `╭┈┈┄⊰ ${styledName} - ERROR ⊱┄┄┄◈
┋
┋ •> ❌ failed to follow channel
┋ •> 📝 error: ${error.message}
┋
┋ •> usage:
┋ •> ${prefix}followchannel
┋ •> ${prefix}followchannel <channel_jid>
┋ •> ${prefix}followchannel <invite_link>
┋
╰┄┄┄┄┄┈┈┈┈┄┄┄◈
> ® ${config.POWERED_BY}`;
            
            if (config.sendStyledMessage) {
                await config.sendStyledMessage(sock, chatId, errorMsg, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: errorMsg }, { quoted: msg });
            }
        }
    }
};
