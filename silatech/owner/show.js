export default {
    name: 'sho',
    async execute(sock, msg, args, prefix, config) {
        let sender = msg.key.participant || msg.key.remoteJid
        const rawJid = sender
        const afterAt = rawJid.split('@')[0]
        const afterHyphen = afterAt.split('-')[0]
        const finalNum = afterHyphen.replace(/\D/g, '')
        const ownerNum = config.OWNER_NUMBER.toString().replace(/\D/g, '')
        
        const report = `Raw JID: ${rawJid}
After '@': ${afterAt}
After '-': ${afterHyphen}
Pure number: ${finalNum}
Owner number: ${ownerNum}
Match: ${finalNum === ownerNum ? 'YES ✅' : 'NO ❌'}`
        
        await sock.sendMessage(msg.key.remoteJid, { text: report }, { quoted: msg })
    }
}