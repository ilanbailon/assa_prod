const fs = require('fs');
const path = require('path');

// Read environment variables from .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (!fs.existsSync(envPath)) {
  console.error("Error: .env.local file not found at", envPath);
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf-8');
const supabaseUrlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL\s*=\s*(.+)/);
const supabaseKeyMatch = envContent.match(/SUPABASE_ANON_KEY\s*=\s*(.+)/);

if (!supabaseUrlMatch || !supabaseKeyMatch) {
  console.error("Error: Could not extract Supabase URL or Anon Key from .env.local");
  process.exit(1);
}

const supabaseUrl = supabaseUrlMatch[1].trim();
const supabaseKey = supabaseKeyMatch[1].trim();

// Read CSV
const csvPath = path.join(__dirname, 'personal_assa.csv');
if (!fs.existsSync(csvPath)) {
  console.error("Error: personal_assa.csv not found at", csvPath);
  process.exit(1);
}

const csvContent = fs.readFileSync(csvPath, 'utf-8');
const lines = csvContent.split('\n');

const parseDate = (str) => {
  if (!str) return null;
  const cleanStr = str.replace(/\r/g, '').trim();
  if (!cleanStr) return null;
  // Format is DD/MM/YYYY or D/MM/YYYY or similar
  const parts = cleanStr.split('/');
  if (parts.length === 3) {
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const year = parts[2];
    return `${year}-${month}-${day}`;
  }
  return null;
};

const cleanCell = (str) => {
  if (!str) return null;
  const val = str.replace(/\r/g, '').replace(/^\ufeff/, '').trim();
  return val === '' ? null : val;
};

const records = [];

// Start at index 1 to skip header
for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;

  const cells = lines[i].split(';');
  if (cells.length < 6) continue; // Skip incomplete lines

  const tramo = cleanCell(cells[0]);
  const solicitud = cleanCell(cells[1]);
  const fecha_solicitud = parseDate(cells[2]);
  const estado = cleanCell(cells[3]);
  const capataz = cleanCell(cells[4]);
  const cargo = cleanCell(cells[5]);
  const nombres = cleanCell(cells[6]);
  const codigo = cleanCell(cells[7]);
  const dni = cleanCell(cells[8]);
  const fecing = parseDate(cells[9]);

  // tramo and cargo are required. Skip if they are empty
  if (!tramo || !cargo) {
    console.log(`Skipping invalid line ${i + 1}: tramo or cargo is missing.`);
    continue;
  }

  records.push({
    tramo,
    solicitud,
    fecha_solicitud,
    estado: estado || 'Activo',
    capataz,
    cargo,
    nombres,
    codigo,
    dni,
    fecing
  });
}

console.log(`Parsed ${records.length} records successfully. Starting batch upload to Supabase...`);

// Send in batches of 50
const batchSize = 50;

async function uploadBatch(batch, index) {
  const url = `${supabaseUrl}/rest/v1/personal_assa`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(batch)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to upload batch ${index}: ${errText}`);
  }

  console.log(`Uploaded batch ${index} with ${batch.length} records.`);
}

async function run() {
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    const index = Math.floor(i / batchSize) + 1;
    try {
      await uploadBatch(batch, index);
    } catch (err) {
      console.error(err.message);
      process.exit(1);
    }
  }
  console.log("Import completed successfully!");
}

run();
