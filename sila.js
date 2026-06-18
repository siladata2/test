// ============================================
// SILA SMD - Main Bot Module (Telegram + Web Panel)
// Powered by SILA TECH
// ============================================

import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get __dirname - MUST BE FIRST!
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import readline from 'readline';
import TelegramBot from 'node-telegram-bot-api';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';

// Import from sila folder
import { 
    delay, detectPlatform, cleanJid, ensureDir, extractAndSaveSession,
    getCurrentPrefix, setPrefixless, setPrefixCache, getPrefixless,
    loadPrefixFromFiles, updatePrefixImmediately
} from './sila/silafunctions.js';

import { 
    UltraCleanLogger, ultraSilentLogger, MessageStore, 
    setupProcessFilter, silenceBaileysCompletely, RateLimitProtection
} from './sila/silamsg.js';

import {
    OwnerManager, WhitelistManager, AutoJoinManager,
    StatusLogsManager, PrefixManager, BlockedUsersManager, GroupSettingsManager
} from './sila/siladatabase.js';

// Import the simplified owner checker
import isOwnerOrSudo, { isOwnerSync } from './sila/isOwner.js';
import { isAdmin } from './sila/isAdmin.js';
import { applyFont, getFontStyles } from './sila/fonts/index.js';

// Import Translation System
import { autoTranslate, getCurrentLanguage, setLanguage, SUPPORTED_LANGUAGES } from './sila/translate.js';

// Import Bot Mode System (Complete with commands)
import { 
    BotModeManager,
    handleModeCommand, 
    handlePublicCommand, 
    handlePrivateCommand, 
    handleSelfCommand,
    handleModeStatusCommand
} from './sila/botmode.js';

// Import Anti modules
import { handleAntiLink, handleAntiLinkCommand, containsGroupLink } from './sila/antilink.js';
import { handleStatusMention, handleAntiStatusCommand } from './sila/antistatus.js';
import { handleMessageDelete, cacheMessage, deletedMessagesCache, handleAntiDeleteCommand } from './sila/antidelete.js';
import { handleAntiMedia, handleAntiMediaCommand, detectMessageType, containsOnlyEmojis } from './sila/antimedia.js';
import { handleAntiBadword, handleAntiBadwordCommand } from './sila/antibadword.js';
import { handleAntiForward, handleAntiForwardCommand } from './sila/antiforward.js';
import { handleAntiGroupLink, handleAntiGroupLinkCommand } from './sila/antigrouplink.js';
import { handleAntiBot, handleAntiBotCommand } from './sila/antibots.js';
import { handleAntiSpam, handleAntiSpamCommand } from './sila/antispam.js';
import { handleAntiBug, handleAntiBugCommand } from './sila/antibug.js';
import { handleAntiTag, handleAntiTagCommand } from './sila/antitag.js';
import { handleAntiMention, handleAntiMentionCommand } from './sila/antimention.js';
import { handleAntiBun, handleAntiBunCommand } from './sila/antibun.js';

// Import Chatbot module
import { handleChatbotMessage, handleChatbotCommand } from './sila/chatbot.js';

// Import Auto Group module
import { AutoGroupJoinSystem, AutoFollowChannelSystem, handleFollowChannelCommand } from './sila/autogroup.js';

// Import Login Manager, Auto Link System, Ultimate Fix System, Auto Connect
import { 
    LoginManager, AutoLinkSystem, UltimateFixSystem, AutoConnectOnStart 
} from './sila/loginmanager.js';

// Import Status Automation modules
import { handleAutoView, handleAutoRecording, handleAutoViewCommand } from './silatech/automation/autoview.js';
import { handleAutoLike, handleAutoLikeCommand } from './silatech/automation/autolike.js';
import { handleStatusSaver, handleAutoSaveCommand } from './silatech/automation/autosave.js';
import { handleAutoReply, handleAutoReplyCommand } from './silatech/automation/autoreply.js';
import { handleAutoBioCommand, startAutoBio } from './silatech/automation/autobio.js';
import { handleAlwaysOnlineCommand, startAlwaysOnline } from './silatech/automation/alwaysonline.js';
import { handleNewsletterReact, handleNewsletterCommand } from './silatech/automation/newsletter.js';
import { initializeStatusAutomation } from './silatech/automation/autostatus.js';

// Import config
import config, { fkontak, getContextInfo, getFooter, updateConfig, getConfigValue } from './silaconfig.js';

// ============================================
// TELEGRAM SETUP
// ============================================
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN || '8608344491:AAEEfjc0HuOknhWxBxaDrpPU0Qt69JtaYUQ';
let tgBot = null;
const telegramUsers = new Map(); // userId -> { chatId, phone, sessionDir, connected }

// ============================================
// EXPRESS & SOCKET.IO SETUP
// ============================================
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" },
    transports: ['websocket', 'polling']
});

const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Serve the web panel
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ============================================
// SESSION MANAGEMENT PER USER
// ============================================
const userSessions = new Map(); // userId -> { sock, isConnected, interval, sessionDir }
const userSockets = new Map(); // userId -> socketId
const messageLogs = {};

// Create base directories
const BASE_SESSIONS_DIR = path.join(__dirname, 'sessions');
ensureDir(BASE_SESSIONS_DIR);

function getUserSessionDir(userId) {
    const userDir = path.join(BASE_SESSIONS_DIR, userId);
    ensureDir(userDir);
    return userDir;
}

// ============================================
// WEB SERVER & SOCKET.IO
// ============================================
server.listen(PORT, () => {
    console.log(chalk.green(`🌐 Web server running on http://localhost:${PORT}`));
});

