// export-sheets-data.js
// Export all data from Google Sheets to JSON files

const { google } = require('googleapis');
const fs = require('fs').promises;

// Configuration
const SPREADSHEET_ID = '1cKHGkR4w8qvobVgXVJ2WVp9YTw4lFVrAgHYrGobLzbc';
const SHEETS = ['Users', 'Barang', 'Vendor', 'Pembelian', 'Mutasi Gudang'];

// Initialize Google Sheets API
async function initSheetsAPI() {
  const credentials = JSON.parse(await fs.readFile('./credentials.json', 'utf8'));
  
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  return sheets;
}

// Export single sheet
async function exportSheet(sheets, sheetName) {
  console.log(`Exporting ${sheetName}...`);
  
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A:Z`,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      console.log(`  ⚠️  No data found in ${sheetName}`);
      return [];
    }

    // First row is headers
    const headers = rows[0];
    const data = [];

    // Convert to array of objects
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const obj = {};
      
      headers.forEach((header, index) => {
        obj[header] = row[index] || null;
      });
      
      data.push(obj);
    }

    console.log(`  ✅ Exported ${data.length} rows from ${sheetName}`);
    return data;
  } catch (error) {
    console.error(`  ❌ Error exporting ${sheetName}:`, error.message);
    return [];
  }
}

// Main export function
async function exportAllSheets() {
  console.log('🚀 Starting Google Sheets export...\n');
  
  const sheets = await initSheetsAPI();
  const exportData = {};

  for (const sheetName of SHEETS) {
    exportData[sheetName] = await exportSheet(sheets, sheetName);
  }

  // Save to JSON files
  const outputDir = './export';
  await fs.mkdir(outputDir, { recursive: true });

  for (const [sheetName, data] of Object.entries(exportData)) {
    const filename = `${outputDir}/${sheetName.toLowerCase().replace(/ /g, '_')}.json`;
    await fs.writeFile(filename, JSON.stringify(data, null, 2));
    console.log(`📁 Saved ${filename}`);
  }

  // Save combined export
  const combinedFile = `${outputDir}/combined_export.json`;
  await fs.writeFile(combinedFile, JSON.stringify(exportData, null, 2));
  console.log(`📁 Saved ${combinedFile}`);

  console.log('\n✅ Export complete!');
  
  // Print summary
  console.log('\n📊 Export Summary:');
  for (const [sheetName, data] of Object.entries(exportData)) {
    console.log(`  ${sheetName}: ${data.length} records`);
  }
}

// Run export
exportAllSheets().catch(console.error);