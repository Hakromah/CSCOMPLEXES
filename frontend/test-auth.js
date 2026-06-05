const axios = require('axios');

async function test() {
   try {
     console.log('1. Logging in as Admin...');
     const adminRes = await axios.post('http://127.0.0.1:1338/api/auth/local', {
        identifier: 'admin@school.com',
        password: 'admin'
     });
     const adminJwt = adminRes.data.jwt;

     console.log('2. Creating a Student...');
     const uniqueSuffix = Date.now();
     await axios.post('http://127.0.0.1:1338/api/admin/users', {
        name: 'Test Student ' + uniqueSuffix,
        email: 'test' + uniqueSuffix + '@gmail.com',
        password: 'password123',
        role: 'STUDENT'
     }, {
        headers: { Authorization: `Bearer ${adminJwt}` }
     });

     console.log('3. Trying to login as the new Student...');
     const studentRes = await axios.post('http://127.0.0.1:1338/api/auth/local', {
        identifier: 'test' + uniqueSuffix + '@gmail.com',
        password: 'password123'
     });
     console.log('Success!', studentRes.data.user.email);
   } catch(e) {
     console.error('Error:', e.response?.data?.error || e.message);
   }
}

test();
