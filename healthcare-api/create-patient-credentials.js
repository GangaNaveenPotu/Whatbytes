const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function createPatientCredentials() {
  console.log('👥 Creating Patient Credentials...\n');

  try {
    // Step 1: Login as existing admin
    console.log('1. Logging in as admin...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'test.admin@example.com',
      password: 'admin123'
    });

    if (loginResponse.data.success) {
      console.log('✅ Admin login successful');
      const adminToken = loginResponse.data.token;

      // Step 2: Create multiple patients
      const patients = [
        {
          name: 'Alice Johnson',
          email: 'alice.johnson@example.com',
          password: 'alice123',
          dateOfBirth: '1985-03-15',
          phone: '555-0101',
          address: '123 Oak Street, City',
          bloodType: 'A+'
        },
        {
          name: 'Bob Smith',
          email: 'bob.smith@example.com',
          password: 'bob123',
          dateOfBirth: '1990-07-22',
          phone: '555-0102',
          address: '456 Pine Avenue, Town',
          bloodType: 'B+'
        },
        {
          name: 'Carol Davis',
          email: 'carol.davis@example.com',
          password: 'carol123',
          dateOfBirth: '1988-11-08',
          phone: '555-0103',
          address: '789 Maple Drive, Village',
          bloodType: 'O+'
        },
        {
          name: 'David Wilson',
          email: 'david.wilson@example.com',
          password: 'david123',
          dateOfBirth: '1992-01-30',
          phone: '555-0104',
          address: '321 Elm Street, Borough',
          bloodType: 'AB+'
        },
        {
          name: 'Emma Brown',
          email: 'emma.brown@example.com',
          password: 'emma123',
          dateOfBirth: '1987-09-14',
          phone: '555-0105',
          address: '654 Cedar Lane, Hamlet',
          bloodType: 'A-'
        }
      ];

      console.log('\n2. Creating patients...');
      const createdPatients = [];

      for (let i = 0; i < patients.length; i++) {
        const patient = patients[i];
        console.log(`   Creating patient ${i + 1}: ${patient.name}...`);
        
        try {
          const response = await axios.post(`${BASE_URL}/api/auth/register/patient`, patient, {
            headers: {
              'Authorization': `Bearer ${adminToken}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.data.success) {
            console.log(`   ✅ ${patient.name} created successfully`);
            createdPatients.push({
              ...patient,
              id: response.data.user.id
            });
          } else {
            console.log(`   ❌ Failed to create ${patient.name}:`, response.data.message);
          }
        } catch (error) {
          console.log(`   ❌ Error creating ${patient.name}:`, error.response?.data?.message || error.message);
        }
      }

      // Step 3: Display all patient credentials
      console.log('\n📋 PATIENT CREDENTIALS FOR TESTING:');
      console.log('=' * 60);
      
      createdPatients.forEach((patient, index) => {
        console.log(`\n${index + 1}. ${patient.name}`);
        console.log(`   Email: ${patient.email}`);
        console.log(`   Password: ${patient.password}`);
        console.log(`   Role: patient`);
        console.log(`   ID: ${patient.id}`);
        console.log(`   Blood Type: ${patient.bloodType}`);
        console.log(`   Phone: ${patient.phone}`);
      });

      console.log('\n' + '=' * 60);
      console.log('🔐 LOGIN TEST COMMANDS:');
      console.log('=' * 60);
      
      createdPatients.forEach((patient, index) => {
        console.log(`\n# Test ${index + 1}: Login as ${patient.name}`);
        console.log(`POST http://localhost:3000/api/auth/login`);
        console.log(`Content-Type: application/json`);
        console.log(`{`);
        console.log(`  "email": "${patient.email}",`);
        console.log(`  "password": "${patient.password}"`);
        console.log(`}`);
      });

      console.log('\n' + '=' * 60);
      console.log('✅ Patient credentials created successfully!');
      console.log(`📊 Total patients created: ${createdPatients.length}`);

    } else {
      console.log('❌ Admin login failed:', loginResponse.data);
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

// Run the script
createPatientCredentials();
