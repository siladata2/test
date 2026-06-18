// ============================================
// SILA MESSAGES - Complete Bot Message System
// Powered by SILA TECH
// ============================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import { cleanJid } from './silafunctions.js';
import { applyFont } from './fonts/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const MESSAGES_FILE = path.join(ROOT_DIR, 'silamd', 'database', 'messages.json');

const originalConsoleMethods = {
    log: console.log, info: console.info, warn: console.warn,
    error: console.error, debug: console.debug, trace: console.trace,
    dir: console.dir, dirxml: console.dirxml, table: console.table,
    time: console.time, timeEnd: console.timeEnd, timeLog: console.timeLog,
    group: console.group, groupEnd: console.groupEnd, groupCollapsed: console.groupCollapsed,
    clear: console.clear, count: console.count, countReset: console.countReset,
    assert: console.assert, profile: console.profile, profileEnd: console.profileEnd,
    timeStamp: console.timeStamp, context: console.context
};

let messageLogCounter = 0;

// ============ DEFAULT MESSAGES ============
const DEFAULT_MESSAGES = {
    // Owner Only Messages
    ownerOnly: [
        "only the bot owner can use this command.",
        "this command is reserved for the owner.",
        "you don't have permission to execute this command.",
        "only the one who created me can use this.",
        "access denied. owner only command.",
    ],
    
    // Admin Only Messages
    adminOnly: [
        "only group admins can use this command.",
        "this action requires admin privileges.",
        "you need to be a group admin to execute this.",
        "admin status required for this operation.",
        "only group moderators can use this command.",
    ],
    
    // Bot Admin Required Messages
    botAdminRequired: [
        "i need to be an admin to do that.",
        "please make me an admin first.",
        "i don't have admin privileges here.",
        "cannot perform this action without admin rights.",
        "make me admin and try again.",
    ],
    
    // Bot Mode Messages
    mode: {
        private: [
            "bot is in private mode. only the owner can interact right now.",
            "i'm in incognito mode. only my creator can reach me.",
            "private mode active. exclusive access for the owner only.",
        ],
        self: [
            "self mode active. i only respond to my own messages right now.",
            "i'm in self-reflection mode. external commands are disabled.",
            "self-dialogue mode. please wait until mode changes.",
        ],
        maintenance: [
            "bot is under maintenance. please check back later.",
            "system upgrade in progress. services will resume shortly.",
            "maintenance mode active. command processing is paused.",
        ]
    },
    
    // Success Messages
    success: [
        "command executed successfully.",
        "operation completed successfully.",
        "done! your request has been processed.",
        "success! operation completed without errors.",
        "task completed successfully.",
    ],
    
    // Warning Messages
    warning: [
        "please check your input and try again.",
        "invalid input detected. operation aborted.",
        "something doesn't look right. please verify.",
        "unexpected input. please review your command.",
    ],
    
    // Error Messages
    error: [
        "an error occurred while processing your request.",
        "command execution failed. please try again later.",
        "something went wrong. technical team notified.",
        "unable to complete the operation at this time.",
    ],
    
    // Group Welcome Messages
    groupWelcome: [
        "welcome to the group!",
        "glad to have you here!",
        "hope you enjoy your stay!",
        "a new member has arrived!",
        "welcome aboard!",
    ],
    
    // Group Leave Messages
    groupLeave: [
        "has left the group.",
        "has departed.",
        "has exited the group.",
        "is no longer with us.",
    ],
    
    // Anti-Delete Messages
    antiDelete: [
        "message deletion detected!",
        "deleted message recovered!",
        "nice try, but i saw that!",
        "you can't hide from me!",
    ],
    
    // Anti-Link Messages
    antiLink: [
        "group links are not allowed here.",
        "external group links are prohibited.",
        "no group link promotion allowed.",
        "link sharing is disabled in this group.",
    ],
    
    // Anti-Media Messages
    antiMedia: {
        image: "images are not allowed here.",
        video: "videos are not allowed here.",
        audio: "audio files are not allowed here.",
        document: "documents are not allowed here.",
        sticker: "stickers are not allowed here.",
        text: "text messages are not allowed here.",
        emoji: "emojis are not allowed here.",
    },
    
    // Anti-Badword Messages
    antiBadword: [
        "bad language is not allowed here.",
        "please keep the conversation clean.",
        "offensive language detected and removed.",
        "let's keep it respectful in here.",
    ],
    
    // Anti-Bot Messages
    antiBot: [
        "bot accounts are not allowed here.",
        "automated accounts detected and removed.",
        "bots are prohibited in this group.",
    ],
    
    // Anti-Spam Messages
    antiSpam: [
        "please don't spam!",
        "slow down! you're sending too many messages.",
        "spamming is not allowed here.",
    ],
    
    // Anti-Bug Messages
    antiBug: [
        "invalid characters detected. message removed.",
        "your message contains harmful content.",
        "message blocked due to security concerns.",
    ],
    
    // Anti-Tag Messages
    antiTag: [
        "you're tagging too many people.",
        "excessive tagging is not allowed.",
        "please don't spam mentions.",
    ],
    
    // Anti-Mention Messages
    antiMention: [
        "too many mentions in one message.",
        "excessive mentions detected. message deleted.",
        "please don't mention everyone at once.",
    ],
    
    // Anti-Bun Messages
    antiBun: [
        "suspicious content detected. message removed.",
        "your message has been blocked for security reasons.",
        "this type of content is not allowed here.",
    ],
    
    // Command Cooldown Message
    cooldown: [
        "slow down! wait {time} seconds before using this command again.",
        "cooldown active. {time} seconds remaining.",
        "please wait {time} seconds before trying again.",
    ],
    
    // Unknown Command Message
    unknownCommand: [
        "unknown command. type {prefix}help to see available commands.",
        "command not found. use {prefix}help for assistance.",
        "i don't recognize that command. try {prefix}help.",
    ],
    
    // Bot Join Messages
    botJoin: [
        "hey everyone! i'm here to help.",
        "bot has joined the group. type {prefix}help to get started.",
        "hello! i'm ready to assist. use {prefix}help for commands.",
    ],
    
    // Bot Leave Messages
    botLeave: [
        "goodbye everyone! it was fun.",
        "bot is leaving the group. farewell!",
        "signing off. take care everyone!",
    ],
    
    // Promote Message
    promote: [
        "has been promoted to admin.",
        "is now a group admin.",
        "has been given admin privileges.",
    ],
    
    // Demote Message
    demote: [
        "has been demoted from admin.",
        "is no longer a group admin.",
        "admin privileges have been removed.",
    ],
    
    // Kick Message
    kick: [
        "has been removed from the group.",
        "has been kicked out.",
        "is no longer a member.",
    ],
    
    // Add Message
    add: [
        "has been added to the group.",
        "has joined. welcome!",
        "is now a member.",
    ],
    
    // Mute/Close Group Message
    groupClosed: [
        "group has been closed. only admins can send messages now.",
        "group is now locked. admin-only messaging enabled.",
        "conversation restricted to admins only.",
    ],
    
    // Unmute/Open Group Message
    groupOpened: [
        "group has been opened. everyone can send messages now.",
        "group is now unlocked. all members can chat.",
        "conversation is now open to everyone.",
    ],
    
    // Reset Link Message
    resetLink: [
        "group invite link has been reset.",
        "new invite link generated successfully.",
        "invite link refreshed.",
    ],
    
    // Set Name Message
    setName: [
        "group name has been changed.",
        "group name updated successfully.",
        "name changed to: {name}",
    ],
    
    // Set Description Message
    setDescription: [
        "group description has been updated.",
        "description changed successfully.",
        "group info updated.",
    ],
    
    // Disappear Messages
    disappearOn: [
        "disappearing messages enabled. messages will disappear after {time}.",
        "ephemeral mode activated. messages will self-destruct.",
    ],
    disappearOff: [
        "disappearing messages disabled. messages will now stay permanently.",
        "ephemeral mode deactivated. messages will be saved.",
    ],
    
    // Anti Settings Messages
    antiEnabled: [
        "{feature} has been enabled.",
        "{feature} activated successfully.",
        "{feature} is now active.",
    ],
    antiDisabled: [
        "{feature} has been disabled.",
        "{feature} deactivated successfully.",
        "{feature} is now inactive.",
    ],
    antiActionSet: [
        "action for {feature} set to: {action}",
        "{feature} will now {action} violations.",
    ],
    
    // Link System Messages
    linkSuccess: [
        "you have been linked as bot owner!",
        "successfully linked! you are now the bot owner.",
        "ownership claimed. you now have full control.",
    ],
    linkAlreadyExists: [
        "this bot already has an owner.",
        "ownership already claimed by someone else.",
        "bot already has a registered owner.",
    ],
    unlinkSuccess: [
        "bot ownership has been removed.",
        "owner unlinked successfully.",
        "ownership cleared.",
    ],
    
    // Font System Messages
    fontChanged: [
        "bot font changed to: {font}",
        "font style updated to {font}.",
        "now using {font} font style.",
    ],
    fontInvalid: [
        "invalid font style. available: normal, bold, italic, monospace, cursive, doubleStruck",
        "font not found. use {prefix}setfont to see available fonts.",
    ],
    
    // Restart Message
    restart: [
        "bot is restarting. be right back!",
        "restarting... see you in a moment!",
        "system reboot initiated. brb!",
    ],
};

