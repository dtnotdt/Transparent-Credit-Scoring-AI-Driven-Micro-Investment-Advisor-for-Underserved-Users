const fs = require('fs');
const path = require('path');

const files = [
  'frontend/src/pages/FinancialTwinPage.tsx',
  'frontend/src/pages/ReportHistoryPage.tsx',
  'frontend/src/pages/SampleUsersPage.tsx',
  'frontend/src/pages/LoginPage.tsx',
  'frontend/src/pages/RegisterPage.tsx'
];

files.forEach(file => {
  const filepath = path.join(__dirname, file);
  if (fs.existsSync(filepath)) {
    let content = fs.readFileSync(filepath, 'utf8');
    
    // Replace indigo -> emerald
    content = content.replace(/indigo/g, 'emerald');
    // Replace purple -> teal
    content = content.replace(/purple/g, 'teal');
    // Replace violet -> teal
    content = content.replace(/violet/g, 'teal');
    
    // Replace specific hex codes
    content = content.replace(/#6366f1/ig, '#10b981'); // indigo-500 -> emerald-500
    content = content.replace(/#8b5cf6/ig, '#0891b2'); // purple-500 -> teal-500
    content = content.replace(/#6D5EF8/ig, '#10b981'); 
    content = content.replace(/#3B2ECC/ig, '#0891b2'); 
    content = content.replace(/#5B8CFF/ig, '#0891b2'); 

    fs.writeFileSync(filepath, content, 'utf8');
    console.log(`Updated ${file}`);
  } else {
    console.log(`File not found: ${file}`);
  }
});