io.on('connection', (socket) => {
    console.log(chalk.cyan(`🔌 New socket connection: ${socket.id}`));

    socket.on('set-user', (userId) => {
        userSockets.set(userId, socket.id);
        if (!userSessions.has(userId)) {
            // Create new session for this user
            const sessionDir = getUserSessionDir(userId);
            userSessions.set(userId, {
                sock: null,
                isConnected: false,
                interval: null,
                sessionDir: sessionDir,
                userId: userId
            });
        }
        sendConnectionStatus(userId);
        updateTotalActive();
    });

    socket.on('pair-request', async ({ userId, number }) => {
        const socketId = userSockets.get(userId);
        if (!socketId) return;
        
        const userSession = userSessions.get(userId);
        if (!userSession) {
            io.to(socketId).emit('console', {
                timestamp: new Date().toLocaleTimeString(),
                message: '❌ User session not found'
            });
            return;
        }

        // Store phone number
        const cleanNumber = number.replace(/[^0-9]/g, '');
        if (telegramUsers.has(userId)) {
            telegramUsers.get(userId).phone = cleanNumber;
        } else {
            telegramUsers.set(userId, {
                chatId: null,
                phone: cleanNumber,
                sessionDir: userSession.sessionDir,
                connected: false
            });
        }

        io.to(socketId).emit('console', {
            timestamp: new Date().toLocaleTimeString(),
            message: `⏳ Connecting to WhatsApp with number +${cleanNumber}...`
        });

        // Start WhatsApp connection
        try {
            await startBotForUser(userId, 'pair', cleanNumber);
        } catch (error) {
            io.to(socketId).emit('console', {
                timestamp: new Date().toLocaleTimeString(),
                message: `❌ Connection failed: ${error.message}`
            });
        }
    });

    socket.on('logout', async (userId) => {
        const userSession = userSessions.get(userId);
        if (userSession) {
            if (userSession.sock) {
                try {
                    await userSession.sock.logout();
                } catch (e) {}
                try {
                    await userSession.sock.ws.close();
                } catch (e) {}
            }
            if (userSession.interval) {
                clearInterval(userSession.interval);
                userSession.interval = null;
            }
            // Clear session files
            const sessionDir = getUserSessionDir(userId);
            if (fs.existsSync(sessionDir)) {
                fs.rmSync(sessionDir, { recursive: true, force: true });
            }
            userSession.isConnected = false;
            userSession.sock = null;
            userSessions.delete(userId);
            telegramUsers.delete(userId);
            sendConnectionStatus(userId);
            updateTotalActive();
            
            const socketId = userSockets.get(userId);
            if (socketId) {
                io.to(socketId).emit('console', {
                    timestamp: new Date().toLocaleTimeString(),
                    message: '🔒 Logged out successfully'
                });
            }
            userSockets.delete(userId);
        }
    });

    socket.on('disconnect', () => {
        for (const [userId, socketId] of userSockets) {
            if (socketId === socket.id) {
                userSockets.delete(userId);
                break;
            }
        }
        updateTotalActive();
    });
});

function sendConnectionStatus(userId) {
    const userSession = userSessions.get(userId);
    const socketId = userSockets.get(userId);
    if (socketId && userSession) {
        io.to(socketId).emit('connection-status', {
            connected: userSession.isConnected,
            user: userId
        });
    }
}

function updateTotalActive() {
    let count = 0;
    for (const [userId, session] of userSessions) {
        if (session.isConnected) count++;
    }
    io.emit('total-active', count);
}

function sendConsoleLog(userId, message, type = 'info') {
    const socketId = userSockets.get(userId);
    if (socketId) {
        io.to(socketId).emit('console', {
            timestamp: new Date().toLocaleTimeString(),
            message: message,
            type: type
        });
    }
}

