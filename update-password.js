// update-password.js
// Update user password in Supabase

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function updatePassword() {
  console.log('🔐 Update User Password\n');
  console.log('=' .repeat(60));

  // User to update
  const email = 'admin@trk-holding.com';
  const newPassword = 'admin123';

  try {
    // 1. Find user
    console.log('1️⃣  Finding user...');
    const { data: user, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (findError || !user) {
      throw new Error('User not found: ' + email);
    }

    console.log('   ✅ User found');
    console.log('   📧 Email:', user.email);
    console.log('   👤 Name:', user.full_name);
    console.log('   🎭 Role:', user.role);
    console.log();

    // 2. Hash new password
    console.log('2️⃣  Hashing new password...');
    const passwordHash = await bcrypt.hash(newPassword, 10);
    console.log('   ✅ Password hashed');
    console.log('   🔑 New hash:', passwordHash.substring(0, 30) + '...');
    console.log();

    // 3. Update password
    console.log('3️⃣  Updating password in database...');
    const { error: updateError } = await supabase
      .from('users')
      .update({ password_hash: passwordHash })
      .eq('email', email);

    if (updateError) {
      throw updateError;
    }

    console.log('   ✅ Password updated successfully!\n');

    // 4. Test login
    console.log('4️⃣  Testing login with new password...');
    
    const loginTest = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: newPassword })
    });

    if (loginTest.ok) {
      const loginData = await loginTest.json();
      console.log('   ✅ Login test successful!');
      console.log('   👤 User:', loginData.user.fullName);
      console.log('   🎭 Role:', loginData.user.role);
      console.log('   🔑 Token:', loginData.token.substring(0, 30) + '...');
    } else {
      const error = await loginTest.json();
      console.log('   ⚠️  Login test failed:', error.error);
    }

    console.log('\n' + '=' .repeat(60));
    console.log('✅ Password updated successfully!\n');
    console.log('New credentials:');
    console.log('   Email:    ' + email);
    console.log('   Password: ' + newPassword);
    console.log('=' .repeat(60) + '\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

updatePassword().catch(console.error);