// ============ LOAD/SAVE MESSAGES ============
let messages = { ...DEFAULT_MESSAGES };

function loadMessages() {
    try {
        if (fs.existsSync(MESSAGES_FILE)) {
            const saved = JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf8'));
            messages = { ...DEFAULT_MESSAGES, ...saved };
        } else {
            const dir = path.dirname(MESSAGES_FILE);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(MESSAGES_FILE, JSON.stringify(DEFAULT_MESSAGES, null, 2));
        }
    } catch (e) {
        messages = { ...DEFAULT_MESSAGES };
    }
    return messages;
}

function saveMessages() {
    try {
        fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2));
        return true;
    } catch (e) { return false; }
}

// Load on startup
loadMessages();

// ============ UPDATE MESSAGES ============
export function updateMessage(category, key, value, index = null) {
    if (index !== null && Array.isArray(messages[category]) && messages[category][index]) {
        messages[category][index] = value;
    } else if (key && messages[category] && messages[category][key]) {
        messages[category][key] = value;
    } else if (messages[category]) {
        if (Array.isArray(messages[category])) {
            messages[category].push(value);
        } else {
            messages[category] = value;
        }
    }
    saveMessages();
    return true;
}

export function addMessage(category, message) {
    if (!messages[category]) messages[category] = [];
    messages[category].push(message);
    saveMessages();
    return true;
}