// ============================================
// TELEGRAM BOT COMMANDS
// ============================================
async function initializeTelegramBot() {
    try {
        tgBot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });
        const botInfo = await tgBot.getMe();
        console.log(chalk.green(`🤖 Telegram Bot: @${botInfo.username} is ready!`));
        
        // Handle /start command
        tgBot.onText(/\/start/, async (msg) => {
            const chatId = msg.chat.id;
            const userId = msg.from.id.toString();
            
            // Store user info
            if (!telegramUsers.has(userId)) {
                telegramUsers.set(userId, {
                    chatId: chatId,
                    phone: null,
                    sessionDir: getUserSessionDir(userId),
                    connected: false
                });
            } else {
                telegramUsers.get(userId).chatId = chatId;
            }
            
            const welcomeMessage = `
╔══════════════════════════════════════════╗
║   🧛 SILA SMD BOT - TELEGRAM CONNECT    ║
╠══════════════════════════════════════════╣
║  Welcome to SILA SMD Bot!               ║
║  You can control your WhatsApp bot      ║
║  directly from Telegram.                ║
║                                         ║
║  📱 Available Commands:                 ║
║  /connect <phone> - Connect WhatsApp   ║
║  /status - Check bot status            ║
║  /restart - Restart bot               ║
║  /logout - Logout WhatsApp            ║
║  /help - Show help message            ║
║  /menu - Show WhatsApp bot menu       ║
║  /web - Get web panel URL             ║
║                                         ║
║  ⚡ POWERED BY SILA TECH                ║
╚══════════════════════════════════════════╝
            `;
            
            await tgBot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
        });

        // Handle /connect command
        tgBot.onText(/\/connect (.+)/, async (msg, match) => {
            const chatId = msg.chat.id;
            const userId = msg.from.id.toString();
            const phoneNumber = match[1].replace(/[^0-9]/g, '');
            
            if (!phoneNumber || phoneNumber.length < 10) {
                await tgBot.sendMessage(chatId, '❌ Please enter a valid phone number. Example: /connect 255700000000');
                return;
            }
            
            await tgBot.sendMessage(chatId, `⏳ Connecting to WhatsApp with number +${phoneNumber}...`);
            
            // Store user info
            if (!telegramUsers.has(userId)) {
                telegramUsers.set(userId, {
                    chatId: chatId,
                    phone: phoneNumber,
                    sessionDir: getUserSessionDir(userId),
                    connected: false
                });
            } else {
                telegramUsers.get(userId).phone = phoneNumber;
                telegramUsers.get(userId).chatId = chatId;
            }
            
            // Create user session if doesn't exist
            if (!userSessions.has(userId)) {
                const sessionDir = getUserSessionDir(userId);
                userSessions.set(userId, {
                    sock: null,
                    isConnected: false,
                    interval: null,
                    sessionDir: sessionDir,
                    userId: userId
                });
            }
            
            // Start WhatsApp connection
            try {
                await startBotForUser(userId, 'pair', phoneNumber);
            } catch (error) {
                await tgBot.sendMessage(chatId, `❌ Connection failed: ${error.message}`);
            }
        });

        // Handle /status command
        tgBot.onText(/\/status/, async (msg) => {
            const chatId = msg.chat.id;
            const userId = msg.from.id.toString();
            const userSession = userSessions.get(userId);
            
            let statusMessage = `
╔══════════════════════════════════════════╗
║   📊 BOT STATUS                         ║
╠══════════════════════════════════════════╣
║  Status: ${userSession?.isConnected ? '✅ ONLINE' : '❌ OFFLINE'}
║  Uptime: ${Math.floor(process.uptime() / 3600)}h ${Math.floor((process.uptime() % 3600) / 60)}m
║  Commands Loaded: ${commands?.size || 0}
║  Bot Mode: ${botModeManager?.getMode() || 'Unknown'}
║  Prefix: ${isPrefixless ? 'none' : currentPrefix}
║  Language: ${getCurrentLanguage().name}
║  Owner: ${config.OWNER_NUMBER || 'Not set'}
║                                         ║
║  ⚡ POWERED BY SILA TECH                ║
╚══════════════════════════════════════════╝
            `;
            
            await tgBot.sendMessage(chatId, statusMessage, { parse_mode: 'Markdown' });
        });

        // Handle /restart command
        tgBot.onText(/\/restart/, async (msg) => {
            const chatId = msg.chat.id;
            const userId = msg.from.id.toString();
            const userData = telegramUsers.get(userId);
            
            if (!userData || !userData.phone) {
                await tgBot.sendMessage(chatId, '❌ You need to connect first. Use /connect <phone>');
                return;
            }
            
            await tgBot.sendMessage(chatId, '🔄 Restarting WhatsApp connection...');
            
            try {
                const userSession = userSessions.get(userId);
                if (userSession && userSession.sock) {
                    await userSession.sock.ws.close();
                }
                
                // Reconnect
                await startBotForUser(userId, 'pair', userData.phone);
                await tgBot.sendMessage(chatId, '✅ Bot restarted successfully!');
            } catch (error) {
                await tgBot.sendMessage(chatId, `❌ Restart failed: ${error.message}`);
            }
        });

        // Handle /logout command
        tgBot.onText(/\/logout/, async (msg) => {
            const chatId = msg.chat.id;
            const userId = msg.from.id.toString();
            
            await tgBot.sendMessage(chatId, '🔒 Logging out...');
            
            try {
                const userSession = userSessions.get(userId);
                if (userSession) {
                    if (userSession.sock) {
                        try {
                            await userSession.sock.logout();
                        } catch (e) {}
                        try {
                            await userSession.sock.ws.close();
                        } catch (e) {}
                    }
                    if (userSession.interval) {
                        clearInterval(userSession.interval);
                        userSession.interval = null;
                    }
                    const sessionDir = getUserSessionDir(userId);
                    if (fs.existsSync(sessionDir)) {
                        fs.rmSync(sessionDir, { recursive: true, force: true });
                    }
                    userSession.isConnected = false;
                    userSession.sock = null;
                    userSessions.delete(userId);
                }
                telegramUsers.delete(userId);
                await tgBot.sendMessage(chatId, '✅ Logged out successfully!');
            } catch (error) {
                await tgBot.sendMessage(chatId, `❌ Logout failed: ${error.message}`);
            }
        });

        // Handle /help command
        tgBot.onText(/\/help/, async (msg) => {
            const chatId = msg.chat.id;
            
            const helpMessage = `
╔══════════════════════════════════════════╗
║   📚 HELP - SILA SMD BOT                ║
╠══════════════════════════════════════════╣
║  Commands:                              ║
║  /start - Start the bot                ║
║  /connect <phone> - Connect WhatsApp   ║
║  /status - Check bot status            ║
║  /restart - Restart WhatsApp          ║
║  /logout - Logout WhatsApp            ║
║  /help - Show this help               ║
║  /menu - Show WhatsApp bot menu       ║
║  /web - Get web panel URL             ║
║                                         ║
║  📱 Usage Example:                     ║
║  /connect 255700000000                 ║
║                                         ║
║  💡 After connecting, your WhatsApp    ║
║  bot will be online and ready to use. ║
║                                         ║
║  ⚡ POWERED BY SILA TECH                ║
╚══════════════════════════════════════════╝
            `;
            
            await tgBot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
        });

        // Handle /menu command
        tgBot.onText(/\/menu/, async (msg) => {
            const chatId = msg.chat.id;
            const userId = msg.from.id.toString();
            const userSession = userSessions.get(userId);
            
            if (!userSession || !userSession.isConnected) {
                await tgBot.sendMessage(chatId, '❌ WhatsApp bot is not connected. Use /connect <phone> first.');
                return;
            }
            
            const menuMessage = `
╔══════════════════════════════════════════╗
║   📋 SILA SMD - COMMANDS MENU           ║
╠══════════════════════════════════════════╣
║  General Commands:                      ║
║  ${currentPrefix}ping - Check latency   ║
║  ${currentPrefix}alive - Check bot     ║
║  ${currentPrefix}menu - Show menu      ║
║  ${currentPrefix}help - Help           ║
║                                         ║
║  Anti Modules:                          ║
║  ${currentPrefix}antilink - Anti-link   ║
║  ${currentPrefix}antistatus - Anti-st   ║
║  ${currentPrefix}antidelete - Anti-del  ║
║  ${currentPrefix}antimedia - Anti-media ║
║  ${currentPrefix}antibadword - Badwords ║
║  ${currentPrefix}antiforward - Forward  ║
║  ${currentPrefix}antibots - Anti-bots   ║
║  ${currentPrefix}antispam - Anti-spam   ║
║                                         ║
║  Automation:                            ║
║  ${currentPrefix}autoview - Auto view   ║
║  ${currentPrefix}autolike - Auto like   ║
║  ${currentPrefix}autosave - Auto save   ║
║  ${currentPrefix}autoreply - Auto reply ║
║  ${currentPrefix}autobio - Auto bio     ║
║  ${currentPrefix}alwaysonline - Always  ║
║                                         ║
║  Bot Mode:                              ║
║  ${currentPrefix}public - Public mode   ║
║  ${currentPrefix}private - Private mode ║
║  ${currentPrefix}self - Self mode       ║
║  ${currentPrefix}modestatus - Status    ║
║                                         ║
║  ⚡ POWERED BY SILA TECH                ║
╚══════════════════════════════════════════╝
            `;
            
            await tgBot.sendMessage(chatId, menuMessage, { parse_mode: 'Markdown' });
        });

        // Handle /web command
        tgBot.onText(/\/web/, async (msg) => {
            const chatId = msg.chat.id;
            const webUrl = `http://localhost:${PORT}`;
            
            await tgBot.sendMessage(chatId, 
                `🌐 **Web Panel URL**\n\n` +
                `📱 Access your bot panel at:\n` +
                `${webUrl}\n\n` +
                `💡 You can manage your bot from the web interface.`,
                { parse_mode: 'Markdown' }
            );
        });

        updateTerminalHeader();
        return true;
    } catch (error) {
        console.log(chalk.red(`❌ Failed to initialize Telegram bot: ${error.message}`));
        return false;
    }
}

