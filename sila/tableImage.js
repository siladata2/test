import sharp from 'sharp';

/**
 * Generate table image with dark or light theme
 * @param {Array} bidhaa - Array of products {jina, kiasi, kitengo}
 * @param {Object} options - { theme: 'dark' or 'light', title: 'Title here' }
 */
export async function generateTableImage(bidhaa, options = {}) {
  const theme = options.theme || 'dark';
  const title = options.title || '📋 ORODHA YA BIDHAA';
  const width = 550;
  const rowHeight = 42;
  const headerHeight = 55;
  const padding = 20;
  
  const height = headerHeight + (bidhaa.length * rowHeight) + padding + 30;
  
  // Theme colors
  const colors = getThemeColors(theme);
  
  let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="${colors.bg}"/>
    
    <!-- Outer border -->
    <rect x="15" y="15" width="${width-30}" height="${height-30}" rx="10" fill="none" stroke="${colors.border}" stroke-width="1.5"/>
    
    <!-- Header background -->
    <rect x="15" y="15" width="${width-30}" height="${headerHeight}" rx="10" fill="${colors.headerBg}"/>
    <rect x="15" y="${15+headerHeight-5}" width="${width-30}" height="5" fill="${colors.headerBg}"/>
    
    <!-- Header text -->
    <text x="${width/2}" y="52" text-anchor="middle" font-size="17" font-weight="bold" fill="${colors.headerText}">${title}</text>
    
    <!-- Column headers background -->
    <rect x="15" y="${15+headerHeight}" width="${width-30}" height="32" fill="${colors.colHeaderBg}"/>
    
    <!-- Column headers -->
    <text x="35" y="${15+headerHeight+22}" font-size="13" font-weight="bold" fill="${colors.colHeaderText}">JINA LA BIDHAA</text>
    <text x="350" y="${15+headerHeight+22}" font-size="13" font-weight="bold" fill="${colors.colHeaderText}">KIASI</text>
    <text x="440" y="${15+headerHeight+22}" font-size="13" font-weight="bold" fill="${colors.colHeaderText}">KITENGO</text>
    
    <!-- Line under headers -->
    <line x1="15" y1="${15+headerHeight+32}" x2="${width-15}" y2="${15+headerHeight+32}" stroke="${colors.border}" stroke-width="1"/>`;
  
  // Data rows
  let yPos = 15 + headerHeight + 45;
  
  for (let i = 0; i < bidhaa.length; i++) {
    const item = bidhaa[i];
    const rowColor = (i % 2 === 0) ? colors.rowEven : colors.rowOdd;
    
    // Row background
    svg += `<rect x="16" y="${yPos-20}" width="${width-32}" height="${rowHeight-5}" rx="3" fill="${rowColor}"/>`;
    
    // Data text
    svg += `
    <text x="35" y="${yPos}" font-size="13" fill="${colors.text}">${escapeXml(item.jina)}</text>
    <text x="355" y="${yPos}" font-size="13" fill="${colors.text}">${item.kiasi}</text>
    <text x="445" y="${yPos}" font-size="13" fill="${colors.text}">${escapeXml(item.kitengo)}</text>`;
    
    yPos += rowHeight;
  }
  
  // Footer
  svg += `
    <line x1="20" y1="${height-35}" x2="${width-20}" y2="${height-35}" stroke="${colors.border}" stroke-width="0.5" stroke-dasharray="4,4"/>
    <text x="${width/2}" y="${height-15}" text-anchor="middle" font-size="9" fill="${colors.footer}">Powered by SILA TECH</text>`;
  
  svg += `\n</svg>`;
  
  return await sharp(Buffer.from(svg)).png().toBuffer();
}

/**
 * Generate a category menu table (for commands list)
 */
export async function generateMenuTable(commands, categoryName, prefix, options = {}) {
  const theme = options.theme || 'dark';
  const width = 600;
  const rowHeight = 32;
  const headerHeight = 70;
  
  const height = headerHeight + (commands.length * rowHeight) + 50;
  
  const colors = getThemeColors(theme);
  
  let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="${colors.bg}"/>
    
    <!-- Header -->
    <rect x="15" y="15" width="${width-30}" height="${headerHeight}" rx="10" fill="${colors.headerBg}"/>
    <text x="${width/2}" y="50" text-anchor="middle" font-size="18" font-weight="bold" fill="${colors.headerText}">📁 ${categoryName} MENU</text>
    <text x="${width/2}" y="72" text-anchor="middle" font-size="12" fill="${colors.footer}">Total: ${commands.length} commands | Prefix: ${prefix}</text>
    
    <!-- Column headers -->
    <rect x="15" y="95" width="${width-30}" height="28" fill="${colors.colHeaderBg}"/>
    <text x="30" y="114" font-size="12" font-weight="bold" fill="${colors.colHeaderText}">COMMAND</text>
    <text x="250" y="114" font-size="12" font-weight="bold" fill="${colors.colHeaderText}">DESCRIPTION</text>
    
    <line x1="15" y1="123" x2="${width-15}" y2="123" stroke="${colors.border}" stroke-width="1"/>`;
  
  let yPos = 138;
  
  for (let i = 0; i < commands.length; i++) {
    const cmd = commands[i];
    const rowColor = (i % 2 === 0) ? colors.rowEven : colors.rowOdd;
    
    svg += `<rect x="16" y="${yPos-22}" width="${width-32}" height="30" rx="3" fill="${rowColor}"/>
    <text x="30" y="${yPos-2}" font-size="12" fill="${colors.text}">${prefix}${cmd.name}</text>
    <text x="250" y="${yPos-2}" font-size="11" fill="${colors.textLight}">${truncateText(escapeXml(cmd.desc || 'No description'), 35)}</text>`;
    
    yPos += rowHeight;
  }
  
  svg += `
    <line x1="20" y1="${height-28}" x2="${width-20}" y2="${height-28}" stroke="${colors.border}" stroke-width="0.5" stroke-dasharray="4,4"/>
    <text x="${width/2}" y="${height-10}" text-anchor="middle" font-size="9" fill="${colors.footer}">Powered by SILA TECH</text>`;
  
  svg += `\n</svg>`;
  
  return await sharp(Buffer.from(svg)).png().toBuffer();
}

