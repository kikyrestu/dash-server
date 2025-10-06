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
      rejectUnauthorized: false
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

function testVerify(token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/verify',
      method: 'GET',
      headers: {
        'Cookie': `auth-token=${token}`
      },
      rejectUnauthorized: false
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
            body: response
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            body: data,
            parseError: error.message
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

async function main() {
  console.log('🧪 Testing Token Verification\n');
  
  // Step 1: Login to get token
  console.log('1. Logging in as root...');
  try {
    const loginResult = await testLogin('root', 'devroot123');
    
    if (loginResult.statusCode === 200) {
      console.log('   ✅ Login successful');
      
      // Extract token from cookies
      const setCookieHeader = loginResult.headers['set-cookie'];
      let token = null;
      
      if (setCookieHeader) {
        const authToken = setCookieHeader.find(cookie => cookie.startsWith('auth-token='));
        if (authToken) {
          token = authToken.split('=')[1].split(';')[0];
          console.log(`   🔑 Token obtained: ${token.substring(0, 20)}...`);
        }
      }
      
      if (!token) {
        console.log('   ❌ No token found in cookies');
        return;
      }
      
      // Step 2: Test token verification
      console.log('\n2. Testing token verification...');
      const verifyResult = await testVerify(token);
      
      console.log(`   Status Code: ${verifyResult.statusCode}`);
      console.log(`   Response:`, JSON.stringify(verifyResult.body, null, 2));
      
      if (verifyResult.statusCode === 200) {
        console.log('   ✅ Token verification successful!');
      } else {
        console.log('   ❌ Token verification failed');
      }
      
      // Step 3: Test with invalid token
      console.log('\n3. Testing with invalid token...');
      const invalidResult = await testVerify('invalid-token-123');
      
      console.log(`   Status Code: ${invalidResult.statusCode}`);
      console.log(`   Response:`, JSON.stringify(invalidResult.body, null, 2));
      
      if (invalidResult.statusCode === 401) {
        console.log('   ✅ Invalid token properly rejected');
      } else {
        console.log('   ❌ Invalid token not properly handled');
      }
      
    } else {
      console.log('   ❌ Login failed');
      console.log(`   Status: ${loginResult.statusCode}`);
      console.log(`   Response:`, JSON.stringify(loginResult.body, null, 2));
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  console.log('\n🎯 Token Verification Test Complete!');
}

main().catch(console.error);