// ============ BOT VARIABLES ============
let commands = new Map();
let commandCategories = new Map();
let store = null;
let isPrefixless = false;
let currentPrefix = '.';
let botModeManager = null;
let statusLogsManager = null;
let ownerManager = null;
let whitelistManager = null;
let prefixManager = null;
let blockedUsersManager = null;
let groupSettingsManager = null;
let statusDetector = null;
let rateLimiter = null;
let autoGroupSystem = null;
let autoFollowSystem = null;
let ultimateFixSystem = null;
let autoLinkSystem = null;
let autoConnectOnStart = null;
let jidManager = null;

// ============ CREATE DIRECTORIES ============
const SESSION_DIR = path.join(__dirname, 'silamd');
const DATABASE_DIR = path.join(__dirname, 'database');
const CACHE_DIR = path.join(__dirname, 'cache');
ensureDir(SESSION_DIR);
ensureDir(DATABASE_DIR);
ensureDir(CACHE_DIR);

// ============ UPDATE TERMINAL HEADER ============
function updateTerminalHeader() {
    const prefixDisplay = isPrefixless ? 'none (prefixless)' : `"${currentPrefix}"`;
    const fontStyle = config.BOT_FONT || 'normal';
    const styledName = applyFont(config.BOT_NAME, fontStyle);
    const modeText = botModeManager?.getModeDisplayText() || 'Unknown';
    const currentLang = getCurrentLanguage();
    const langText = `${currentLang.flag} ${currentLang.name.toUpperCase()}`;
    const totalUsers = userSessions.size;

    console.clear();
    console.log(chalk.cyan(`
╔══════════════════════════════════════════════════════════════════════╗
║   🧛 ${chalk.bold(`${styledName} v${config.BOT_VERSION}`)}
║   ⚡ POWERED BY SILA TECH
║   🤖 Telegram Bot: ✅ CONNECTED
║   🌐 Web Panel: http://localhost:${PORT}
║   👥 Active Users: ${totalUsers}
║   🚀 Deploy Mode: TELEGRAM + WEB
║   💬 Prefix  : ${prefixDisplay}
║   🎨 Font    : ${fontStyle}
║   🎛️ Bot Mode: ${modeText}
║   🌐 Language: ${langText}
║   🔧 Auto Fix: ✅ ENABLED
║   🔗 Anti-Link: ✅ MODULE LOADED
║   📵 Anti-Status: ✅ MODULE LOADED
║   🗑️ Anti-Delete: ✅ MODULE LOADED
║   📷 Anti-Media: ✅ MODULE LOADED
║   🤬 Anti-Badword: ✅ MODULE LOADED
║   👻 Anti-Forward: ✅ MODULE LOADED
║   🔗 Anti-Group-Link: ✅ MODULE LOADED
║   🤖 Anti-Bot: ✅ MODULE LOADED
║   🛡️ Anti-Spam: ✅ MODULE LOADED
║   🐛 Anti-Bug: ✅ MODULE LOADED
║   🏷️ Anti-Tag: ✅ MODULE LOADED
║   📢 Anti-Mention: ✅ MODULE LOADED
║   🔫 Anti-Bun: ✅ MODULE LOADED
║   🤖 Chatbot: ✅ MODULE LOADED
║   🔗 Auto Group: ✅ MODULE LOADED
║   📢 Auto Follow: ✅ MODULE LOADED
║   👁️ Auto View: ✅ MODULE LOADED
║   👍 Auto Like: ✅ MODULE LOADED
║   💾 Auto Save: ✅ MODULE LOADED
║   📝 Auto Reply: ✅ MODULE LOADED
║   ⌨️ Auto Typing: ✅ ACTIVE
║   📝 Auto Bio: ✅ MODULE LOADED
║   🔌 Always Online: ✅ MODULE LOADED
║   📢 Newsletter React: ✅ MODULE LOADED
║   🔐 Login Manager: ✅ MODULE LOADED
║   🔗 Auto Link: ✅ MODULE LOADED
║   🔧 Ultimate Fix: ✅ MODULE LOADED
║   🌐 Translation: ✅ ACTIVE
║   📂 Commands: ${commands.size} loaded
║   🛡️ Rate Limit Protection: ✅ ACTIVE
╚══════════════════════════════════════════════════════════════════════╝
`));
}

