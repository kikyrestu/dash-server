const { SystemAuth } = require('./src/lib/system-auth.ts');

async function testRootLogin() {
  console.log('🔍 Testing Root Login Configuration...\n');
  
  const systemAuth = new SystemAuth();
  
  // Test 1: Check if root user exists
  console.log('1. Checking if root user exists...');
  try {
    const rootExists = await systemAuth.userExists('root');
    console.log(`   ✅ Root user exists: ${rootExists}`);
  } catch (error) {
    console.log(`   ❌ Error checking root user: ${error.message}`);
  }
  
  // Test 2: Get root user info
  console.log('\n2. Getting root user info...');
  try {
    const rootInfo = await systemAuth.getUserInfo('root');
    console.log(`   ✅ Root user info:`);
    console.log(`      Username: ${rootInfo.username}`);
    console.log(`      UID: ${rootInfo.uid}`);
    console.log(`      GID: ${rootInfo.gid}`);
    console.log(`      Home: ${rootInfo.home}`);
    console.log(`      Shell: ${rootInfo.shell}`);
    console.log(`      Full Name: ${rootInfo.fullName}`);
  } catch (error) {
    console.log(`   ❌ Error getting root info: ${error.message}`);
  }
  
  // Test 3: Get root groups
  console.log('\n3. Getting root user groups...');
  try {
    const rootGroups = await systemAuth.getUserGroups('root');
    console.log(`   ✅ Root groups: ${rootGroups.join(', ')}`);
  } catch (error) {
    console.log(`   ❌ Error getting root groups: ${error.message}`);
  }
  
  // Test 4: Check root sudo privileges
  console.log('\n4. Checking root sudo privileges...');
  try {
    const hasSudo = await systemAuth.hasSudoPrivileges('root');
    console.log(`   ✅ Root has sudo privileges: ${hasSudo}`);
  } catch (error) {
    console.log(`   ❌ Error checking sudo privileges: ${error.message}`);
  }
  
  // Test 5: Check system paths
  console.log('\n5. Checking system paths...');
  const fs = require('fs');
  const paths = ['/usr/bin/sudo', '/bin/su', '/bin/bash'];
  
  paths.forEach(path => {
    if (fs.existsSync(path)) {
      console.log(`   ✅ ${path} exists`);
    } else {
      console.log(`   ❌ ${path} not found`);
    }
  });
  
  console.log('\n🎯 Root Login Configuration Test Complete!');
  console.log('\n💡 To test actual login, run:');
  console.log('   curl -X POST http://localhost:3000/api/auth/login \\');
  console.log('     -H "Content-Type: application/json" \\');
  console.log('     -d \'{"username":"root","password":"YOUR_ROOT_PASSWORD"}\'');
}

testRootLogin().catch(console.error);