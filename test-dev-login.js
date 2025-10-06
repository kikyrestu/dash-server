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
  console.log('🧪 Testing Development Login\n');
  
  // Test development credentials
  const testCredentials = [
    { username: 'root', password: 'devroot123', description: 'Root development user' },
    { username: 'admin', password: 'devadmin123', description: 'Admin development user' },
    { username: 'demo', password: 'demopassword', description: 'Demo development user' }
  ];
  
  for (const cred of testCredentials) {
    console.log(`\n🔑 Testing ${cred.description}...`);
    console.log(`   Username: ${cred.username}`);
    console.log(`   Password: ${cred.password}`);
    
    try {
      const result = await testLogin(cred.username, cred.password);
      
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
      }
    } catch (error) {
      console.log(`   ❌ Error testing login: ${error.message}`);
    }
  }
  
  console.log('\n🎯 Development Login Test Complete!');
  console.log('\n💡 You can now use these credentials in the browser:');
  console.log('   Username: root');
  console.log('   Password: devroot123');
  console.log('   Username: admin');
  console.log('   Password: devadmin123');
  console.log('   Username: demo');
  console.log('   Password: demopassword');
}

main().catch(console.error);