/**
 * Generate full menu with all categories
 */
export async function generateFullMenu(menuData, options = {}) {
  const theme = options.theme || 'dark';
  const width = 700;
  let totalHeight = 180;
  
  const colors = getThemeColors(theme);
  
  // Calculate total height
  for (const category of menuData.categories) {
    totalHeight += 45 + (category.commands.length * 32);
  }
  
  let svg = `<svg width="${width}" height="${totalHeight}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="${colors.bg}"/>
    
    <!-- Main Header -->
    <rect x="15" y="15" width="${width-30}" height="130" rx="10" fill="${colors.headerBg}" stroke="${colors.border}" stroke-width="1.5"/>
    <text x="${width/2}" y="55" text-anchor="middle" font-size="22" font-weight="bold" fill="${colors.headerText}">🤖 ${menuData.botName} MENU</text>
    
    <!-- Stats -->
    <rect x="35" y="70" width="150" height="30" rx="5" fill="${colors.colHeaderBg}"/>
    <text x="110" y="90" text-anchor="middle" font-size="12" fill="${colors.colHeaderText}">📊 ${menuData.totalCommands} Commands</text>
    
    <rect x="205" y="70" width="150" height="30" rx="5" fill="${colors.colHeaderBg}"/>
    <text x="280" y="90" text-anchor="middle" font-size="12" fill="${colors.colHeaderText}">🎛️ Mode: ${menuData.mode}</text>
    
    <rect x="375" y="70" width="150" height="30" rx="5" fill="${colors.colHeaderBg}"/>
    <text x="450" y="90" text-anchor="middle" font-size="12" fill="${colors.colHeaderText}">💬 Prefix: ${menuData.prefix}</text>
    
    <rect x="545" y="70" width="130" height="30" rx="5" fill="${colors.colHeaderBg}"/>
    <text x="610" y="90" text-anchor="middle" font-size="12" fill="${colors.colHeaderText}">📅 ${menuData.date}</text>
    
    <text x="${width/2}" y="125" text-anchor="middle" font-size="11" fill="${colors.footer}">Use: ${menuData.prefix}menu &lt;category&gt; for details</text>
    
    <line x1="20" y1="155" x2="${width-20}" y2="155" stroke="${colors.border}" stroke-width="1" stroke-dasharray="5,5"/>`;
  
  let yPos = 175;
  
  for (const category of menuData.categories) {
    if (category.commands.length === 0) continue;
    
    // Category header
    svg += `
    <rect x="20" y="${yPos-5}" width="${width-40}" height="35" rx="5" fill="${colors.categoryBg}"/>
    <text x="30" y="${yPos+20}" font-size="15" font-weight="bold" fill="${colors.categoryText}">${category.icon} ${category.name}</text>
    <text x="${width-100}" y="${yPos+20}" font-size="12" fill="${colors.footer}">${category.commands.length} cmds</text>`;
    
    yPos += 40;
    
    // Commands
    for (let i = 0; i < category.commands.slice(0, 8).length; i++) {
      const cmd = category.commands[i];
      const rowColor = (i % 2 === 0) ? colors.rowEven : colors.rowOdd;
      
      svg += `<rect x="25" y="${yPos-18}" width="${width-50}" height="28" rx="3" fill="${rowColor}"/>
      <text x="35" y="${yPos+2}" font-size="11" fill="${colors.text}">${menuData.prefix}${cmd.name}</text>`;
      
      yPos += 28;
    }
    
    if (category.commands.length > 8) {
      svg += `<text x="${width-80}" y="${yPos-5}" font-size="10" fill="${colors.footer}">+${category.commands.length-8} more...</text>`;
      yPos += 20;
    }
    
    yPos += 15;
  }
  
  svg += `
    <line x1="20" y1="${yPos-5}" x2="${width-20}" y2="${yPos-5}" stroke="${colors.border}" stroke-width="0.5" stroke-dasharray="4,4"/>
    <text x="${width/2}" y="${yPos+15}" text-anchor="middle" font-size="10" fill="${colors.footer}">Powered by SILA TECH | ${menuData.botName}</text>`;
  
  svg += `\n</svg>`;
  
  return await sharp(Buffer.from(svg)).png().toBuffer();
}