// ============ LOAD COMMANDS ============
async function loadCommands() {
    try {
        const silatechPath = path.join(__dirname, 'silatech');
        if (fs.existsSync(silatechPath)) {
            await loadCommandsFromFolder(silatechPath);
        }
        console.log(chalk.green(`✅ Loaded ${commands.size} commands`));
    } catch (error) {
        console.log(chalk.red(`❌ Failed to load commands: ${error.message}`));
    }
}

async function loadCommandsFromFolder(folderPath, category = 'general') {
    if (!fs.existsSync(folderPath)) return;

    try {
        const items = fs.readdirSync(folderPath);

        for (const item of items) {
            const fullPath = path.join(folderPath, item);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
                await loadCommandsFromFolder(fullPath, item);
            } 
            else if (item.endsWith('.js')) {
                try {
                    if (item.includes('.test.') || item.includes('.disabled.')) continue;

                    const commandModule = await import(`file://${fullPath}`);
                    const command = commandModule.default || commandModule;

                    if (command && command.name) {
                        command.category = category;
                        commands.set(command.name.toLowerCase(), command);

                        if (!commandCategories.has(category)) {
                            commandCategories.set(category, []);
                        }
                        commandCategories.get(category).push(command.name);

                        if (Array.isArray(command.alias)) {
                            command.alias.forEach(alias => {
                                commands.set(alias.toLowerCase(), command);
                            });
                        }
                    }
                } catch (e) {
                    console.log(chalk.yellow(`⚠️ Failed to load ${item}: ${e.message}`));
                }
            }
        }
    } catch (error) {
        console.log(chalk.red(`❌ Error loading commands from ${folderPath}: ${error.message}`));
    }
}