export function getMessages() {
    return messages;
}

// ============ GET RANDOM MESSAGE ============
function getRandom(arr) {
    if (!arr || !arr.length) return "";
    return arr[Math.floor(Math.random() * arr.length)];
}

// ============ EXPORT MESSAGE FUNCTIONS ============
export const getOwnerOnlyMessage = () => getRandom(messages.ownerOnly);
export const getAdminOnlyMessage = () => getRandom(messages.adminOnly);
export const getBotAdminRequiredMessage = () => getRandom(messages.botAdminRequired);
export const getModeErrorMessage = (mode) => getRandom(messages.mode?.[mode] || messages.mode?.private);
export const getSuccessMessage = () => getRandom(messages.success);
export const getWarningMessage = () => getRandom(messages.warning);
export const getErrorMessage = () => getRandom(messages.error);
export const getGroupWelcomeMessage = (user) => getRandom(messages.groupWelcome);
export const getGroupLeaveMessage = (user) => `@${user} ${getRandom(messages.groupLeave)}`;
export const getAntiDeleteMessage = () => getRandom(messages.antiDelete);
export const getAntiLinkMessage = () => getRandom(messages.antiLink);
export const getAntiMediaMessage = (type) => messages.antiMedia?.[type] || "this type of media is not allowed here.";
export const getAntiBadwordMessage = () => getRandom(messages.antiBadword);
export const getAntiBotMessage = () => getRandom(messages.antiBot);
export const getAntiSpamMessage = () => getRandom(messages.antiSpam);
export const getAntiBugMessage = () => getRandom(messages.antiBug);
export const getAntiTagMessage = () => getRandom(messages.antiTag);
export const getAntiMentionMessage = () => getRandom(messages.antiMention);
export const getAntiBunMessage = () => getRandom(messages.antiBun);
export const getCooldownMessage = (time) => getRandom(messages.cooldown).replace("{time}", time);
export const getUnknownCommandMessage = (prefix) => getRandom(messages.unknownCommand).replace("{prefix}", prefix);
export const getBotJoinMessage = (prefix) => getRandom(messages.botJoin).replace("{prefix}", prefix);
export const getBotLeaveMessage = () => getRandom(messages.botLeave);
export const getPromoteMessage = (user) => `@${user} ${getRandom(messages.promote)}`;
export const getDemoteMessage = (user) => `@${user} ${getRandom(messages.demote)}`;
export const getKickMessage = (user) => `@${user} ${getRandom(messages.kick)}`;
export const getAddMessage = (user) => `+${user} ${getRandom(messages.add)}`;
export const getGroupClosedMessage = () => getRandom(messages.groupClosed);
export const getGroupOpenedMessage = () => getRandom(messages.groupOpened);
export const getResetLinkMessage = () => getRandom(messages.resetLink);
export const getSetNameMessage = (name) => getRandom(messages.setName).replace("{name}", name);
export const getSetDescriptionMessage = () => getRandom(messages.setDescription);
export const getDisappearOnMessage = (time) => getRandom(messages.disappearOn).replace("{time}", time);
export const getDisappearOffMessage = () => getRandom(messages.disappearOff);
export const getAntiEnabledMessage = (feature) => getRandom(messages.antiEnabled).replace("{feature}", feature);
export const getAntiDisabledMessage = (feature) => getRandom(messages.antiDisabled).replace("{feature}", feature);
export const getAntiActionSetMessage = (feature, action) => getRandom(messages.antiActionSet).replace("{feature}", feature).replace("{action}", action);
export const getLinkSuccessMessage = () => getRandom(messages.linkSuccess);
export const getLinkAlreadyExistsMessage = () => getRandom(messages.linkAlreadyExists);
export const getUnlinkSuccessMessage = () => getRandom(messages.unlinkSuccess);
export const getFontChangedMessage = (font) => getRandom(messages.fontChanged).replace("{font}", font);
export const getFontInvalidMessage = (prefix) => getRandom(messages.fontInvalid).replace("{prefix}", prefix);
export const getRestartMessage = () => getRandom(messages.restart);

