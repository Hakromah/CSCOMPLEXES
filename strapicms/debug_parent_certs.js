process.chdir('C:\\Users\\pc\\CSCOMPLEXES\\strapicms');
const { Client } = require('./node_modules/pg');

const c = new Client({
  host: '127.0.0.1',
  port: 5432,
  database: 'cscomplexe_strapi',
  user: 'postgres',
  password: 'postgres18'
});

async function check() {
  await c.connect();

  console.log('=== All Certificates ===');
  const certs = await c.query(`
    SELECT id, serial_number, student_name, student_user_id, certificate_type, cert_status 
    FROM certificates ORDER BY id DESC
  `);
  console.log(certs.rows);

  console.log('\n=== All Users (Students & Parents) ===');
  const users = await c.query(`
    SELECT id, user_id, username, first_name, last_name, email, school_role 
    FROM up_users 
    WHERE school_role IN ('STUDENT', 'PARENT')
    ORDER BY id ASC
  `);
  console.log(users.rows);

  console.log('\n=== Certificate Recipient Links ===');
  const links = await c.query(`
    SELECT * FROM information_schema.tables WHERE table_name LIKE '%certificate%lnk%' OR table_name LIKE '%certificates%user%'
  `);
  console.log(links.rows.map(r => r.table_name));

  for (const t of links.rows) {
    const data = await c.query(`SELECT * FROM ${t.table_name}`);
    console.log(`Table ${t.table_name}:`, data.rows);
  }

  await c.end();
}

check().catch(e => { console.error(e); c.end(); });
