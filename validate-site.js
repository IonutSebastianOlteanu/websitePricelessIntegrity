const fs = require('fs');
const path = require('path');

const root = __dirname;
const filesToCheck = ['services.json', 'team.json'];

function fail(message) {
  console.error(`❌ ${message}`);
  process.exit(1);
}

for (const fileName of filesToCheck) {
  const filePath = path.join(root, fileName);

  if (!fs.existsSync(filePath)) {
    fail(`${fileName} is missing.`);
    continue;
  }

  const raw = fs.readFileSync(filePath, 'utf8');

  try {
    JSON.parse(raw);
    console.log(`✅ ${fileName} is valid JSON`);
  } catch (error) {
    fail(`${fileName} contains invalid JSON: ${error.message}`);
  }
}

const requiredFiles = ['index.html', 'services.js', 'team.js', 'admin.js', 'contact.js'];
for (const fileName of requiredFiles) {
  if (!fs.existsSync(path.join(root, fileName))) {
    fail(`${fileName} is missing.`);
  }
}

console.log('✅ Site structure looks valid');
