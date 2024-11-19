const fs = require('fs');
const path = require('path');

const distDir = path.resolve(__dirname, 'dist');
const indexPath = path.join(distDir, 'index.html');
const fallbackPath = path.join(distDir, '404.html');

fs.copyFile(indexPath, fallbackPath, (err) => {
  if (err) {
    console.error('❌ Failed to copy index.html to 404.html:', err);
  } else {
    console.log('✅ Copied index.html to 404.html for GitHub Pages fallback.');
  }
});