// ============ COMMAND TO VIEW/EDIT MESSAGES ============
export const messageCommands = [
    {
        name: 'messages',
        description: 'view all bot messages',
        category: 'owner',
        ownerOnly: true,
        async execute(sock, msg, args, prefix, config) {
            const chatId = msg.key.remoteJid;
            const categories = Object.keys(messages);
            let text = `📋 *available message categories*\n\n`;
            for (const cat of categories) {
                const count = Array.isArray(messages[cat]) ? messages[cat].length : Object.keys(messages[cat]).length;
                text += `• ${cat}: ${count} messages\n`;
            }
            text += `\nuse ${prefix}getmsg <category> to view messages\n`;
            text += `use ${prefix}setmsg <category> <index> <new message> to edit\n`;
            text += `use ${prefix}addmsg <category> <message> to add new message`;
            await sock.sendMessage(chatId, { text }, { quoted: msg });
        }
    },
    {
        name: 'getmsg',
        description: 'view messages in a category',
        category: 'owner',
        ownerOnly: true,
        async execute(sock, msg, args, prefix, config) {
            const chatId = msg.key.remoteJid;
            const category = args[0];
            if (!category || !messages[category]) {
                await sock.sendMessage(chatId, { text: `category "${category}" not found.` }, { quoted: msg });
                return;
            }
            const data = messages[category];
            let text = `📋 *${category}*\n\n`;
            if (Array.isArray(data)) {
                data.forEach((m, i) => {
                    text += `${i + 1}. ${m}\n\n`;
                });
            } else {
                Object.keys(data).forEach((key) => {
                    if (Array.isArray(data[key])) {
                        text += `*${key}:*\n`;
                        data[key].forEach((m, i) => {
                            text += `  ${i + 1}. ${m}\n`;
                        });
                        text += `\n`;
                    } else {
                        text += `${key}: ${data[key]}\n`;
                    }
                });
            }
            await sock.sendMessage(chatId, { text }, { quoted: msg });
        }
    },
    {
        name: 'setmsg',
        description: 'edit a message',
        category: 'owner',
        ownerOnly: true,
        async execute(sock, msg, args, prefix, config) {
            const chatId = msg.key.remoteJid;
            const category = args[0];
            const index = parseInt(args[1]) - 1;
            const newMsg = args.slice(2).join(' ');
            
            if (!category || !messages[category] || !Array.isArray(messages[category])) {
                await sock.sendMessage(chatId, { text: `category "${category}" not found or not an array.` }, { quoted: msg });
                return;
            }
            if (isNaN(index) || index < 0 || index >= messages[category].length) {
                await sock.sendMessage(chatId, { text: `invalid index. use ${prefix}getmsg ${category} to see available indices.` }, { quoted: msg });
                return;
            }
            if (!newMsg) {
                await sock.sendMessage(chatId, { text: `please provide the new message.` }, { quoted: msg });
                return;
            }
            
            messages[category][index] = newMsg;
            saveMessages();
            await sock.sendMessage(chatId, { text: `✅ message ${index + 1} in "${category}" updated successfully.` }, { quoted: msg });
        }
    },
    {
        name: 'addmsg',
        description: 'add a new message to a category',
        category: 'owner',
        ownerOnly: true,
        async execute(sock, msg, args, prefix, config) {
            const chatId = msg.key.remoteJid;
            const category = args[0];
            const newMsg = args.slice(1).join(' ');
            
            if (!category || !newMsg) {
                await sock.sendMessage(chatId, { text: `usage: ${prefix}addmsg <category> <message>` }, { quoted: msg });
                return;
            }
            if (!messages[category]) messages[category] = [];
            if (!Array.isArray(messages[category])) {
                await sock.sendMessage(chatId, { text: `category "${category}" is not an array.` }, { quoted: msg });
                return;
            }
            
            messages[category].push(newMsg);
            saveMessages();
            await sock.sendMessage(chatId, { text: `✅ message added to "${category}". total: ${messages[category].length}` }, { quoted: msg });
        }
    },
    {
        name: 'resetmsg',
        description: 'reset messages to default',
        category: 'owner',
        ownerOnly: true,
        async execute(sock, msg, args, prefix, config) {
            const chatId = msg.key.remoteJid;
            const category = args[0];
            
            if (category && DEFAULT_MESSAGES[category]) {
                messages[category] = JSON.parse(JSON.stringify(DEFAULT_MESSAGES[category]));
                saveMessages();
                await sock.sendMessage(chatId, { text: `✅ category "${category}" reset to default.` }, { quoted: msg });
            } else if (!category) {
                messages = JSON.parse(JSON.stringify(DEFAULT_MESSAGES));
                saveMessages();
                await sock.sendMessage(chatId, { text: `✅ all messages reset to default.` }, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: `category "${category}" not found.` }, { quoted: msg });
            }
        }
    }
];