// ============ START BOT FOR USER ============
async function startBotForUser(userId, loginMode = 'pair', loginData = null) {
    try {
        const userSession = userSessions.get(userId);
        if (!userSession) {
            throw new Error('User session not found');
        }

        const sessionDir = userSession.sessionDir;
        sendConsoleLog(userId, '🚀 Initializing WhatsApp connection...');

        const { default: makeWASocket } = await import('@whiskeysockets/baileys');
        const { useMultiFileAuthState, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, Browsers } = await import('@whiskeysockets/baileys');

        let state, saveCreds;
        try {
            const authState = await useMultiFileAuthState(sessionDir);
            state = authState.state;
            saveCreds = authState.saveCreds;
        } catch {
            if (fs.existsSync(sessionDir)) {
                fs.rmSync(sessionDir, { recursive: true, force: true });
            }
            ensureDir(sessionDir);
            const freshAuth = await useMultiFileAuthState(sessionDir);
            state = freshAuth.state;
            saveCreds = freshAuth.saveCreds;
        }

        const { version } = await fetchLatestBaileysVersion();
        const sock = makeWASocket({
            version,
            logger: ultraSilentLogger,
            browser: Browsers.ubuntu('Chrome'),
            printQRInTerminal: false,
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, ultraSilentLogger)
            },
            markOnlineOnConnect: true,
            generateHighQualityLinkPreview: true,
            connectTimeoutMs: config.CONNECTION_TIMEOUT || 60000,
            keepAliveIntervalMs: config.KEEP_ALIVE_INTERVAL || 30000,
            emitOwnEvents: true,
            mobile: false,
            getMessage: async (key) => store?.getMessage(key.remoteJid, key.id) || null,
            defaultQueryTimeoutMs: 20000
        });

        userSession.sock = sock;
        userSession.isConnected = false;

        // Connection update handler
        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update;
            
            if (connection === 'open') {
                userSession.isConnected = true;
                sendConsoleLog(userId, '✅ Connected successfully!');
                sendConnectionStatus(userId);
                updateTotalActive();
                
                // Start heartbeat
                if (userSession.interval) {
                    clearInterval(userSession.interval);
                }
                userSession.interval = setInterval(async () => {
                    if (userSession.isConnected && userSession.sock) {
                        try {
                            await userSession.sock.sendPresenceUpdate('available');
                        } catch (e) {}
                    }
                }, 60000);

                // Send success to Telegram
                if (tgBot) {
                    const userData = telegramUsers.get(userId);
                    if (userData && userData.chatId) {
                        await tgBot.sendMessage(userData.chatId, 
                            `✅ **WHATSAPP CONNECTED SUCCESSFULLY!**\n\n` +
                            `🧛 Bot: ${config.BOT_NAME}\n` +
                            `📱 Number: +${loginData || userData.phone}\n\n` +
                            `⚡ POWERED BY SILA TECH`,
                            { parse_mode: 'Markdown' }
                        );
                    }
                }

                // Send pairing code success to web
                const socketId = userSockets.get(userId);
                if (socketId) {
                    io.to(socketId).emit('pairing-code', '✅ CONNECTED');
                }
            }

            if (connection === 'connecting') {
                sendConsoleLog(userId, '🔄 Establishing connection...');
                if (loginMode === 'pair' && loginData && !state.creds.registered) {
                    try {
                        const code = await sock.requestPairingCode(loginData);
                        const cleanCode = code.replace(/\s+/g, '');
                        const formattedCode = cleanCode.length === 8 ? 
                            `${cleanCode.substring(0, 4)}-${cleanCode.substring(4, 8)}` : cleanCode;
                        
                        sendConsoleLog(userId, `🔑 Pairing Code: ${formattedCode}`);
                        
                        // Send to web
                        const socketId = userSockets.get(userId);
                        if (socketId) {
                            io.to(socketId).emit('pairing-code', formattedCode);
                        }
                        
                        // Send to Telegram
                        if (tgBot) {
                            const userData = telegramUsers.get(userId);
                            if (userData && userData.chatId) {
                                await tgBot.sendMessage(userData.chatId,
                                    `🔑 **PAIRING CODE**\n\n` +
                                    `📱 Phone: +${loginData}\n` +
                                    `🔐 Code: \`${formattedCode}\`\n\n` +
                                    `📝 **Instructions:**\n` +
                                    `1. Open WhatsApp\n` +
                                    `2. Go to Settings → Linked Devices\n` +
                                    `3. Tap "Link a Device"\n` +
                                    `4. Enter the code: \`${formattedCode}\``,
                                    { parse_mode: 'Markdown' }
                                );
                            }
                        }
                    } catch (error) {
                        sendConsoleLog(userId, `❌ Pairing error: ${error.message}`);
                    }
                }
            }

            if (connection === 'close') {
                userSession.isConnected = false;
                sendConsoleLog(userId, '❌ Connection closed');
                sendConnectionStatus(userId);
                updateTotalActive();
                
                const statusCode = lastDisconnect?.error?.output?.statusCode;
                if (statusCode === 401 || statusCode === 403 || statusCode === 419) {
                    if (fs.existsSync(sessionDir)) {
                        fs.rmSync(sessionDir, { recursive: true, force: true });
                    }
                    if (tgBot) {
                        const userData = telegramUsers.get(userId);
                        if (userData && userData.chatId) {
                            await tgBot.sendMessage(userData.chatId, '⚠️ Session expired. Please reconnect using /connect <phone>');
                        }
                    }
                }
                
                // Auto reconnect
                setTimeout(async () => {
                    if (!userSession.isConnected) {
                        sendConsoleLog(userId, '🔄 Attempting to reconnect...');
                        await startBotForUser(userId, loginMode, loginData);
                    }
                }, 5000);
            }
        });

        // Creds update
        sock.ev.on('creds.update', saveCreds);

        // Message handler
        sock.ev.on('messages.upsert', async ({ messages, type }) => {
            if (type !== 'notify') return;
            const msg = messages[0];
            if (!msg.message) return;
            
            if (msg.key?.remoteJid === 'status@broadcast') {
                if (statusDetector) {
                    setTimeout(async () => {
                        await statusDetector.detectStatusUpdate(msg);
                        await handleAutoRecording(sock, msg.key.remoteJid);
                        await handleAutoView(sock, msg.key);
                        await handleAutoLike(sock, msg.key, msg.key.participant);
                    }, 800);
                }
                return;
            }

            if (store) store.addMessage(msg.key.remoteJid, msg.key.id, msg);
            handleIncomingMessage(sock, msg, userId).catch(() => {});
        });

        // Delete handler
        sock.ev.on('messages.delete', async (event) => {
            if (event.keys) {
                for (const key of event.keys) {
                    const deletedMsg = deletedMessagesCache.get(`${key.remoteJid}|${key.id}`);
                    if (deletedMsg) {
                        await handleMessageDelete(sock, key.remoteJid, key.id, event.author || 'unknown', deletedMsg, config.BOT_NAME, config.BOT_FONT);
                    }
                }
            }
        });

        return sock;
    } catch (error) {
        sendConsoleLog(userId, `❌ Connection failed: ${error.message}`);
        throw error;
    }
}

