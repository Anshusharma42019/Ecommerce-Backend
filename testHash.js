const bcrypt = require('bcryptjs');

const hash = '$2a$12$muJRpM6fmdcFrcdBxdl7ZOgwKvHRZBih307C7oB4ONxBpbIP50Ed2';

async function test() {
  const p1 = 'SecurePassword123';
  const p2 = 'securepassword123';
  const p3 = 'Securepassword123';
  
  console.log(`Matches ${p1}?`, await bcrypt.compare(p1, hash));
  console.log(`Matches ${p2}?`, await bcrypt.compare(p2, hash));
  console.log(`Matches ${p3}?`, await bcrypt.compare(p3, hash));
}

test();
