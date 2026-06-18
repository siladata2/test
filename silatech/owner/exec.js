// ============================================
// EXEC COMMAND - Execute shell commands
// Owner Only - Use with caution
// Powered by SILA TECH
// ============================================

import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

export default {
    name: 'exec',
    description: 'Execute shell commands (Owner Only)',
    category: 'owner',
    alias: ['shell', 'run', 'execute'],
    ownerOnly: true,
    
    async execute(sock, msg, args, prefix, config) {
        const chatId = msg.key.remoteJid;
        
        if (!args[0]) {
            const styledName = config.applyFont(config.BOT_NAME, config.BOT_FONT);
            const message = `*╭┈┈┄⊰ ${styledName} - EXEC COMMAND ⊱┄┄┄◈*
┋
┋ •> 📋 *Usage:*
┋ •> ${prefix}exec <command>
┋
┋ •> 📌 *Example:*
┋ •> ${prefix}exec ls -la
┋ •> ${prefix}exec pm2 list
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
        
        const command = args.join(' ');
        
        try {
            const { stdout, stderr } = await execPromise(command);
            const output = stdout || stderr || 'No output';
            
            let result = output.substring(0, 3000);
            
            const styledName = config.applyFont(config.BOT_NAME, config.BOT_FONT);
            const message = `*╭┈┈┄⊰ ${styledName} - EXEC RESULT ⊱┄┄┄◈*
┋
┋ •> 📟 *Command:* ${command}
┋
┋ •> 📝 *Output:*
┋ •> ${result.replace(/\n/g, '\n┋ •> ')}
┋
╰┄┄┄┄┄┈┈┈┈┄┄┄◈
> ® ${config.POWERED_BY}`;
            
            if (config.sendStyledMessage) {
                await config.sendStyledMessage(sock, chatId, message, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: message }, { quoted: msg });
            }
            
        } catch (error) {
            const errorMsg = `❌ *Execution failed!*\nError: ${error.message}`;
            if (config.sendStyledMessage) {
                await config.sendStyledMessage(sock, chatId, errorMsg, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: errorMsg }, { quoted: msg });
            }
        }
    }
};