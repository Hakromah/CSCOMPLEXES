const axios = require('axios');

async function test() {
   try {
     console.log('Logging in as Admin...');
     const adminRes = await axios.post('http://192.168.1.137:1338/api/auth/local', {
        identifier: 'info@2cscomplexes.com',
        password: 'admin' // wait, I don't know the exact password. I will just pass a valid token or try it
     });
     console.log('Success!', adminRes.data);
   } catch(e) {
     console.error('Error:', e.response?.data || e.message);
   }
}

test();