// ============ ULTRA CLEAN LOGGER ============
export class UltraCleanLogger {
    static log(...args) {
        const message = args.join(' ').toLowerCase();
        const suppressPatterns = ['buffer','timeout','transaction','failed to decrypt','received error','sessionerror','bad mac','stream errored','baileys','whatsapp','ws','closing session','sessionentry','_chains','registrationid','currentratchet','indexinfo','pendingprekey','ephemeralkeypair','lastremoteephemeralkey','rootkey','basekey','signal','key','ratchet','encryption','decryption','qr','scan','pairing','connection.update','creds.update','messages.upsert','group','participant','metadata','presence.update','chat.update','message.receipt.update','message.update','keystore','keypair','pubkey','privkey','<buffer','05 ','0x','signalkey','signalprotocol','sessionstate','senderkey','groupcipher','signalgroup'];
        for (const pattern of suppressPatterns) { if (message.includes(pattern)) return; }
        const timestamp = chalk.gray(`[${new Date().toLocaleTimeString()}]`);
        const cleanArgs = args.map(arg => typeof arg === 'string' ? arg.replace(/\n\s+/g, ' ') : arg);
        originalConsoleMethods.log(timestamp, ...cleanArgs);
    }
    static error(...args) {
        const message = args.join(' ');
        if (message.toLowerCase().includes('fatal') || message.toLowerCase().includes('critical') || message.includes('❌')) {
            const timestamp = chalk.red(`[${new Date().toLocaleTimeString()}]`);
            originalConsoleMethods.error(timestamp, ...args);
        }
    }
    static success(...args) { originalConsoleMethods.log(chalk.green(`[${new Date().toLocaleTimeString()}]`), chalk.green('✅'), ...args); }
    static info(...args) { originalConsoleMethods.log(chalk.blue(`[${new Date().toLocaleTimeString()}]`), chalk.blue('ℹ️'), ...args); }
    static warning(...args) { originalConsoleMethods.log(chalk.yellow(`[${new Date().toLocaleTimeString()}]`), chalk.yellow('⚠️'), ...args); }
    static event(...args) { originalConsoleMethods.log(chalk.magenta(`[${new Date().toLocaleTimeString()}]`), chalk.magenta('🎭'), ...args); }
    static command(...args) { originalConsoleMethods.log(chalk.cyan(`[${new Date().toLocaleTimeString()}]`), chalk.cyan('💬'), ...args); }
    static critical(...args) { originalConsoleMethods.error(chalk.red(`[${new Date().toLocaleTimeString()}]`), chalk.red('🚨'), ...args); }
    static group(...args) { originalConsoleMethods.log(chalk.magenta(`[${new Date().toLocaleTimeString()}]`), chalk.magenta('👥'), ...args); }
    static member(...args) { originalConsoleMethods.log(chalk.cyan(`[${new Date().toLocaleTimeString()}]`), chalk.cyan('👤'), ...args); }
}