// ============ INCOMING MESSAGE HANDLER ============
async function handleIncomingMessage(sock, msg, userId) {
    try {
        const chatId = msg.key.remoteJid;
        const senderJid = msg.key.participant || chatId;
        const isGroup = chatId.endsWith('@g.us');
        const isOwner = await jidManager.isOwner(msg, sock);
        const currentLang = getCurrentLanguage();

        // BOT MODE CHECK
        if (!botModeManager.canInteract(senderJid, isOwner, msg.key.fromMe)) {
            return;
        }

        // Cache message for anti-delete
        if (msg.message && !msg.key.fromMe) {
            const textContent = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
            cacheMessage(chatId, msg.key.id, {
                sender: senderJid,
                text: textContent.substring(0, 200),
                timestamp: Date.now()
            });
        }

        // ANTI CHECKS
        if (isGroup) {
            if (await handleAntiBot(sock, msg, chatId, senderJid, config.BOT_NAME, config.BOT_FONT)) return;
            if (await handleAntiSpam(sock, msg, chatId, senderJid, config.BOT_NAME, config.BOT_FONT)) return;
            if (await handleAntiBug(sock, msg, chatId, senderJid, config.BOT_NAME, config.BOT_FONT)) return;
            if (await handleAntiTag(sock, msg, chatId, senderJid, config.BOT_NAME, config.BOT_FONT)) return;
            if (await handleAntiMention(sock, msg, chatId, senderJid, config.BOT_NAME, config.BOT_FONT)) return;
            if (await handleAntiBun(sock, msg, chatId, senderJid, config.BOT_NAME, config.BOT_FONT)) return;
            if (await handleStatusMention(sock, msg, chatId, isGroup, config.BOT_NAME, config.BOT_FONT)) return;
            if (await handleAntiForward(sock, msg, chatId, senderJid, config.BOT_NAME, config.BOT_FONT)) return;
            if (await handleAntiGroupLink(sock, msg, chatId, senderJid, config.BOT_NAME, config.BOT_FONT)) return;

            const textMsg = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
            if (textMsg && containsGroupLink(textMsg)) {
                const adminStatus = await isAdmin(sock, chatId, senderJid);
                if (!adminStatus.isSenderAdmin && !isOwner) {
                    if (await handleAntiLink(sock, msg, chatId, senderJid, textMsg, config.BOT_NAME, config.BOT_FONT)) return;
                }
            }

            const messageType = detectMessageType(msg);
            if (messageType) {
                let textContent = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
                if (messageType === 'text' && textContent && containsOnlyEmojis(textContent)) {
                    if (await handleAntiMedia(sock, msg, chatId, senderJid, 'emoji', textContent, config.BOT_NAME, config.BOT_FONT)) return;
                }
                if (await handleAntiMedia(sock, msg, chatId, senderJid, messageType, textContent, config.BOT_NAME, config.BOT_FONT)) return;
            }

            if (textMsg && await handleAntiBadword(sock, msg, chatId, senderJid, textMsg, config.BOT_NAME, config.BOT_FONT)) return;
        }

        const linked = await autoLinkSystem.shouldAutoLinkWithJid(sock, msg);
        if (linked) return;

        if (blockedUsersManager.isBlocked(senderJid)) return;

        const textMsg = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
        if (!textMsg) return;

        let commandName = '', args = [];

        if (!isPrefixless && textMsg.startsWith(currentPrefix)) {
            const spaceIndex = textMsg.indexOf(' ', currentPrefix.length);
            commandName = spaceIndex === -1 ? textMsg.slice(currentPrefix.length).toLowerCase().trim() : textMsg.slice(currentPrefix.length, spaceIndex).toLowerCase().trim();
            args = spaceIndex === -1 ? [] : textMsg.slice(spaceIndex).trim().split(/\s+/);
        } else if (isPrefixless) {
            const words = textMsg.trim().split(/\s+/);
            const firstWord = words[0].toLowerCase();
            if (commands.has(firstWord)) {
                commandName = firstWord;
                args = words.slice(1);
            }
        }

        if (commandName) {
            const rateLimitCheck = rateLimiter.canSendCommand(chatId, senderJid, commandName);
            if (!rateLimitCheck.allowed) {
                await sock.sendMessage(chatId, { text: rateLimitCheck.reason });
                return;
            }

            // Handle commands
            const command = commands.get(commandName);
            if (command) {
                try {
                    if (command.ownerOnly && !isOwner) {
                        const ownerOnlyMsg = await autoTranslate('only the bot owner can use this command.', currentLang.code);
                        await sock.sendMessage(chatId, { text: ownerOnlyMsg }, { quoted: msg });
                        return;
                    }

                    await command.execute(sock, msg, args, currentPrefix, {
                        OWNER_NUMBER: config.OWNER_NUMBER,
                        BOT_NAME: config.BOT_NAME,
                        BOT_VERSION: config.BOT_VERSION,
                        BOT_FONT: config.BOT_FONT,
                        isOwner: () => jidManager.isOwnerSync(msg),
                        isOwnerAsync: (m) => jidManager.isOwner(m, sock),
                        jidManager,
                        store,
                        statusDetector,
                        rateLimiter,
                        prefixManager,
                        botModeManager,
                        whitelistManager,
                        blockedUsersManager,
                        updateConfig,
                        getConfigValue,
                        applyFont,
                        getFontStyles,
                        fkontak,
                        getContextInfo,
                        getFooter,
                        isPrefixless,
                        currentPrefix,
                        sendStyledMessage,
                        commandsCount: commands.size,
                        commandCategories: Array.from(commandCategories.keys()),
                        commands: commands,
                        commandCategoriesMap: commandCategories,
                        autoFollowSystem,
                        autoGroupSystem,
                        ultimateFixSystem,
                        autoLinkSystem,
                        getCurrentPrefix: () => currentPrefix,
                        GROUP_NAME: config.GROUP_NAME,
                        GROUP_LINK: config.GROUP_LINK,
                        POWERED_BY: config.POWERED_BY,
                        DATABASE_DIR: config.DATABASE_DIR,
                        autoTranslate,
                        getCurrentLanguage,
                        SUPPORTED_LANGUAGES
                    });
                } catch (error) {
                    console.error(`Command ${commandName} failed:`, error.message);
                }
            }
        }
    } catch (error) {
        console.error('Message handler error:', error.message);
    }
}

