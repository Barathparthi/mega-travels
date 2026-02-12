// Simple PWA Icon Generator using Canvas
// This creates placeholder icons for the PWA

const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, '../public/icons');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Create a simple SVG icon that can be used
const createSVGIcon = (size) => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#2563eb;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background with rounded corners -->
  <rect width="${size}" height="${size}" rx="${size * 0.15}" fill="url(#grad)"/>
  
  <!-- Car icon -->
  <g transform="scale(${size / 512})">
    <!-- Car body -->
    <path d="M 100 300 L 150 200 L 350 200 L 400 300 Z" fill="white"/>
    <!-- Car base -->
    <rect x="80" y="300" width="340" height="80" fill="white"/>
    <!-- Wheels -->
    <circle cx="160" cy="380" r="40" fill="#1e293b"/>
    <circle cx="340" cy="380" r="40" fill="#1e293b"/>
    <!-- Wheel centers -->
    <circle cx="160" cy="380" r="20" fill="#64748b"/>
    <circle cx="340" cy="380" r="20" fill="#64748b"/>
    <!-- Windows -->
    <rect x="170" y="220" width="70" height="60" fill="#93c5fd"/>
    <rect x="260" y="220" width="70" height="60" fill="#93c5fd"/>
  </g>
  
  <!-- M letter -->
  <text x="50%" y="65%" font-family="Arial, sans-serif" font-size="${size * 0.3}" 
        font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">M</text>
</svg>`;
};

// Generate all icons
console.log('🚀 Generating PWA icons...\n');

sizes.forEach(size => {
  const svg = createSVGIcon(size);
  const filename = `icon-${size}x${size}.png`;
  const svgFilename = `icon-${size}x${size}.svg`;
  const filepath = path.join(iconsDir, svgFilename);
  
  fs.writeFileSync(filepath, svg);
  console.log(`✓ Generated ${svgFilename}`);
});

console.log('\n✅ All icons generated successfully!');
console.log('\n📝 Note: SVG icons created. For production, convert to PNG using:');
console.log('   - Online tool: https://cloudconvert.com/svg-to-png');
console.log('   - Or install sharp: npm install sharp');
console.log('\n🌐 For now, you can also open public/icons/generate-icons.html in browser');
console.log('   to generate and download PNG icons manually.\n');

