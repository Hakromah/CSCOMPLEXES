// Reads the same DATABASE_* variables Strapi's own config/database.ts uses,
// so this script connects exactly like the app does. Nothing is hardcoded.
// Run it from the strapicms folder so .env is picked up:
//   node -r dotenv/config migrate_cert_status.js
const { Client } = require('pg');

const c = new Client(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL }
    : {
        host:     process.env.DATABASE_HOST     || '127.0.0.1',
        port:     Number(process.env.DATABASE_PORT || 5432),
        database: process.env.DATABASE_NAME     || 'cscomplexe_strapi',
        user:     process.env.DATABASE_USERNAME || 'postgres',
        password: process.env.DATABASE_PASSWORD,
      }
);

if (!process.env.DATABASE_URL && !process.env.DATABASE_PASSWORD) {
  console.error('DATABASE_PASSWORD is not set. Run with:  node -r dotenv/config migrate_cert_status.js');
  process.exit(1);
}


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
