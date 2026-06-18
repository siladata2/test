// silatech/fixme.js
export default {
    name: 'fixme',
    description: 'fix owner issue',
    category: 'owner',
    
    async execute(sock, msg, args, prefix, config) {
        const chatId = msg.key.remoteJid;
        let senderJid = msg.key.participant || chatId;
        
        const senderClean = senderJid.split('@')[0].split(':')[0];
        const ownerFromEnv = config.OWNER_NUMBER || process.env.OWNER_NUMBER || '';
        
        const message = `╭━━〔 FIX OWNER ISSUE 〕━━┈⊷
┃
┃ Your ID: ${senderJid}
┃ Your Clean ID: ${senderClean}
┃ Owner in .env: ${ownerFromEnv}
┃
┃ To fix, add this to your .env file:
┃ OWNER_NUMBER=${senderClean}
┃
┃ Then restart the bot
┃
╰━━━━━━━━━━━━━━┈⊷
> ${config.POWERED_BY}`;
        
        await sock.sendMessage(chatId, { text: message }, { quoted: msg });
        
        // Also try to save directly
        const fs = await import('fs');
        const dotenvPath = './.env';
        
        if (fs.existsSync(dotenvPath)) {
            let envContent = fs.readFileSync(dotenvPath, 'utf8');
            if (envContent.includes('OWNER_NUMBER=')) {
                envContent = envContent.replace(/OWNER_NUMBER=.*/g, `OWNER_NUMBER=${senderClean}`);
            } else {
                envContent += `\nOWNER_NUMBER=${senderClean}\n`;
            }
            fs.writeFileSync(dotenvPath, envContent);
            await sock.sendMessage(chatId, { text: '✓ Owner number updated in .env file. Please restart the bot.' }, { quoted: msg });
        }
    }
};
