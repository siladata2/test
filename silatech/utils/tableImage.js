import sharp from 'sharp';

export async function generateTableImage(bidhaa) {
  const width = 500;
  const rowHeight = 45;
  const headerHeight = 60;
  const height = headerHeight + (bidhaa.length * rowHeight) + 40;
  
  // Tengeneza SVG table
  let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="white"/>
    
    <rect x="20" y="20" width="${width-40}" height="${height-40}" fill="none" stroke="black" stroke-width="1.5"/>
    
    <rect x="20" y="20" width="${width-40}" height="${headerHeight}" fill="#f0f0f0"/>
    
    <text x="40" y="55" font-size="18" font-weight="bold" fill="black">Jina la Bidhaa</text>
    <text x="280" y="55" font-size="18" font-weight="bold" fill="black">Kiasi</text>
    <text x="400" y="55" font-size="18" font-weight="bold" fill="black">Kitengo</text>
    
    <line x1="260" y1="20" x2="260" y2="${height-20}" stroke="black" stroke-width="1.5"/>
    <line x1="370" y1="20" x2="370" y2="${height-20}" stroke="black" stroke-width="1.5"/>
    <line x1="20" y1="80" x2="${width-20}" y2="80" stroke="black" stroke-width="1.5"/>`;
  
  bidhaa.forEach((item, index) => {
    const y = 80 + (index + 1) * rowHeight;
    svg += `
      <text x="40" y="${y}" font-size="16" fill="#333333">${escapeXml(item.jina)}</text>
      <text x="280" y="${y}" font-size="16" fill="#333333">${item.kiasi}</text>
      <text x="400" y="${y}" font-size="16" fill="#333333">${escapeXml(item.kitengo)}</text>`;
    
    if (index < bidhaa.length - 1) {
      svg += `<line x1="20" y1="${y+15}" x2="${width-20}" y2="${y+15}" stroke="#eeeeee" stroke-width="1"/>`;
    }
  });
  
  svg += `</svg>`;
  
  return await sharp(Buffer.from(svg)).png().toBuffer();
}

function escapeXml(str) {
  return str.replace(/[<>&]/g, function(m) {
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    if (m === '&') return '&amp;';
    return m;
  });
}
