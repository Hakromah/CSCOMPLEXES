// Run this from C:\Users\pc\CSCOMPLEXES\strapicms directory
process.chdir('C:\\Users\\pc\\CSCOMPLEXES\\strapicms');
const { Client } = require('./node_modules/pg');

const c = new Client({ host:'127.0.0.1', port:5432, database:'cscomplexe_strapi', user:'postgres', password:'postgres18' });

c.connect().then(async () => {
  const cols = await c.query(
    `SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name='certificates' ORDER BY ordinal_position`
  );
  console.log('=== certificates columns ===');
  cols.rows.forEach(r => console.log(' ', r.column_name.padEnd(25), r.data_type.padEnd(20), r.is_nullable));

  const certs = await c.query('SELECT id, serial_number, status FROM certificates');
  console.log('\n=== certificate records ===');
  certs.rows.forEach(r => console.log(' ', r.id, r.serial_number, 'status=', JSON.stringify(r.status)));

  // Check result/transcript tables
  const tables = await c.query(
    `SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name`
  );
  const relevant = tables.rows.filter(r => 
    r.table_name.includes('result') || 
    r.table_name.includes('transcript') ||
    r.table_name.includes('exam') ||
    r.table_name.includes('grade')
  );
  console.log('\n=== relevant tables ===');
  relevant.forEach(r => console.log(' ', r.table_name));
  
  await c.end();
});
