#!/usr/bin/env node

const SystemAuth = require('./system-auth');

async function testSystemAuth() {
  console.log('🧪 Testing System Authentication...\n');
  
  const auth = new SystemAuth();
  
  // Test 1: Check if current user exists
  try {
    const { exec } = require('child_process');
    const currentUser = await new Promise((resolve) => {
      exec('whoami', (error, stdout) => {
        resolve(stdout.trim());
      });
    });
    
    console.log(`📋 Current user: ${currentUser}`);
    
    const userExists = await auth.userExists(currentUser);
    console.log(`✅ User exists: ${userExists}`);
    
    if (userExists) {
      // Test 2: Get user info
      try {
        const userInfo = await auth.getUserInfo(currentUser);
        console.log('📊 User Info:', JSON.stringify(userInfo, null, 2));
      } catch (error) {
        console.log('❌ Failed to get user info:', error.message);
      }
      
      // Test 3: Get user groups
      try {
        const groups = await auth.getUserGroups(currentUser);
        console.log('👥 User Groups:', groups);
      } catch (error) {
        console.log('❌ Failed to get user groups:', error.message);
      }
      
      // Test 4: Check sudo privileges
      try {
        const hasSudo = await auth.hasSudoPrivileges(currentUser);
        console.log('🔑 Has Sudo Privileges:', hasSudo);
      } catch (error) {
        console.log('❌ Failed to check sudo privileges:', error.message);
      }
      
      // Test 5: Get system users
      try {
        const users = await auth.getSystemUsers();
        console.log('👥 System Users (first 10):', users.slice(0, 10));
      } catch (error) {
        console.log('❌ Failed to get system users:', error.message);
      }
      
      // Test 6: Test JWT generation and verification
      try {
        const token = auth.generateJWT(currentUser);
        console.log('🔑 Generated JWT token (first 50 chars):', token.substring(0, 50) + '...');
        
        const verification = auth.verifyToken(token);
        console.log('✅ Token verification:', verification.valid ? 'SUCCESS' : 'FAILED');
        if (verification.valid) {
          console.log('📋 Token payload:', JSON.stringify(verification.user, null, 2));
        }
      } catch (error) {
        console.log('❌ JWT test failed:', error.message);
      }
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
  
  console.log('\n🎯 System Authentication Test Complete!');
  console.log('\n📝 Note: Password authentication test requires actual credentials');
  console.log('🌐 Test the login endpoint with: curl -X POST http://localhost:3002/api/auth/login -H "Content-Type: application/json" -d \'{"username":"youruser","password":"yourpass"}\'');
}

// Run the test
testSystemAuth().catch(console.error);