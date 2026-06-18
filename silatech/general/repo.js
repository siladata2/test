// ============================================
// REPO COMMAND - GitHub Repository Information
// Powered by SILA TECH
// ============================================

export default {
    name: 'repo',
    description: 'get github repository information and links',
    category: 'general',
    alias: ['repository', 'github', 'source'],
    
    async execute(sock, msg, args, prefix, config) {
        const chatId = msg.key.remoteJid;
        
        const repoUrl = 'https://github.com/Sila-Md/SILA-MD';
        const repoName = 'SILA-MD';
        const owner = 'Sila-Md';
        
        const styledName = config.applyFont(config.BOT_NAME, config.BOT_FONT);
        
        // Try to fetch repo info from GitHub API
        let stars = '☆';
        let forks = '⑂';
        let description = 'powerful whatsapp bot with multi-device support';
        
        try {
            const fetch = (await import('node-fetch')).default;
            const response = await fetch(`https://api.github.com/repos/${owner}/${repoName}`, {
                headers: { 'User-Agent': 'SILA-MD-Bot' }
            });
            
            if (response.ok) {
                const data = await response.json();
                stars = data.stargazers_count || '☆';
                forks = data.forks_count || '⑂';
                description = data.description || description;
            }
        } catch (error) {
            console.log('GitHub API error:', error.message);
        }
        
        const message = `╭┈┈┄⊰ ${styledName} - REPOSITORY ⊱┄┄┄◈
┋
┋ •> 📦 repo: ${repoName}
┋ •> 👤 owner: ${owner}
┋ •> ⭐ stars: ${stars}
┋ •> 🔱 forks: ${forks}
┋
┋ •> 📝 description:
┋ •> ${description}
┋
┋ •> 🔗 links:
┋ •> github: ${repoUrl}
┋ •> raw: ${repoUrl}/raw/main
┋
╰┄┄┄┄┄┈┈┈┈┄┄┄◈
> ® ${config.POWERED_BY}`;
        
        // Create buttons
        const buttons = [
            { name: 'view repo', buttonParamsJson: JSON.stringify({ displayText: 'view repo', url: repoUrl }) },
            { name: 'fork repo', buttonParamsJson: JSON.stringify({ displayText: 'fork repo', url: `${repoUrl}/fork` }) },
            { name: 'download zip', buttonParamsJson: JSON.stringify({ displayText: 'download zip', url: `${repoUrl}/archive/refs/heads/main.zip` }) },
            { name: 'deploy to heroku', buttonParamsJson: JSON.stringify({ displayText: 'deploy to heroku', url: `https://heroku.com/deploy?template=${repoUrl}` }) }
        ];
        
        try {
            // Try to send with buttons
            await sock.sendMessage(chatId, {
                text: message,
                contextInfo: {
                    ...config.getContextInfo(msg),
                    mentionedJid: [],
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: config.NEWSLETTER_JID,
                        newsletterName: config.NEWSLETTER_NAME,
                        serverMessageId: 143
                    }
                },
                templateButtons: buttons
            }, { quoted: msg });
        } catch (error) {
            // Fallback without buttons if template buttons not supported
            await sock.sendMessage(chatId, { text: message }, { quoted: msg });
            
            // Send links separately
            await sock.sendMessage(chatId, {
                text: `🔗 quick links:
                
• view: ${repoUrl}
• fork: ${repoUrl}/fork
• download: ${repoUrl}/archive/refs/heads/main.zip
• deploy: https://heroku.com/deploy?template=${repoUrl}`
            }, { quoted: msg });
        }
    }
};
