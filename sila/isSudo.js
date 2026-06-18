// sila/isSudo.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SUDO_FILE = path.join(__dirname, '../silamd/database/sudo.json');

// Default sudo users
let sudoUsers = new Set();

function loadSudo() {
    try {
        if (fs.existsSync(SUDO_FILE)) {
            const data = JSON.parse(fs.readFileSync(SUDO_FILE, 'utf8'));
            sudoUsers = new Set(data.users || []);
        } else {
            // Add default sudo users including your LIDs
            sudoUsers.add('125903342456863@lid');
            sudoUsers.add('125903342456863');
            sudoUsers.add('97487973015720@lid');
            sudoUsers.add('97487973015720');
            sudoUsers.add('255639201896');
            sudoUsers.add('255639201896@s.whatsapp.net');
            saveSudo();
        }
    } catch (e) {}
}

function saveSudo() {
    try {
        const dir = path.dirname(SUDO_FILE);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(SUDO_FILE, JSON.stringify({ users: Array.from(sudoUsers) }, null, 2));
    } catch (e) {}
}

export async function isSudo(userId, sock = null, chatId = null) {
    if (!userId) return false;
    
    loadSudo();
    
    // Clean the ID
    let cleanId = userId.toString();
    if (cleanId.includes(':')) cleanId = cleanId.split(':')[0];
    if (cleanId.includes('@')) cleanId = cleanId.split('@')[0];
    
    // Check all variations
    const variations = [
        userId,
        cleanId,
        userId + '@s.whatsapp.net',
        userId + '@lid',
        cleanId + '@s.whatsapp.net',
        cleanId + '@lid'
    ];
    
    for (const variant of variations) {
        if (sudoUsers.has(variant)) return true;
    }
    
    return false;
}

export function addSudo(userId) {
    loadSudo();
    sudoUsers.add(userId);
    saveSudo();
    return true;
}

export function removeSudo(userId) {
    loadSudo();
    sudoUsers.delete(userId);
    saveSudo();
    return true;
}

export function getSudoList() {
    loadSudo();
    return Array.from(sudoUsers);
}

loadSudo();
