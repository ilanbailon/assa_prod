const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const filesDir = path.join(__dirname, 'req_materiales');
const files = fs.readdirSync(filesDir).filter(f => f.toUpperCase().endsWith('.XLSX'));

if (files.length === 0) {
  console.log("No XLSX files found.");
  process.exit(1);
}

const testFile = path.join(filesDir, files[0]);
console.log("Inspecting file:", testFile);

const workbook = XLSX.readFile(testFile);
console.log("Sheets in workbook:", workbook.SheetNames);

const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];

// Convert to raw JSON rows including empty cells if any
const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
console.log("\nRaw rows count:", rawData.length);
console.log("\nFirst 15 raw rows:");
rawData.slice(0, 15).forEach((row, i) => {
  console.log(`Row ${i + 1}:`, row);
});
