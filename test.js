const https = require('https');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/login',
  method: 'GET',
  rejectUnauthorized: false
};

console.log('Making request to http://localhost:3000/login');

const req = https.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers:`, JSON.stringify(res.headers, null, 2));

  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Response received');
    console.log('Response length:', data.length);
    if (data.length < 500) {
      console.log('Response body:', data);
    } else {
      console.log('Response body (truncated):', data.substring(0, 500) + '...');
    }
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
  console.error(e);
});

req.setTimeout(5000, () => {
  console.error('Request timeout');
  req.destroy();
});

req.end();