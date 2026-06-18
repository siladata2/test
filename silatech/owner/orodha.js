import { generateTableImage } from '../utils/tableImage.js';

export default {
  name: 'orodha',
  category: 'owner',
  async execute(sock, msg) {
    const bidhaa = [
      { jina: 'Mchele', kiasi: 25, kitengo: 'Kg' },
      { jina: 'Sukari', kiasi: 10, kitengo: 'Kg' },
      { jina: 'Mafuta ya Kupikia', kiasi: 5, kitengo: 'Lita' },
      { jina: 'Sabuni', kiasi: 12, kitengo: 'Vipande' },
      { jina: 'Dawa ya Meno', kiasi: 8, kitengo: 'Tube' }
    ];
    
    const imageBuffer = await generateTableImage(bidhaa);
    
    await sock.sendMessage(msg.key.remoteJid, {
      image: imageBuffer,
      caption: '*📋 Orodha ya Bidhaa*\n\n> Powered by Sila Tech'
    }, { quoted: msg });
  }
};
