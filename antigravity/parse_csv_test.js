const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, 'personal_assa.csv');
const content = fs.readFileSync(csvPath, 'utf-8');
const lines = content.split('\n');

console.log("Total lines in CSV:", lines.length);
console.log("Header:", lines[0]);

const parseDate = (str) => {
  if (!str || !str.trim()) return null;
  // Format is DD/MM/YYYY or D/MM/YYYY
  const parts = str.trim().split('/');
  if (parts.length === 3) {
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const year = parts[2];
    return `${year}-${month}-${day}`;
  }
  return null;
};

// Inspect a few active staff lines
console.log("\nSample Active Staff:");
for (let i = 1; i < 10; i++) {
  if (lines[i]) console.log(lines[i].split(';'));
}

// Inspect a few requirement lines
console.log("\nSample Requirements:");
for (let i = 308; i < 315; i++) {
  if (lines[i]) console.log(lines[i].split(';'));
}