console.log = UltraCleanLogger.log;
console.error = UltraCleanLogger.error;
console.info = UltraCleanLogger.info;
console.warn = UltraCleanLogger.warning;
console.debug = () => {};
console.critical = UltraCleanLogger.critical;
global.logSuccess = UltraCleanLogger.success;
global.logInfo = UltraCleanLogger.info;
global.logWarning = UltraCleanLogger.warning;
global.logEvent = UltraCleanLogger.event;
global.logCommand = UltraCleanLogger.command;
global.logGroup = UltraCleanLogger.group;
global.logMember = UltraCleanLogger.member;

// ============ ULTRA SILENT LOGGER ============
export const ultraSilentLogger = {
    level: 'silent', trace: () => {}, debug: () => {}, info: () => {}, warn: () => {},
    error: () => {}, fatal: () => {}, child: () => ultraSilentLogger, log: () => {},
    success: () => {}, warning: () => {}, event: () => {}, command: () => {}
};

// ============ MESSAGE STORE ============
export class MessageStore {
    constructor() { 
        this.messages = new Map(); 
        this.maxMessages = 100; 
    }
    addMessage(jid, messageId, message) {
        try {
            const key = `${jid}|${messageId}`;
            this.messages.set(key, { ...message, timestamp: Date.now() });
            if (this.messages.size > this.maxMessages) {
                this.messages.delete(this.messages.keys().next().value);
            }
        } catch {}
    }
    getMessage(jid, messageId) { 
        try { 
            return this.messages.get(`${jid}|${messageId}`) || null; 
        } catch { 
            return null; 
        } 
    }
}

