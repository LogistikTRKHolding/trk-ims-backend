// import-to-supabase.js
// Fixed version dengan proper .env loading

// ============================================
// IMPORTANT: Load .env FIRST before anything
// ============================================
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const bcrypt = require('bcryptjs');

// ============================================
// Configuration & Validation
// ============================================

console.log('🔍 Checking environment variables...\n');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

// Validate environment variables
if (!SUPABASE_URL) {
  console.error('❌ Error: SUPABASE_URL is not set!');
  console.log('\n💡 Solution:');
  console.log('   1. Create a .env file in the backend folder');
  console.log('   2. Add this line: SUPABASE_URL=https://xxxxx.supabase.co');
  console.log('   3. Replace xxxxx with your actual Supabase URL\n');
  process.exit(1);
}

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: SUPABASE_SERVICE_KEY is not set!');
  console.log('\n💡 Solution:');
  console.log('   1. Open your Supabase Dashboard');
  console.log('   2. Go to Settings → API');
  console.log('   3. Copy the "service_role" key (NOT the anon key)');
  console.log('   4. Add to .env file: SUPABASE_SERVICE_KEY=eyJhbGci...\n');
  process.exit(1);
}

// Validate URL format
try {
  const url = new URL(SUPABASE_URL);
  if (!url.hostname.endsWith('.supabase.co')) {
    console.error('❌ Error: Invalid SUPABASE_URL format!');
    console.log('   Expected: https://xxxxx.supabase.co');
    console.log('   Got:', SUPABASE_URL);
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Error: SUPABASE_URL is not a valid URL!');
  console.log('   Got:', SUPABASE_URL);
  process.exit(1);
}

// Validate SERVICE_KEY format (should be JWT)
if (!SUPABASE_SERVICE_KEY.startsWith('eyJ')) {
  console.error('❌ Error: SUPABASE_SERVICE_KEY does not look like a JWT token!');
  console.log('   JWT tokens should start with "eyJ"');
  console.log('   Got:', SUPABASE_SERVICE_KEY.substring(0, 20) + '...');
  console.log('\n💡 Make sure you copied the "service_role" key, not "anon" key\n');
  process.exit(1);
}

console.log('✅ Environment variables validated:');
console.log('   SUPABASE_URL:', SUPABASE_URL);
console.log('   SUPABASE_SERVICE_KEY:', SUPABASE_SERVICE_KEY.substring(0, 30) + '...\n');

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

console.log('✅ Supabase client created successfully\n');

// ============================================
// Import Functions
// ============================================

// Import Users
async function importUsers(userData) {
  console.log('📥 Importing Users...');
  let successCount = 0;
  let errorCount = 0;
  
  for (const user of userData) {
    try {
      // Check if password is already hashed
      let passwordHash = user.Password;
      if (!passwordHash) {
        console.log(`  ⚠️  Skipping user ${user.Email} - no password`);
        continue;
      }

      if (!passwordHash.startsWith('$2a$') && !passwordHash.startsWith('$2b$')) {
        passwordHash = await bcrypt.hash(passwordHash, 10);
      }

      const { error } = await supabase
        .from('users')
        .insert({
          user_id: user['User ID'],
          email: user.Email,
          password_hash: passwordHash,
          full_name: user['Full Name'],
          role: user.Role,
          status: user.Status,
          phone: user.Phone || null,
          department: user.Department || null,
          created_at: user['Created Date'] ? new Date(user['Created Date']) : new Date(),
          last_login: user['Last Login'] ? new Date(user['Last Login']) : null,
        });

      if (error) {
        if (error.code === '23505') {
          console.log(`  ⏭️  User ${user.Email} already exists, skipping...`);
        } else {
          console.error(`  ❌ Error importing ${user.Email}:`, error.message);
          errorCount++;
        }
      } else {
        console.log(`  ✅ Imported: ${user.Email}`);
        successCount++;
      }
    } catch (err) {
      console.error(`  ❌ Exception importing user:`, err.message);
      errorCount++;
    }
  }

  console.log(`  📊 Users: ${successCount} imported, ${errorCount} errors\n`);
}

// Import Barang
async function importBarang(barangData) {
  console.log('📥 Importing Barang...');
  let successCount = 0;
  let errorCount = 0;
  
  for (const item of barangData) {
    try {
      const { error } = await supabase
        .from('barang')
        .insert({
          kode_barang: item['Kode Barang'],
          nama_barang: item['Nama Barang'],
          kategori: item.Kategori,
          mesin: item.Mesin || null,
          satuan: item.Satuan,
          harga_satuan: parseFloat(item['Harga Satuan']) || 0,
          min_stok: parseInt(item['Min Stok']) || 0,
          max_stok: item['Max Stok'] ? parseInt(item['Max Stok']) : null,
          lokasi_gudang: item['Lokasi Gudang'] || null,
          supplier_utama: item['Supplier Utama'] || null,
          keterangan: item.Keterangan || null,
          is_active: true,
        });

      if (error) {
        if (error.code === '23505') {
          console.log(`  ⏭️  Barang ${item['Kode Barang']} already exists, skipping...`);
        } else {
          console.error(`  ❌ Error importing ${item['Kode Barang']}:`, error.message);
          errorCount++;
        }
      } else {
        console.log(`  ✅ Imported: ${item['Kode Barang']}`);
        successCount++;
      }
    } catch (err) {
      console.error(`  ❌ Exception importing item:`, err.message);
      errorCount++;
    }
  }

  console.log(`  📊 Barang: ${successCount} imported, ${errorCount} errors\n`);
}

// Import Vendor
async function importVendor(vendorData) {
  console.log('📥 Importing Vendor...');
  let successCount = 0;
  let errorCount = 0;
  
  for (const vendor of vendorData) {
    try {
      const { error } = await supabase
        .from('vendor')
        .insert({
          kode_vendor: vendor['Kode Vendor'],
          nama_vendor: vendor['Nama Vendor'],
          kontak: vendor.Kontak || null,
          alamat: vendor.Alamat || null,
          email: vendor.Email || null,
          telepon: vendor.Telepon || null,
          keterangan: vendor.Keterangan || null,
          is_active: true,
        });

      if (error) {
        if (error.code === '23505') {
          console.log(`  ⏭️  Vendor ${vendor['Kode Vendor']} already exists, skipping...`);
        } else {
          console.error(`  ❌ Error importing ${vendor['Kode Vendor']}:`, error.message);
          errorCount++;
        }
      } else {
        console.log(`  ✅ Imported: ${vendor['Kode Vendor']}`);
        successCount++;
      }
    } catch (err) {
      console.error(`  ❌ Exception importing vendor:`, err.message);
      errorCount++;
    }
  }

  console.log(`  📊 Vendor: ${successCount} imported, ${errorCount} errors\n`);
}

// Import Pembelian
async function importPembelian(pembelianData) {
  console.log('📥 Importing Pembelian...');
  let successCount = 0;
  let errorCount = 0;
  
  for (const po of pembelianData) {
    try {
      const { error } = await supabase
        .from('pembelian')
        .insert({
          no_po: po['No PO'],
          tanggal_po: po['Tanggal PO'],
          kode_vendor: po['Kode Vendor'],
          nama_vendor: po['Nama Vendor'],
          kode_barang: po['Kode Barang'],
          nama_barang: po['Nama Barang'],
          qty_order: parseInt(po['Qty Order']),
          harga_satuan: parseFloat(po['Harga Satuan']),
          tanggal_terima: po['Tanggal Terima'] || null,
          status: po.Status || 'Pending',
          keterangan: po.Keterangan || null,
        });

      if (error) {
        if (error.code === '23505') {
          console.log(`  ⏭️  PO ${po['No PO']} already exists, skipping...`);
        } else {
          console.error(`  ❌ Error importing ${po['No PO']}:`, error.message);
          errorCount++;
        }
      } else {
        console.log(`  ✅ Imported: ${po['No PO']}`);
        successCount++;
      }
    } catch (err) {
      console.error(`  ❌ Exception importing PO:`, err.message);
      errorCount++;
    }
  }

  console.log(`  📊 Pembelian: ${successCount} imported, ${errorCount} errors\n`);
}

// Import Mutasi Gudang
async function importMutasi(mutasiData) {
  console.log('📥 Importing Mutasi Gudang...');
  let successCount = 0;
  let errorCount = 0;
  
  for (const mutasi of mutasiData) {
    try {
      const { error } = await supabase
        .from('mutasi_gudang')
        .insert({
          no_transaksi: mutasi['No Transaksi'],
          tanggal: mutasi.Tanggal,
          jenis_transaksi: mutasi['Jenis Transaksi'],
          kode_barang: mutasi['Kode Barang'],
          nama_barang: mutasi['Nama Barang'],
          qty: parseInt(mutasi.Qty),
          satuan: mutasi.Satuan,
          keterangan: mutasi.Keterangan || null,
          referensi: mutasi.Referensi || null,
        });

      if (error) {
        if (error.code === '23505') {
          console.log(`  ⏭️  Mutasi ${mutasi['No Transaksi']} already exists, skipping...`);
        } else {
          console.error(`  ❌ Error importing ${mutasi['No Transaksi']}:`, error.message);
          errorCount++;
        }
      } else {
        console.log(`  ✅ Imported: ${mutasi['No Transaksi']}`);
        successCount++;
      }
    } catch (err) {
      console.error(`  ❌ Exception importing mutasi:`, err.message);
      errorCount++;
    }
  }

  console.log(`  📊 Mutasi: ${successCount} imported, ${errorCount} errors\n`);
}

// ============================================
// Main Import Function
// ============================================

async function importAllData() {
  console.log('🚀 Starting Supabase import...\n');
  console.log('=' .repeat(60) + '\n');
  
  try {
    // Test connection first
    console.log('🔌 Testing Supabase connection...');
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (testError && testError.code !== 'PGRST116') { // PGRST116 = empty result, which is OK
      throw new Error(`Connection failed: ${testError.message}`);
    }
    
    console.log('✅ Connection successful!\n');
    console.log('=' .repeat(60) + '\n');

    // Load exported data
    const exportDir = './export';
    
    console.log(`📂 Loading data from: ${exportDir}\n`);

    const usersData = JSON.parse(await fs.readFile(`${exportDir}/users.json`, 'utf8'));
    const barangData = JSON.parse(await fs.readFile(`${exportDir}/barang.json`, 'utf8'));
    const vendorData = JSON.parse(await fs.readFile(`${exportDir}/vendor.json`, 'utf8'));
    const pembelianData = JSON.parse(await fs.readFile(`${exportDir}/pembelian.json`, 'utf8'));
    const mutasiData = JSON.parse(await fs.readFile(`${exportDir}/mutasi_gudang.json`, 'utf8'));

    console.log('📊 Data loaded:');
    console.log(`   Users: ${usersData.length}`);
    console.log(`   Barang: ${barangData.length}`);
    console.log(`   Vendor: ${vendorData.length}`);
    console.log(`   Pembelian: ${pembelianData.length}`);
    console.log(`   Mutasi Gudang: ${mutasiData.length}\n`);
    console.log('=' .repeat(60) + '\n');

    // Import in order (respecting foreign keys)
    await importUsers(usersData);
    await importVendor(vendorData);
    await importBarang(barangData);
    await importPembelian(pembelianData);
    await importMutasi(mutasiData);

    // Refresh materialized view
    console.log('🔄 Refreshing stok_summary view...');
    const { error: refreshError } = await supabase.rpc('refresh_stok_summary');
    if (refreshError) {
      console.error('  ❌ Error refreshing view:', refreshError.message);
    } else {
      console.log('  ✅ View refreshed successfully\n');
    }

    console.log('=' .repeat(60));
    console.log('✅ IMPORT COMPLETE!');
    console.log('=' .repeat(60));
    console.log('\n🎉 Your data has been successfully migrated to Supabase!\n');
    console.log('📝 Next steps:');
    console.log('   1. Verify data in Supabase Dashboard');
    console.log('   2. Test backend API endpoints');
    console.log('   3. Update frontend to use new backend');
    console.log('   4. Deploy to production\n');

  } catch (error) {
    console.error('\n❌ Import failed!');
    console.error('Error:', error.message);
    
    if (error.code === 'ENOENT') {
      console.log('\n💡 Solution: Make sure you have exported data from Google Sheets');
      console.log('   Run: node export-sheets-data.js (if using Google Sheets API)');
      console.log('   Or manually export CSV files to ./export folder');
    }
    
    process.exit(1);
  }
}

// ============================================
// Run Import
// ============================================

importAllData().catch(console.error);