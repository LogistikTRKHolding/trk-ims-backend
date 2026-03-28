// test-api.js
// Complete API endpoint testing with proper error handling

const BASE_URL = 'http://localhost:3000/api';

// Test credentials
const TEST_USER = {
  email: 'admin@trk-holding.com',
  password: 'admin123'
};

async function test() {
  console.log('🧪 Testing TRK Inventory API\n');
  console.log('=' .repeat(60));
  console.log('Base URL:', BASE_URL);
  console.log('Test User:', TEST_USER.email);
  console.log('=' .repeat(60) + '\n');

  let token = null;
  let testsPassed = 0;
  let testsFailed = 0;

  // ============================================
  // TEST 1: Health Check
  // ============================================
  console.log('1. Testing Health Check...');
  try {
    const response = await fetch(`${BASE_URL}/health`);
    const data = await response.json();
    
    if (response.ok && data.status === 'OK') {
      console.log('   ✅ Health check passed');
      console.log('   📊 Response:', data);
      testsPassed++;
    } else {
      console.log('   ❌ Health check failed:', data);
      testsFailed++;
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message);
    console.log('   💡 Make sure server is running on port 3000');
    testsFailed++;
  }
  console.log();

  // ============================================
  // TEST 2: Login
  // ============================================
  console.log('2. Testing Login...');
  try {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(TEST_USER),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    const data = await response.json();
    token = data.token;
    
    if (token && data.user) {
      console.log('   ✅ Login successful');
      console.log('   👤 User:', data.user.fullName);
      console.log('   🎭 Role:', data.user.role);
      console.log('   🔑 Token:', token.substring(0, 30) + '...');
      testsPassed++;
    } else {
      console.log('   ❌ Login response invalid');
      console.log('   📊 Response:', data);
      testsFailed++;
    }
  } catch (error) {
    console.log('   ❌ Login failed:', error.message);
    console.log('   💡 Check if user exists in database');
    console.log('   💡 Verify credentials are correct');
    testsFailed++;
    
    // Stop tests if login fails
    console.log('\n⚠️  Cannot continue tests without authentication token\n');
    process.exit(1);
  }
  console.log();

  // ============================================
  // TEST 3: Verify Token
  // ============================================
  console.log('3. Testing Token Verification...');
  try {
    const response = await fetch(`${BASE_URL}/auth/verify`, {
      headers: { 
        'Authorization': `Bearer ${token}` 
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Token verification failed');
    }

    const data = await response.json();
    
    if (data.user) {
      console.log('   ✅ Token verified');
      console.log('   📊 User data:', data.user);
      testsPassed++;
    } else {
      console.log('   ❌ Invalid response');
      testsFailed++;
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message);
    testsFailed++;
  }
  console.log();

  // ============================================
  // TEST 4: Get Barang
  // ============================================
  console.log('4. Testing Get Barang...');
  try {
    const response = await fetch(`${BASE_URL}/data/barang`, {
      headers: { 
        'Authorization': `Bearer ${token}` 
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Get barang failed');
    }

    const data = await response.json();
    
    if (Array.isArray(data)) {
      console.log('   ✅ Retrieved barang successfully');
      console.log('   📊 Total items:', data.length);
      
      if (data.length > 0) {
        console.log('   📦 Sample item:', {
          kode: data[0].kode_barang,
          pn: data[0].part_number,
          nama: data[0].nama_barang,
          kategori: data[0].kategori
        });
      } else {
        console.log('   ⚠️  No items in database');
      }
      testsPassed++;
    } else {
      console.log('   ❌ Invalid response format');
      console.log('   📊 Response:', data);
      testsFailed++;
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message);
    testsFailed++;
  }
  console.log();

  // ============================================
  // TEST 5: Get Users
  // ============================================
  console.log('5. Testing Get Users...');
  try {
    const response = await fetch(`${BASE_URL}/users`, {
      headers: { 
        'Authorization': `Bearer ${token}` 
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Get users failed');
    }

    const data = await response.json();
    
    if (Array.isArray(data)) {
      console.log('   ✅ Retrieved users successfully');
      console.log('   📊 Total items:', data.length);
      
      if (data.length > 0) {
        console.log('   📦 Sample item:', {
          kode: data[0].user,
          nama: data[0].fullName,
          role: data[0].role
        });
      } else {
        console.log('   ⚠️  No users in database');
      }
      testsPassed++;
    } else {
      console.log('   ❌ Invalid response format');
      console.log('   📊 Response:', data);
      testsFailed++;
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message);
    testsFailed++;
  }
  console.log();

  // ============================================
  // TEST 6: Get Sub Kategory
  // ============================================
  console.log('6. Testing Get Sub Kategori...');
  try {
    const response = await fetch(`${BASE_URL}/views/v_sub_kategori`, {
      headers: { 
        'Authorization': `Bearer ${token}` 
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Get sub-kategori failed');
    }

    const data = await response.json();
    
    if (Array.isArray(data)) {
      console.log('   ✅ Retrieved sub-kategori successfully');
      console.log('   📊 Total items:', data.length);
      
      if (data.length > 0) {
        console.log('   📦 Sample item:', {
          kode_sub_kategori: data[0].kode_sub_kategori,
          nama_sub_kategori: data[0].nama_sub_kategori,
          kode_kategori: data[0].kode_kategori,
          deskripsi:data[0].deskripsi,
        });
      } else {
        console.log('   ⚠️  No v_sub_kategori in database');
      }
      testsPassed++;
    } else {
      console.log('   ❌ Invalid response format');
      console.log('   📊 Response:', data);
      testsFailed++;
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message);
    testsFailed++;
  }
  console.log();

  // ============================================
  // TEST 7: Get Vendor
  // ============================================
  console.log('7. Testing Get Vendor...');
  try {
    const response = await fetch(`${BASE_URL}/data/vendor`, {
      headers: { 
        'Authorization': `Bearer ${token}` 
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Get vendor failed');
    }

    const data = await response.json();
    
    if (Array.isArray(data)) {
      console.log('   ✅ Retrieved vendor successfully');
      console.log('   📊 Total vendors:', data.length);
      testsPassed++;
    } else {
      console.log('   ❌ Invalid response format');
      testsFailed++;
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message);
    testsFailed++;
  }
  console.log();

  // ============================================
  // TEST 8: Get Stok Summary
  // ============================================
  console.log('8. Testing Get Stok Summary...');
  try {
    const response = await fetch(`${BASE_URL}/data/stok`, {
      headers: { 
        'Authorization': `Bearer ${token}` 
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Get stok failed');
    }

    const data = await response.json();
    
    if (Array.isArray(data)) {
      console.log('   ✅ Retrieved stok summary successfully');
      console.log('   📊 Total items:', data.length);
      
      if (data.length > 0) {
        console.log('   📦 Sample stok:', {
          kode: data[0].kode_barang,
          stok_akhir: data[0].stok_akhir,
          status: data[0].status_stok
        });
      }
      testsPassed++;
    } else {
      console.log('   ❌ Invalid response format');
      testsFailed++;
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message);
    testsFailed++;
  }
  console.log();

  // ============================================
  // TEST 9: Get Dashboard Metrics
  // ============================================
  console.log('9. Testing Dashboard Metrics...');
  try {
    const response = await fetch(`${BASE_URL}/dashboard/metrics`, {
      headers: { 
        'Authorization': `Bearer ${token}` 
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Get metrics failed');
    }

    const data = await response.json();
    
    if (data.totalNilai !== undefined) {
      console.log('   ✅ Retrieved metrics successfully');
      console.log('   📊 Metrics:');
      console.log('      💰 Total Nilai Persediaan: Rp', data.totalNilai.toLocaleString('id-ID'));
      console.log('      ⚠️  Item Kritis:', data.itemKritis);
      console.log('      📤 Transaksi Keluar:', data.transaksiKeluar);
      console.log('      ⏱️  Avg Lead Time:', data.avgLeadTime, 'hari');
      console.log('      📋 Pesanan Aktif:', data.pesananAktif);
      console.log('      💸 Total Pembelian: Rp', data.totalPembelian.toLocaleString('id-ID'));
      testsPassed++;
    } else {
      console.log('   ❌ Invalid metrics format');
      console.log('   📊 Response:', data);
      testsFailed++;
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message);
    testsFailed++;
  }
  console.log();

  // ============================================
  // TEST 10: Get Users (Admin only)
  // ============================================
  console.log('10. Testing Get Users (Admin)...');
  try {
    const response = await fetch(`${BASE_URL}/users`, {
      headers: { 
        'Authorization': `Bearer ${token}` 
      },
    });

    if (response.status === 403) {
      console.log('   ⚠️  Access denied (not Admin role)');
      console.log('   💡 This is expected if test user is not Admin');
      testsPassed++;
    } else if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Get users failed');
    } else {
      const data = await response.json();
      
      if (Array.isArray(data)) {
        console.log('   ✅ Retrieved users successfully');
        console.log('   📊 Total users:', data.length);
        testsPassed++;
      } else {
        console.log('   ❌ Invalid response format');
        testsFailed++;
      }
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message);
    testsFailed++;
  }
  console.log();

  // ============================================
  // TEST 11: Create Mutasi (All roles)
  // ============================================
  console.log('11. Testing Create Mutasi Gudang...');
  try {
    const testMutasi = {
      //no_transaksi: 'TEST-' + Date.now(),
      tanggal: new Date().toISOString().split('T')[0],
      jenis_transaksi: 'Masuk',
      kode_barang: 'PL-WSH-SELANG-KOMPRESSOR', // Adjust based on your data
      nama_barang: 'Test Item',
      qty: 10,
      satuan: 'PCS',
      keterangan: 'Test mutasi from API test'
    };

    const response = await fetch(`${BASE_URL}/data/mutasi`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testMutasi)
    });

    if (!response.ok) {
      const error = await response.json();
      
      if (error.error.includes('foreign key')) {
        console.log('   ⚠️  Cannot create - kode_barang not found in database');
        console.log('   💡 This is expected if BRG001 does not exist');
        testsPassed++;
      } else {
        throw new Error(error.error || 'Create mutasi failed');
      }
    } else {
      const data = await response.json();
      console.log('   ✅ Created mutasi successfully');
      console.log('   📦 Created:', data.no_transaksi);
      testsPassed++;
      
      // Clean up - delete test data
      if (data.id) {
        await fetch(`${BASE_URL}/data/mutasi/${data.id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('   🗑️  Test data cleaned up');
      }
    }
  
  } catch (error) {
    console.log('   ❌ Error:', error.message);
    testsFailed++;
  }
  console.log();

  // ============================================
  // SUMMARY
  // ============================================
  console.log('=' .repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('=' .repeat(60));
  console.log(`✅ Tests Passed: ${testsPassed}`);
  console.log(`❌ Tests Failed: ${testsFailed}`);
  console.log(`📈 Success Rate: ${Math.round((testsPassed / (testsPassed + testsFailed)) * 100)}%`);
  console.log('=' .repeat(60));

  if (testsFailed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! API is working correctly!\n');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the errors above.\n');
    process.exit(1);
  }
}

// Run tests
test().catch(error => {
  console.error('\n❌ Test suite failed:', error);
  process.exit(1);
});