// ============ LOG INCOMING MESSAGE ============
export async function logIncomingMessage(sock, msg, textMsg, groupName = null) {
    try {
        messageLogCounter++;
        const logNum = messageLogCounter;
        const chatId = msg.key.remoteJid;
        const isGroup = chatId.endsWith('@g.us');
        const rawSenderJid = msg.key.participant || chatId;
        const timeStr = new Date().toLocaleTimeString('en-GB', { hour12: false });
        
        const resolvedSenderJid = rawSenderJid;
        const cleaned = cleanJid(resolvedSenderJid);
        const phoneNumber = '+' + cleaned.cleanNumber;
        
        let displayName = phoneNumber;
        try {
            const contacts = sock.store?.contacts || {};
            const contact = contacts[resolvedSenderJid] || contacts[rawSenderJid];
            displayName = contact?.name || contact?.notify || phoneNumber;
        } catch {}
        
        if (isGroup) {
            let gName = groupName || chatId;
            const line = '─'.repeat(42);
            originalConsoleMethods.log(chalk.green(
                `\n╭${line}\n` +
                `│ 🧛 ${chalk.bold(`SILA SMD LOG #${logNum}`)}\n` +
                `├${line}\n` +
                `│ 👥 group: ${gName}\n` +
                `│ 👤 sender: ${displayName}\n` +
                `│ ☎️ number: ${phoneNumber}\n` +
                `│ 💬 message: ${textMsg.substring(0, 80)}${textMsg.length > 80 ? '…' : ''}\n` +
                `│ 🕒 time: ${timeStr}\n` +
                `╰${line}`
            ));
        } else {
            const line = '─'.repeat(37);
            originalConsoleMethods.log(chalk.green(
                `\n╭${line}\n` +
                `│ 🧛 ${chalk.bold(`SILA SMD LOG #${logNum}`)}\n` +
                `├${line}\n` +
                `│ 👤 name: ${displayName}\n` +
                `│ ☎️ number: ${phoneNumber}\n` +
                `│ 💬 message: ${textMsg.substring(0, 80)}${textMsg.length > 80 ? '…' : ''}\n` +
                `│ 🕒 time: ${timeStr}\n` +
                `╰${line}`
            ));
        }
    } catch {}
}

// ============ PROCESS FILTER ============
export function setupProcessFilter() {
    const originalStdoutWrite = process.stdout.write;
    const originalStderrWrite = process.stderr.write;
    const sessionPatterns = ['closing session','sessionentry','registrationid','currentratchet',
        'indexinfo','pendingprekey','_chains','ephemeralkeypair','lastremoteephemeralkey','rootkey','basekey'];
    const filterOutput = (chunk) => {
        const lowerChunk = chunk.toString().toLowerCase();
        return !sessionPatterns.some(p => lowerChunk.includes(p));
    };
    process.stdout.write = function (chunk, encoding, callback) {
        if (filterOutput(chunk)) return originalStdoutWrite.call(this, chunk, encoding, callback);
        if (callback) callback(); return true;
    };
    process.stderr.write = function (chunk, encoding, callback) {
        if (filterOutput(chunk)) return originalStderrWrite.call(this, chunk, encoding, callback);
        if (callback) callback(); return true;
    };
}

export function silenceBaileysCompletely() {
    try { 
        const pino = require('pino'); 
        pino({ level: 'silent', enabled: false }); 
    } catch {}
}

// ============ RATE LIMIT PROTECTION ============
export class RateLimitProtection {
    constructor(minCommandDelay = 1000, stickerDelay = 2000, rateLimitEnabled = true) {
        this.commandTimestamps = new Map();
        this.userCooldowns = new Map();
        this.globalCooldown = Date.now();
        this.stickerSendTimes = new Map();
        this.minCommandDelay = minCommandDelay;
        this.stickerDelay = stickerDelay;
        this.rateLimitEnabled = rateLimitEnabled;
        setInterval(() => this.cleanup(), 60000);
    }
    
