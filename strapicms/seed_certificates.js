/**
 * Seed script — Certificate Types & Mentions
 * Run AFTER restarting Strapi (so it creates the tables).
 * Usage: node seed_certificates.js
 */

const { Client } = require('pg');

const client = new Client({
  host:     '127.0.0.1',
  port:     5432,
  database: 'cscomplexe_strapi',
  user:     'postgres',
  password: 'postgres18',
});

// ─── 7 Certificate Types ──────────────────────────────────────────────────────
const CERT_TYPES = [
  {
    name:             "Diplôme de Fin d'Études",
    is_graduation:    true,
    default_programme:"Cycle Secondaire — Diplôme National de Fin d'Études",
    display_order:    1,
  },
  {
    name:             'Attestation de Réussite',
    is_graduation:    true,
    default_programme:'Réussite aux Examens Officiels et au Cycle Académique',
    display_order:    2,
  },
  {
    name:             'Certificat de Scolarité',
    is_graduation:    false,
    default_programme:'Scolarité régulière — Année académique en cours',
    display_order:    3,
  },
  {
    name:             'Attestation de Présence',
    is_graduation:    false,
    default_programme:'Présence régulière et assiduité aux cours',
    display_order:    4,
  },
  {
    name:             'Lettre de Bonne Conduite',
    is_graduation:    false,
    default_programme:'Comportement exemplaire durant toute la scolarité',
    display_order:    5,
  },
  {
    name:             'Certificat de Comportement',
    is_graduation:    false,
    default_programme:'Conduite irréprochable et respect du règlement intérieur',
    display_order:    6,
  },
  {
    name:             'Lettre de Recommandation',
    is_graduation:    false,
    default_programme:'Excellence académique, qualités personnelles et professionnelles',
    display_order:    7,
  },
];

// ─── Mentions ─────────────────────────────────────────────────────────────────
const MENTIONS = [
  { name: 'Très Bien avec Félicitations', min_average: 18, display_order: 1 },
  { name: 'Très Bien',                    min_average: 16, display_order: 2 },
  { name: 'Bien',                         min_average: 14, display_order: 3 },
  { name: 'Assez Bien',                   min_average: 12, display_order: 4 },
  { name: 'Passable',                     min_average: 10, display_order: 5 },
];

async function seed() {
  await client.connect();
  console.log('Connected to database: cscomplexe_strapi\n');

  // ── Check tables exist ────────────────────────────────────────────────────
  const tableCheck = await client.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN ('certificate_types', 'certificate_mentions', 'certificates')
    ORDER BY table_name;
  `);

  const tables = tableCheck.rows.map(r => r.table_name);
  console.log('Tables found:', tables.join(', ') || 'NONE');

  if (!tables.includes('certificate_types') || !tables.includes('certificate_mentions')) {
    console.error('\n❌ Tables not found! Please restart Strapi first so it creates the tables, then run this script again.');
    console.error('   Command: cd C:\\Users\\pc\\CSCOMPLEXES\\strapicms && npm run develop');
    await client.end();
    process.exit(1);
  }

  // ── Seed Certificate Types ────────────────────────────────────────────────
  console.log('\n── Seeding Certificate Types ──────────────────────────────────');
  let typesInserted = 0, typesSkipped = 0;

  for (const t of CERT_TYPES) {
    const exists = await client.query(
      'SELECT id FROM certificate_types WHERE name = $1',
      [t.name]
    );
    if (exists.rows.length > 0) {
      console.log(`  ⊙ Skipped (exists): ${t.name}`);
      typesSkipped++;
      continue;
    }

    await client.query(`
      INSERT INTO certificate_types
        (name, is_graduation, default_programme, display_order, created_at, updated_at, published_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW(), NOW())
    `, [t.name, t.is_graduation, t.default_programme, t.display_order]);
    console.log(`  ✔ Inserted: ${t.is_graduation ? '🎓' : '📄'} ${t.name}`);
    typesInserted++;
  }
  console.log(`  → ${typesInserted} inserted, ${typesSkipped} skipped\n`);

  // ── Seed Mentions ─────────────────────────────────────────────────────────
  console.log('── Seeding Certificate Mentions ────────────────────────────────');
  let mentInserted = 0, mentSkipped = 0;

  for (const m of MENTIONS) {
    const exists = await client.query(
      'SELECT id FROM certificate_mentions WHERE name = $1',
      [m.name]
    );
    if (exists.rows.length > 0) {
      console.log(`  ⊙ Skipped (exists): ${m.name}`);
      mentSkipped++;
      continue;
    }

    await client.query(`
      INSERT INTO certificate_mentions
        (name, min_average, display_order, created_at, updated_at, published_at)
      VALUES ($1, $2, $3, NOW(), NOW(), NOW())
    `, [m.name, m.min_average, m.display_order]);
    console.log(`  ✔ Inserted: ${m.name} (min: ${m.min_average}/20)`);
    mentInserted++;
  }
  console.log(`  → ${mentInserted} inserted, ${mentSkipped} skipped\n`);

  // ── Summary ───────────────────────────────────────────────────────────────
  const typesCount = await client.query('SELECT COUNT(*) FROM certificate_types');
  const mentCount  = await client.query('SELECT COUNT(*) FROM certificate_mentions');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`✅ Done!  Types: ${typesCount.rows[0].count}  |  Mentions: ${mentCount.rows[0].count}`);
  console.log('   The dropdowns in the Certificates page will now be populated from Strapi.');
  console.log('   You can edit or add more via Strapi Admin → Content-Manager.');

  await client.end();
}

seed().catch(err => {
  console.error('\n❌ Seed failed:', err.message);
  client.end();
  process.exit(1);
});
