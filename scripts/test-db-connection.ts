import { AppDataSource } from '../src/database/data-source';

async function testConnection() {
  console.log('🔍 Testing database connection...\n');

  console.log('Configuration:');
  console.log('- Host:', process.env.DB_HOST || 'localhost');
  console.log('- Port:', process.env.DB_PORT || 5432);
  console.log('- Database:', process.env.DB_NAME || 'test_db');
  console.log('- Username:', process.env.DB_USERNAME || 'postgres');
  console.log('- SSL Enabled:', AppDataSource.options.ssl ? 'Yes' : 'No');
  console.log('- Environment:', process.env.NODE_ENV || 'development');
  console.log('');

  try {
    console.log('⏳ Connecting...');
    await AppDataSource.initialize();

    console.log('✅ Database connected successfully!\n');

    // Test query
    const result = await AppDataSource.query('SELECT version()');
    console.log('PostgreSQL Version:', result[0].version);

    // Check if tables exist
    const tables = await AppDataSource.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);

    console.log('\n📋 Tables in database:');
    if (tables.length === 0) {
      console.log('  (No tables yet)');
    } else {
      tables.forEach((table: any) => {
        console.log(`  - ${table.tablename}`);
      });
    }

    // Check migrations
    try {
      const migrations = await AppDataSource.query(
        'SELECT * FROM migrations ORDER BY timestamp DESC',
      );
      console.log('\n🔄 Migrations run:', migrations.length);
      migrations.forEach((m: any) => {
        console.log(`  - ${m.name} (${new Date(m.timestamp).toISOString()})`);
      });
    } catch (err) {
      console.log('\n⚠️  No migrations table found (run migrations first)');
    }

    await AppDataSource.destroy();
    console.log('\n✅ Connection test completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Database connection failed!');
    console.error('Error:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Check if PostgreSQL is running');
    console.error('2. Verify database credentials in .env file');
    console.error('3. Ensure database exists: createdb test_db');
    console.error('4. Check firewall/security group settings');
    process.exit(1);
  }
}

testConnection();
