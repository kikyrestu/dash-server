const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

async function testRootAuth() {
  console.log('🔑 Testing Root Authentication Setup\n');
  
  // Check if required commands exist
  console.log('1. Checking required system commands...');
  const commands = [
    { path: '/bin/su', name: 'su' },
    { path: '/usr/bin/sudo', name: 'sudo' },
    { path: '/bin/bash', name: 'bash' }
  ];
  
  for (const cmd of commands) {
    try {
      await execAsync(`test -x ${cmd.path}`);
      console.log(`   ✅ ${cmd.name} found at ${cmd.path}`);
    } catch (error) {
      console.log(`   ❌ ${cmd.name} not found at ${cmd.path}`);
      // Try to find alternative paths
      try {
        const { stdout } = await execAsync(`which ${cmd.name}`);
        console.log(`   📁 Found ${cmd.name} at: ${stdout.trim()}`);
      } catch (e) {
        console.log(`   ❌ ${cmd.name} not found in system`);
      }
    }
  }
  
  // Test root user info
  console.log('\n2. Checking root user configuration...');
  try {
    const { stdout } = await execAsync('getent passwd root');
    const rootInfo = stdout.trim().split(':');
    console.log(`   ✅ Root user found:`);
    console.log(`      Username: ${rootInfo[0]}`);
    console.log(`      UID: ${rootInfo[2]}`);
    console.log(`      GID: ${rootInfo[3]}`);
    console.log(`      Home: ${rootInfo[5]}`);
    console.log(`      Shell: ${rootInfo[6]}`);
  } catch (error) {
    console.log(`   ❌ Error getting root info: ${error.message}`);
  }
  
  // Check root groups
  console.log('\n3. Checking root group membership...');
  try {
    const { stdout } = await execAsync('groups root');
    console.log(`   ✅ Root groups: ${stdout.trim()}`);
  } catch (error) {
    console.log(`   ❌ Error checking root groups: ${error.message}`);
  }
  
  // Check sudo configuration for root
  console.log('\n4. Checking sudo configuration...');
  try {
    const { stdout } = await execAsync('sudo -l -U root');
    if (stdout.includes('(ALL : ALL)') || stdout.includes('(ALL)')) {
      console.log(`   ✅ Root has full sudo privileges`);
    } else {
      console.log(`   ⚠️  Root sudo privileges: ${stdout.trim()}`);
    }
  } catch (error) {
    console.log(`   ❌ Error checking sudo config: ${error.message}`);
  }
  
  // Test su command (without password)
  console.log('\n5. Testing su command accessibility...');
  try {
    // This will fail because we don't provide password, but we check if the command exists
    await execAsync('echo "test" | su - root -c "echo test" 2>/dev/null', { timeout: 5000 });
    console.log(`   ✅ su command is accessible`);
  } catch (error) {
    if (error.code === 1) {
      console.log(`   ✅ su command is accessible (expected failure due to no password)`);
    } else {
      console.log(`   ❌ su command error: ${error.message}`);
    }
  }
  
  console.log('\n🎯 Root Authentication Test Complete!');
  console.log('\n💡 Next Steps:');
  console.log('1. Make sure you know your root password');
  console.log('2. Start the development server: npm run dev');
  console.log('3. Open http://localhost:3000 in your browser');
  console.log('4. Login with:');
  console.log('   Username: root');
  console.log('   Password: [your root password]');
  console.log('\n🔧 If login fails, check:');
  console.log('- Root password is correct');
  console.log('- Root account is enabled (not locked)');
  console.log('- su/sudo commands are working');
}

testRootAuth().catch(console.error);