    canSendCommand(chatId, userId, command) {
        if (!this.rateLimitEnabled) return { allowed: true };
        const now = Date.now();
        const userKey = `${userId}_${command}`;
        const chatKey = `${chatId}_${command}`;
        
        if (this.userCooldowns.has(userKey)) {
            const timeDiff = now - this.userCooldowns.get(userKey);
            if (timeDiff < this.minCommandDelay) return { allowed: false, reason: getCooldownMessage(Math.ceil((this.minCommandDelay - timeDiff) / 1000)) };
        }
        if (this.commandTimestamps.has(chatKey)) {
            const timeDiff = now - this.commandTimestamps.get(chatKey);
            if (timeDiff < this.minCommandDelay) return { allowed: false, reason: getCooldownMessage(Math.ceil((this.minCommandDelay - timeDiff) / 1000)) };
        }
        if (now - this.globalCooldown < 250) return { allowed: false, reason: 'system is busy. please try again in a moment.' };
        
        this.userCooldowns.set(userKey, now);
        this.commandTimestamps.set(chatKey, now);
        this.globalCooldown = now;
        return { allowed: true };
    }
    
    async waitForSticker(chatId) {
        if (!this.rateLimitEnabled) { 
            await this.delay(this.stickerDelay); 
            return; 
        }
        const now = Date.now();
        const lastSticker = this.stickerSendTimes.get(chatId) || 0;
        const timeDiff = now - lastSticker;
        if (timeDiff < this.stickerDelay) await this.delay(this.stickerDelay - timeDiff);
        this.stickerSendTimes.set(chatId, Date.now());
    }
    
    delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
    
    cleanup() {
        const now = Date.now();
        const fiveMinutes = 5 * 60 * 1000;
        for (const [key, timestamp] of this.userCooldowns.entries()) { 
            if (now - timestamp > fiveMinutes) this.userCooldowns.delete(key); 
        }
        for (const [key, timestamp] of this.commandTimestamps.entries()) { 
            if (now - timestamp > fiveMinutes) this.commandTimestamps.delete(key); 
        }
    }
}

// Load message commands
export const messageCommandsList = messageCommands;

// Export all
export default {
    messages,
    loadMessages,
    saveMessages,
    updateMessage,
    addMessage,
    getMessages,
    getOwnerOnlyMessage,
    getAdminOnlyMessage,
    getBotAdminRequiredMessage,
    getModeErrorMessage,
    getSuccessMessage,
    getWarningMessage,
    getErrorMessage,
    getGroupWelcomeMessage,
    getGroupLeaveMessage,
    getAntiDeleteMessage,
    getAntiLinkMessage,
    getAntiMediaMessage,
    getAntiBadwordMessage,
    getAntiBotMessage,
    getAntiSpamMessage,
    getAntiBugMessage,
    getAntiTagMessage,
    getAntiMentionMessage,
    getAntiBunMessage,
    getCooldownMessage,
    getUnknownCommandMessage,
    getBotJoinMessage,
    getBotLeaveMessage,
    getPromoteMessage,
    getDemoteMessage,
    getKickMessage,
    getAddMessage,
    getGroupClosedMessage,
    getGroupOpenedMessage,
    getResetLinkMessage,
    getSetNameMessage,
    getSetDescriptionMessage,
    getDisappearOnMessage,
    getDisappearOffMessage,
    getAntiEnabledMessage,
    getAntiDisabledMessage,
    getAntiActionSetMessage,
    getLinkSuccessMessage,
    getLinkAlreadyExistsMessage,
    getUnlinkSuccessMessage,
    getFontChangedMessage,
    getFontInvalidMessage,
    getRestartMessage,
    messageCommandsList,
    UltraCleanLogger,
    ultraSilentLogger,
    MessageStore,
    logIncomingMessage,
    setupProcessFilter,
    silenceBaileysCompletely,
    RateLimitProtection
};
