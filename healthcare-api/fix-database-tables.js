const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'healthcare_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password'
});

async function fixDatabaseTables() {
  const client = await pool.connect();
  try {
    console.log('🔧 Fixing database tables...\n');
    
    // Check if patient_doctor_mapping table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'patient_doctor_mapping'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('📋 Creating patient_doctor_mapping table...');
      await client.query(`
        CREATE TABLE patient_doctor_mapping (
          id SERIAL PRIMARY KEY,
          patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
          doctor_id INTEGER NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
          assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, 
          is_active BOOLEAN DEFAULT true,
          notes TEXT,
          UNIQUE(patient_id, doctor_id),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_patient_doctor_mapping 
        ON patient_doctor_mapping(patient_id, doctor_id);
      `);
      
      console.log('✅ patient_doctor_mapping table created successfully!');
    } else {
      console.log('✅ patient_doctor_mapping table already exists');
    }
    
    // Check if is_available column exists in doctors table
    const columnCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'doctors' AND column_name = 'is_available'
      );
    `);
    
    if (!columnCheck.rows[0].exists) {
      console.log('📋 Adding is_available column to doctors table...');
      await client.query(`
        ALTER TABLE doctors 
        ADD COLUMN is_available BOOLEAN DEFAULT true;
      `);
      console.log('✅ is_available column added successfully!');
    } else {
      console.log('✅ is_available column already exists');
    }
    
    console.log('\n🎉 Database tables fixed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

fixDatabaseTables();
