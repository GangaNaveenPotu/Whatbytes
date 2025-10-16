const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testCompletePatientRegistration() {
  console.log('🧪 Complete Patient Registration Test...\n');

  try {
    // Step 1: Create admin user first
    console.log('1. Creating admin user...');
    const adminData = {
      name: 'Test Admin',
      email: 'test.admin@example.com',
      password: 'admin123',
      role: 'admin'
    };

    const adminResponse = await axios.post(`${BASE_URL}/api/auth/register`, adminData);
    
    if (adminResponse.data.success) {
      console.log('✅ Admin user created successfully!');
      const adminToken = adminResponse.data.token;
      console.log('🔑 Admin token:', adminToken.substring(0, 50) + '...');

      // Step 2: Register a patient using admin token
      console.log('\n2. Registering a new patient...');
      const patientData = {
        name: 'John Patient',
        email: 'john.patient@example.com',
        password: 'patient123',
        dateOfBirth: '1990-01-01',
        phone: '1234567890',
        address: '123 Main Street',
        bloodType: 'O+'
      };

      const patientResponse = await axios.post(`${BASE_URL}/api/auth/register/patient`, patientData, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (patientResponse.data.success) {
        console.log('✅ Patient registration successful!');
        console.log('👤 Patient details:', patientResponse.data.user);
      } else {
        console.log('❌ Patient registration failed:', patientResponse.data);
      }

      // Step 3: Test direct patient creation
      console.log('\n3. Testing direct patient creation...');
      const directPatientData = {
        name: 'Jane Patient',
        email: 'jane.patient@example.com',
        password: 'patient456',
        dateOfBirth: '1985-05-15',
        phone: '9876543210',
        address: '456 Oak Street',
        bloodType: 'A+'
      };

      const directResponse = await axios.post(`${BASE_URL}/api/patients/`, directPatientData, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (directResponse.data.success) {
        console.log('✅ Direct patient creation successful!');
        console.log('👤 Patient ID:', directResponse.data.data.id);
        console.log('👤 Patient Name:', directResponse.data.data.name);
      } else {
        console.log('❌ Direct patient creation failed:', directResponse.data);
      }

      // Step 4: Get all patients
      console.log('\n4. Retrieving all patients...');
      const patientsResponse = await axios.get(`${BASE_URL}/api/patients/`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });

      if (patientsResponse.data.success) {
        console.log('✅ Retrieved patients successfully!');
        console.log('📊 Total patients:', patientsResponse.data.data.length);
        console.log('👥 Patients:');
        patientsResponse.data.data.forEach((patient, index) => {
          console.log(`   ${index + 1}. ID: ${patient.id}, Name: ${patient.name}, Email: ${patient.email}`);
        });
      } else {
        console.log('❌ Failed to retrieve patients:', patientsResponse.data);
      }

      // Step 5: Test patient login
      console.log('\n5. Testing patient login...');
      const patientLoginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: 'john.patient@example.com',
        password: 'patient123'
      });

      if (patientLoginResponse.data.success) {
        console.log('✅ Patient login successful!');
        console.log('👤 Patient role:', patientLoginResponse.data.user.role);
      } else {
        console.log('❌ Patient login failed:', patientLoginResponse.data);
      }

    } else {
      console.log('❌ Admin creation failed:', adminResponse.data);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('Error details:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Run the test
testCompletePatientRegistration();