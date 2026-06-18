const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

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

// Read Excel Files from req_materiales
const filesDir = path.join(__dirname, 'req_materiales');
if (!fs.existsSync(filesDir)) {
  console.error("Error: req_materiales directory not found at", filesDir);
  process.exit(1);
}

const files = fs.readdirSync(filesDir).filter(f => f.toUpperCase().endsWith('.XLSX'));
console.log(`Found ${files.length} XLSX files. Starting import...`);

const cleanVal = (val) => {
  if (val === undefined || val === null) return null;
  if (typeof val === 'string') {
    const trimmed = val.trim();
    return trimmed === '' ? null : trimmed;
  }
  return val;
};

const records = [];

files.forEach(file => {
  const filePath = path.join(filesDir, file);
  const reqCode = path.parse(file).name; // e.g. "103"
  
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  // Index 0 is header. Start from index 1.
  for (let i = 1; i < rawData.length; i++) {
    const row = rawData[i];
    if (!row || row.length === 0) continue;

    // Check if Código or Recurso are populated
    const codigo_recurso = cleanVal(row[2]);
    const recurso = cleanVal(row[3]);
    const unidad = cleanVal(row[4]);
    const cantidad = cleanVal(row[5]);

    // Skip rows that don't represent actual items
    if (!recurso && !codigo_recurso) continue;

    records.push({
      codigo_requerimiento: reqCode,
      codigo_recurso,
      recurso,
      unidad,
      cantidad: typeof cantidad === 'number' ? cantidad : parseFloat(cantidad) || 0,
      partida_control_code: cleanVal(row[6]),
      partida_control: cleanVal(row[7]),
      estado: cleanVal(row[13]),
      cantidad_original: typeof row[14] === 'number' ? row[14] : parseFloat(row[14]) || null,
      cantidad_cotizacion: cleanVal(row[19]),
      cantidad_orden_compra: cleanVal(row[20]),
      cantidad_almacen: cleanVal(row[21]),
      cantidad_recibir: cleanVal(row[22]),
      cronograma_entrega: cleanVal(row[23]),
      codigo_alterno_pc: cleanVal(row[28])
    });
  }
});

console.log(`Parsed ${records.length} material requirements in total. Uploading to Supabase...`);

// Upload in batches of 50
const batchSize = 50;

async function uploadBatch(batch, index) {
  const url = `${supabaseUrl}/rest/v1/material_requirements`;
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
  console.log("Materials import completed successfully!");
}

run();
