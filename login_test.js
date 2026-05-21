const http = require('http');

const data = JSON.stringify({
  email: 'anshusharma42019@gmail.com',
  password: 'SecurePassword123'
});

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/v1/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = http.request(options, res => {
  let body = '';
  res.on('data', d => { body += d; });
  res.on('end', () => {
    console.log(`STATUS: ${res.statusCode}`);
    console.log(`BODY: ${body}`);
  });
});

req.on('error', error => {
  console.error(error);
});

req.write(data);
req.end();
