// ============================================
// SILA IS OWNER - ES Module version
// Uses config.OWNER_NUMBER directly
// ============================================

import config from '../silaconfig.js';

export async function isOwnerOrSudo(senderId, sock = null, chatId = null) {
    if (!senderId) return false;

    const ownerNumberRaw = config.OWNER_NUMBER || '';
    const ownerNumberClean = ownerNumberRaw.toString().replace(/[^0-9]/g, '');
    const ownerJid = ownerNumberClean + '@s.whatsapp.net';

    const senderIdClean = senderId.split(':')[0].split('@')[0];
    const senderLidNumeric = senderId.includes('@lid') ? senderId.split('@')[0].split(':')[0] : '';

    // 1. Direct JID match
    if (senderId === ownerJid) return true;

    // 2. Phone number match
    if (senderIdClean === ownerNumberClean) return true;

    // 3. Group LID match (owner uses same account as bot)
    if (sock && chatId && chatId.endsWith('@g.us') && senderId.includes('@lid')) {
        try {
            const botLid = sock.user?.lid || '';
            const botLidNumeric = botLid.includes(':') ? botLid.split(':')[0] : (botLid.includes('@') ? botLid.split('@')[0] : botLid);
            if (senderLidNumeric && botLidNumeric && senderLidNumeric === botLidNumeric) return true;

            const metadata = await sock.groupMetadata(chatId);
            const participants = metadata.participants || [];
            const participant = participants.find(p => {
                const pLid = p.lid || '';
                const pLidNumeric = pLid.includes(':') ? pLid.split(':')[0] : (pLid.includes('@') ? pLid.split('@')[0] : pLid);
                const pId = p.id || '';
                const pIdClean = pId.split(':')[0].split('@')[0];
                return (p.lid === senderId || p.id === senderId ||
                        pLidNumeric === senderLidNumeric ||
                        pIdClean === senderIdClean ||
                        pIdClean === ownerNumberClean);
            });
            if (participant) {
                const participantId = participant.id || '';
                const participantLid = participant.lid || '';
                const participantIdClean = participantId.split(':')[0].split('@')[0];
                const participantLidNumeric = participantLid.includes(':') ? participantLid.split(':')[0] : (participantLid.includes('@') ? participantLid.split('@')[0] : participantLid);
                if (participantId === ownerJid ||
                    participantIdClean === ownerNumberClean ||
                    participantLidNumeric === botLidNumeric) return true;
            }
        } catch (e) {}
    }

    // 4. Fallback: sender ID contains owner number
    if (senderId.includes(ownerNumberClean)) return true;

    return false;
}

// Sync version for quick checks
export function isOwnerSync(senderId) {
    if (!senderId) return false;
    const ownerNumberRaw = config.OWNER_NUMBER || '';
    const ownerNumberClean = ownerNumberRaw.toString().replace(/[^0-9]/g, '');
    const ownerJid = ownerNumberClean + '@s.whatsapp.net';
    const senderIdClean = senderId.split(':')[0].split('@')[0];
    return (senderId === ownerJid) || (senderIdClean === ownerNumberClean) || senderId.includes(ownerNumberClean);
}

export default isOwnerOrSudo;
