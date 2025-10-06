const https = require('https');
const http = require('http');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

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
  console.log('🧪 Interactive Login API Test\n');
  
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
    rl.close();
    return;
  }
  
  // Get username and password from user
  console.log('\n2. Enter credentials for testing:');
  
  const username = await new Promise((resolve) => {
    rl.question('   Username: ', (answer) => {
      resolve(answer.trim());
    });
  });
  
  const password = await new Promise((resolve) => {
    rl.question('   Password: ', (answer) => {
      resolve(answer.trim());
    });
  });
  
  if (!username || !password) {
    console.log('   ❌ Username and password are required');
    rl.close();
    return;
  }
  
  console.log('\n3. Testing authentication...');
  
  try {
    const result = await testLogin(username, password);
    
    console.log(`   Status Code: ${result.statusCode}`);
    console.log(`   Response:`, JSON.stringify(result.body, null, 2));
    
    if (result.statusCode === 200) {
      console.log('   ✅ Login successful!');
      
      // Extract token from cookies if present
      const setCookieHeader = result.headers['set-cookie'];
      if (setCookieHeader) {
        const authToken = setCookieHeader.find(cookie => cookie.startsWith('auth-token='));
        if (authToken) {
          console.log(`   🍪 Auth token set in cookie`);
          const tokenValue = authToken.split('=')[1].split(';')[0];
          console.log(`   🔑 Token: ${tokenValue.substring(0, 20)}...`);
        }
      }
    } else {
      console.log('   ❌ Login failed');
      console.log('   🔧 Troubleshooting:');
      console.log('   - Check if username and password are correct');
      console.log('   - Verify user account exists and is enabled');
      console.log('   - Check system authentication configuration');
    }
  } catch (error) {
    console.log(`   ❌ Error testing login: ${error.message}`);
  }
  
  rl.close();
}

main().catch(console.error);