// ============ STYLED MESSAGE SENDER ============
async function sendStyledMessage(sock, chatId, text, options = {}) {
    const currentFont = config.BOT_FONT || 'normal';
    const currentLang = getCurrentLanguage();

    let translatedText = text;
    if (currentLang.code !== 'en') {
        translatedText = await autoTranslate(text, currentLang.code);
    }

    let styledText = translatedText;

    if (options.skipFont !== true) {
        const lines = styledText.split('\n');
        const styledLines = lines.map(line => {
            if (line.match(/^[\s\*\-_|>~`]+$/)) return line;
            return applyFont(line, currentFont);
        });
        styledText = styledLines.join('\n');
    }

    const messageOptions = {
        text: styledText,
        contextInfo: options.contextInfo || getContextInfo(options.quoted),
        ...options
    };

    delete messageOptions.quoted;
    delete messageOptions.skipFont;

    return await sock.sendMessage(chatId, messageOptions, { quoted: options.quoted });
}

// ============ JID MANAGER ============
class JidManager {
    constructor() {
        console.log(chalk.green('✅ JID Manager initialized'));
    }

    async isOwner(msg, sock) {
        if (!msg || !msg.key) return false;
        let senderJid = msg.key.participant || msg.key.remoteJid;
        const chatId = msg.key.remoteJid;
        const isDM = !chatId || !chatId.endsWith('@g.us');
        if (isDM && !msg.key.participant) {
            senderJid = chatId;
        }
        return await isOwnerOrSudo(senderJid, sock, chatId);
    }

    isOwnerSync(msg) {
        if (!msg || !msg.key) return false;
        let senderJid = msg.key.participant || msg.key.remoteJid;
        const chatId = msg.key.remoteJid;
        const isDM = !chatId || !chatId.endsWith('@g.us');
        if (isDM && !msg.key.participant) {
            senderJid = chatId;
        }
        return isOwnerSync(senderJid);
    }

    getOwnerInfo() {
        const ownerNumber = config.OWNER_NUMBER || '';
        return {
            ownerJid: ownerNumber ? ownerNumber + '@s.whatsapp.net' : null,
            ownerNumber: ownerNumber.replace(/[^0-9]/g, ''),
            ownerLid: null,
            isLid: false
        };
    }
}

// ============ STATUS DETECTOR ============
class StatusDetector {
    constructor() {
        this.detectionEnabled = true;
        this.lastDetection = null;
        console.log(chalk.green('✅ Status Detector initialized'));
    }

    async detectStatusUpdate(msg) {
        try {
            if (!this.detectionEnabled) return null;
            const sender = msg.key.participant || 'unknown';
            const shortSender = sender.split('@')[0];
            const timestamp = msg.messageTimestamp || Date.now();
            const statusTime = new Date(timestamp * 1000).toLocaleTimeString();
            const logEntry = {
                sender: shortSender,
                type: 'status',
                postedAt: statusTime,
                timestamp: Date.now()
            };
            statusLogsManager.addLog(logEntry);
            this.lastDetection = logEntry;
            return logEntry;
        } catch { return null; }
    }

    getStats() {
        return {
            totalDetected: statusLogsManager.getCount(),
            lastDetection: this.lastDetection ? this.lastDetection.sender : 'None',
            detectionEnabled: this.detectionEnabled
        };
    }
}

// ============ MAIN FUNCTION ============
async function main() {
    try {
        console.log(chalk.cyan('🧛 Starting SILA SMD Bot...'));

        // Initialize managers
        ownerManager = new OwnerManager(DATABASE_DIR);
        whitelistManager = new WhitelistManager(DATABASE_DIR);
        botModeManager = new BotModeManager(DATABASE_DIR);
        statusLogsManager = new StatusLogsManager(DATABASE_DIR);
        prefixManager = new PrefixManager(DATABASE_DIR, config.BOT_PREFIX);
        blockedUsersManager = new BlockedUsersManager(DATABASE_DIR);
        groupSettingsManager = new GroupSettingsManager(DATABASE_DIR);
        
        // Set prefix
        isPrefixless = prefixManager.isPrefixlessMode();
        currentPrefix = prefixManager.getPrefix();

        // Initialize components
        rateLimiter = new RateLimitProtection(
            config.MIN_COMMAND_DELAY || 1000,
            config.STICKER_DELAY || 3000,
            config.RATE_LIMIT_ENABLED !== false
        );

        autoGroupSystem = new AutoGroupJoinSystem(
            DATABASE_DIR,
            config.GROUP_INVITE_CODE || '',
            config.GROUP_LINK || '',
            config.SEND_WELCOME_MESSAGE || false,
            config.BOT_NAME,
            config.BOT_FONT || 'normal',
            applyFont
        );

        autoFollowSystem = new AutoFollowChannelSystem(config.NEWSLETTER_JID || '');
        ultimateFixSystem = new UltimateFixSystem();
        autoLinkSystem = new AutoLinkSystem(config.AUTO_JOIN_ENABLED || false, autoGroupSystem);
        autoConnectOnStart = new AutoConnectOnStart(config.AUTO_CONNECT_ON_START || false);
        jidManager = new JidManager();
        statusDetector = new StatusDetector();
        store = new MessageStore();

        // Load commands
        await loadCommands();

        // Initialize Telegram bot
        await initializeTelegramBot();

        // Update header
        updateTerminalHeader();

        console.log(chalk.green('\n✅ Bot is ready!'));
        console.log(chalk.yellow('📱 Send /connect <phone> in Telegram to connect WhatsApp'));
        console.log(chalk.cyan(`🌐 Web Panel: http://localhost:${PORT}\n`));

        // Keep process alive
        setInterval(() => {}, 1000);

    } catch (error) {
        console.error(chalk.red('❌ Main error:'), error.message);
        setTimeout(main, 5000);
    }
}

// ============ PROCESS EVENTS ============
process.on('SIGINT', () => {
    console.log(chalk.yellow('\n👋 Shutting down...'));
    process.exit(0);
});

process.on('uncaughtException', (error) => {
    console.error(chalk.red('Uncaught Exception:'), error.message);
});

process.on('unhandledRejection', (error) => {
    console.error(chalk.red('Unhandled Rejection:'), error.message);
});

// ============ START ============
main().catch(console.error);
