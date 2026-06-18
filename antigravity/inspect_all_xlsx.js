const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const filesDir = path.join(__dirname, 'req_materiales');
const files = fs.readdirSync(filesDir).filter(f => f.toUpperCase().endsWith('.XLSX'));

console.log(`Checking ${files.length} XLSX files...`);

files.forEach(file => {
  const filePath = path.join(filesDir, file);
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  
  console.log(`File: ${file} | Sheet: ${sheetName} | Rows: ${rawData.length} | Header length: ${rawData[0] ? rawData[0].length : 0}`);
});