// Helper function for theme colors
function getThemeColors(theme) {
  if (theme === 'light') {
    return {
      bg: '#ffffff',
      headerBg: '#f0f4f8',
      headerText: '#1a2a3a',
      colHeaderBg: '#e2e8f0',
      colHeaderText: '#1e293b',
      border: '#cbd5e1',
      text: '#334155',
      textLight: '#64748b',
      rowEven: '#f8fafc',
      rowOdd: '#f1f5f9',
      categoryBg: '#e2e8f0',
      categoryText: '#1e293b',
      footer: '#94a3b8'
    };
  }
  
  // Dark theme (default)
  return {
    bg: '#1a1a2e',
    headerBg: '#16213e',
    headerText: '#e94560',
    colHeaderBg: '#0f3460',
    colHeaderText: '#e94560',
    border: '#0f3460',
    text: '#c4d0e3',
    textLight: '#8899aa',
    rowEven: '#1e2a47',
    rowOdd: '#16213e',
    categoryBg: '#0f3460',
    categoryText: '#e94560',
    footer: '#666'
  };
}

function escapeXml(str) {
  if (!str) return '';
  return String(str).replace(/[<>&]/g, function(m) {
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    if (m === '&') return '&amp;';
    return m;
  });
}

function truncateText(text, maxLength) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

export default {
  generateTableImage,
  generateMenuTable,
  generateFullMenu
};
