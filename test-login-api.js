const https = require('https');
const http = require('http');

function testLogin(username, password) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      username: username,
      password: password
    });

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      rejectUnauthorized: false // Ignore SSL cert issues
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: response
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data,
            parseError: error.message
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

async function main() {
  console.log('🧪 Testing Login API\n');
  
  // Check if server is running
  console.log('1. Checking if development server is running...');
  try {
    const healthCheck = await testLogin('', '');
    if (healthCheck.statusCode === 400) {
      console.log('   ✅ Development server is running on port 3000');
    } else {
      console.log(`   ⚠️  Server responded with status: ${healthCheck.statusCode}`);
    }
  } catch (error) {
    console.log(`   ❌ Cannot connect to development server: ${error.message}`);
    console.log(`   💡 Please start the server with: npm run dev`);
    return;
  }
  
  // Test root login
  console.log('\n2. Testing root login...');
  console.log('   💡 Note: You need to replace YOUR_ROOT_PASSWORD with actual root password');
  
  try {
    const result = await testLogin('root', 'YOUR_ROOT_PASSWORD');
    
    console.log(`   Status Code: ${result.statusCode}`);
    console.log(`   Response:`, JSON.stringify(result.body, null, 2));
    
    if (result.statusCode === 200) {
      console.log('   ✅ Root login successful!');
      
      // Extract token from cookies if present
      const setCookieHeader = result.headers['set-cookie'];
      if (setCookieHeader) {
        const authToken = setCookieHeader.find(cookie => cookie.startsWith('auth-token='));
        if (authToken) {
          console.log(`   🍪 Auth token set in cookie`);
        }
      }
    } else {
      console.log('   ❌ Root login failed');
      console.log('   🔧 Troubleshooting:');
      console.log('   - Make sure root password is correct');
      console.log('   - Check if root account is enabled');
      console.log('   - Verify development server is running');
    }
  } catch (error) {
    console.log(`   ❌ Error testing login: ${error.message}`);
  }
  
  console.log('\n🎯 Login API Test Complete!');
  console.log('\n💡 Manual Testing:');
  console.log('1. Start server: npm run dev');
  console.log('2. Open browser to: http://localhost:3000');
  console.log('3. Use these credentials:');
  console.log('   Username: root');
  console.log('   Password: [your actual root password]');
}

main().catch(console.error);