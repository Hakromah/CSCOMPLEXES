process.chdir('C:\\Users\\pc\\CSCOMPLEXES\\strapicms');
const { Client } = require('./node_modules/pg');

const c = new Client({
  host: '127.0.0.1',
  port: 5432,
  database: 'cscomplexe_strapi',
  user: 'postgres',
  password: 'postgres18'
});

async function migrate() {
  await c.connect();
  console.log('Connected to DB');

  // Check columns in certificates table
  const colsRes = await c.query(`
    SELECT column_name FROM information_schema.columns 
    WHERE table_name = 'certificates'
  `);
  const cols = colsRes.rows.map(r => r.column_name);
  console.log('Current columns in certificates:', cols);

  // If cert_status column does not exist, add it
  if (!cols.includes('cert_status')) {
    console.log('Adding column cert_status...');
    await c.query(`ALTER TABLE certificates ADD COLUMN cert_status VARCHAR(255) DEFAULT 'Valide'`);
  }

  // Copy data from status to cert_status if status column exists
  if (cols.includes('status')) {
    console.log('Copying status to cert_status...');
    await c.query(`
      UPDATE certificates 
      SET cert_status = CASE 
        WHEN status ILIKE '%revoq%' OR status ILIKE '%révoq%' THEN 'Revoque'
        ELSE 'Valide'
      END
      WHERE cert_status IS NULL OR cert_status = ''
    `);
  }

  // Ensure all rows have valid cert_status
  await c.query(`UPDATE certificates SET cert_status = 'Valide' WHERE cert_status IS NULL OR cert_status = ''`);

  const check = await c.query(`SELECT id, serial_number, cert_status FROM certificates`);
  console.log('Updated certificates:', check.rows);

  await c.end();
}

migrate().catch(e => {
  console.error(e);
  c.end();
  process.exit(1);
});
