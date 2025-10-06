const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

async function debugRootAuth() {
  console.log('🔍 Debugging Root Authentication\n');
  
  // Check if we can run commands as root
  console.log('1. Testing basic root access...');
  try {
    const result = await execAsync('whoami');
    console.log(`   Current user: ${result.stdout.trim()}`);
  } catch (error) {
    console.log(`   Error getting current user: ${error.message}`);
  }
  
  // Check if su command exists
  console.log('\n2. Checking su command...');
  try {
    const suCheck = await execAsync('which su');
    console.log(`   su command found at: ${suCheck.stdout.trim()}`);
  } catch (error) {
    console.log(`   su command not found: ${error.message}`);
  }
  
  // Check if sudo command exists
  console.log('\n3. Checking sudo command...');
  try {
    const sudoCheck = await execAsync('which sudo');
    console.log(`   sudo command found at: ${sudoCheck.stdout.trim()}`);
  } catch (error) {
    console.log(`   sudo command not found: ${error.message}`);
  }
  
  // Test if root account is enabled
  console.log('\n4. Checking root account status...');
  try {
    const rootCheck = await execAsync('getent passwd root');
    console.log(`   Root account found: ${rootCheck.stdout.trim().split(':')[0]}`);
  } catch (error) {
    console.log(`   Root account not found or error: ${error.message}`);
  }
  
  // Check if we can switch to root
  console.log('\n5. Testing root authentication methods...');
  
  // Method 1: Test su command
  console.log('   Testing su command...');
  try {
    // Note: This will fail without password, but we can see the error
    const suTest = await execAsync('su - root -c "echo ROOT_TEST" 2>&1', { timeout: 5000 });
    console.log(`   su test result: ${suTest.stdout.trim()}`);
  } catch (error) {
    console.log(`   su test error (expected): ${error.message}`);
  }
  
  // Method 2: Test sudo command
  console.log('   Testing sudo command...');
  try {
    const sudoTest = await execAsync('sudo -n whoami 2>&1', { timeout: 5000 });
    console.log(`   sudo test result: ${sudoTest.stdout.trim()}`);
  } catch (error) {
    console.log(`   sudo test error (expected): ${error.message}`);
  }
  
  // Check PAM configuration
  console.log('\n6. Checking PAM configuration...');
  try {
    const pamCheck = await execAsync('ls -la /etc/pam.d/ | grep -E "(su|sudo)"');
    console.log(`   PAM config files:\n${pamCheck.stdout}`);
  } catch (error) {
    console.log(`   Error checking PAM config: ${error.message}`);
  }
  
  // Check if we're in a container or VM
  console.log('\n7. Checking environment...');
  try {
    const envCheck = await execAsync('uname -a');
    console.log(`   System info: ${envCheck.stdout.trim()}`);
  } catch (error) {
    console.log(`   Error getting system info: ${error.message}`);
  }
  
  console.log('\n🎯 Debug Complete!');
  console.log('\n💡 Next Steps:');
  console.log('1. If root account is disabled, enable it with: sudo passwd root');
  console.log('2. If su/sudo commands are missing, install them');
  console.log('3. Check PAM configuration for authentication');
  console.log('4. Run the interactive test: node test-interactive-login.js');
}

debugRootAuth().catch(console.error);