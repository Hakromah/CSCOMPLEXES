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

  console.log('=== Families ===');
  const families = await c.query(`SELECT * FROM families`);
  console.log(families.rows);

  const flinks = await c.query(`SELECT table_name FROM information_schema.tables WHERE table_name LIKE 'families_%'`);
  console.log('Family link tables:', flinks.rows.map(r => r.table_name));

  for (const t of flinks.rows) {
    const data = await c.query(`SELECT * FROM ${t.table_name}`);
    console.log(`Table ${t.table_name}:`, data.rows);
  }

  console.log('\n=== Testing getChildCertificates logic for student 4 (Student 2) ===');
  const student = await c.query(`SELECT id, user_id, username, first_name, last_name FROM up_users WHERE id = 4`);
  console.log('Student 4:', student.rows[0]);

  const certs = await c.query(`
    SELECT c.*, l.user_id as recipient_user_id 
    FROM certificates c 
    LEFT JOIN certificates_recipient_user_lnk l ON c.id = l.certificate_id
  `);
  console.log('Certificates with recipient links:', certs.rows);

  await c.end();
}

check().catch(e => { console.error(e); c.end(); });
