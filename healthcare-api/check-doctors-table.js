const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'healthcare_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password'
});

async function checkDoctorsTable() {
  const client = await pool.connect();
  try {
    console.log('🔍 Checking doctors table structure...\n');
    
    // Get table structure
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'doctors' 
      ORDER BY ordinal_position;
    `);
    
    if (result.rows.length === 0) {
      console.log('❌ Doctors table does not exist!');
      return;
    }
    
    console.log('📋 Doctors table columns:');
    console.log('=' * 50);
    result.rows.forEach(row => {
      console.log(`- ${row.column_name} (${row.data_type}) - Nullable: ${row.is_nullable} - Default: ${row.column_default || 'None'}`);
    });
    
    // Check if is_available column exists
    const hasIsAvailable = result.rows.some(row => row.column_name === 'is_available');
    console.log(`\n✅ is_available column exists: ${hasIsAvailable}`);
    
    if (!hasIsAvailable) {
      console.log('\n🔧 Adding is_available column...');
      await client.query(`
        ALTER TABLE doctors 
        ADD COLUMN is_available BOOLEAN DEFAULT true;
      `);
      console.log('✅ is_available column added successfully!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkDoctorsTable();
