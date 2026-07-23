const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir(path.join(__dirname, 'frontend/src'), function(filePath) {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Backgrounds & Borders
    content = content.replace(/bg-slate-900/g, 'bg-white');
    content = content.replace(/bg-slate-800/g, 'bg-slate-50');
    content = content.replace(/bg-slate-700/g, 'bg-slate-100');
    content = content.replace(/border-slate-800/g, 'border-slate-200');
    content = content.replace(/border-slate-700/g, 'border-slate-300');
    content = content.replace(/border-slate-600/g, 'border-slate-300');
    
    // Transparent dark backgrounds (e.g., bg-emerald-950/40 -> bg-emerald-50)
    content = content.replace(/bg-([a-z]+)-950(\/\d+)?/g, 'bg-$1-50');
    content = content.replace(/border-([a-z]+)-500(\/\d+)?/g, 'border-$1-200'); // lighter borders for colored alerts
    
    // Text colors
    content = content.replace(/text-slate-400/g, 'text-slate-500');
    content = content.replace(/text-slate-300/g, 'text-slate-600');
    content = content.replace(/text-slate-200/g, 'text-slate-700');
    content = content.replace(/text-slate-100/g, 'text-slate-800');
    
    // Carefully replace text-white with text-slate-900
    // But we need to keep text-white for primary buttons/badges (which usually have a solid colored bg or gradient)
    content = content.replace(/text-white/g, 'text-slate-900');
    
    // Restore text-white for elements with strong background colors
    // match bg-[color]-500/600 or from-[color]-500/600
    content = content.replace(/(bg-[a-z]+-[567]00[^"']*)text-slate-900/g, '$1text-white');
    content = content.replace(/(from-[a-z]+-[567]00[^"']*)text-slate-900/g, '$1text-white');
    
    // Specific fixes
    content = content.replace(/shadow-emerald-900\/40/g, 'shadow-emerald-200');
    content = content.replace(/shadow-indigo-900\/40/g, 'shadow-emerald-200'); // just in case
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
});
