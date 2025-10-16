const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function createDoctorCredentials() {
  console.log('👨‍⚕️ Creating Doctor Credentials...\n');

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

      // Step 2: Create multiple doctors
      const doctors = [
        {
          name: 'Dr. Sarah Johnson',
          email: 'sarah.johnson@healthcare.com',
          password: 'sarah123',
          specialization: 'Cardiology',
          licenseNumber: 'MD12345678',
          phone: '+14155551234',
          isAvailable: true
        },
        {
          name: 'Dr. Michael Chen',
          email: 'michael.chen@healthcare.com',
          password: 'michael123',
          specialization: 'Neurology',
          licenseNumber: 'MD23456789',
          phone: '+14155552345',
          isAvailable: true
        },
        {
          name: 'Dr. Emily Rodriguez',
          email: 'emily.rodriguez@healthcare.com',
          password: 'emily123',
          specialization: 'Pediatrics',
          licenseNumber: 'MD34567890',
          phone: '+14155553456',
          isAvailable: true
        },
        {
          name: 'Dr. David Kim',
          email: 'david.kim@healthcare.com',
          password: 'david123',
          specialization: 'Orthopedics',
          licenseNumber: 'MD45678901',
          phone: '+14155554567',
          isAvailable: true
        },
        {
          name: 'Dr. Lisa Thompson',
          email: 'lisa.thompson@healthcare.com',
          password: 'lisa123',
          specialization: 'Dermatology',
          licenseNumber: 'MD56789012',
          phone: '+14155555678',
          isAvailable: true
        },
        {
          name: 'Dr. Robert Wilson',
          email: 'robert.wilson@healthcare.com',
          password: 'robert123',
          specialization: 'Oncology',
          licenseNumber: 'MD67890123',
          phone: '+14155556789',
          isAvailable: false
        }
      ];

      console.log('\n2. Creating doctors...');
      const createdDoctors = [];

      for (let i = 0; i < doctors.length; i++) {
        const doctor = doctors[i];
        console.log(`   Creating doctor ${i + 1}: ${doctor.name}...`);
        
        try {
          const response = await axios.post(`${BASE_URL}/api/doctors/`, doctor, {
            headers: {
              'Authorization': `Bearer ${adminToken}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.data.success) {
            console.log(`   ✅ ${doctor.name} created successfully`);
            createdDoctors.push({
              ...doctor,
              id: response.data.data.id
            });
          } else {
            console.log(`   ❌ Failed to create ${doctor.name}:`, response.data.message);
          }
        } catch (error) {
          console.log(`   ❌ Error creating ${doctor.name}:`, error.response?.data?.message || error.message);
        }
      }

      // Step 3: Display all doctor credentials
      console.log('\n📋 DOCTOR CREDENTIALS FOR TESTING:');
      console.log('=' * 60);
      
      createdDoctors.forEach((doctor, index) => {
        console.log(`\n${index + 1}. ${doctor.name}`);
        console.log(`   Email: ${doctor.email}`);
        console.log(`   Password: ${doctor.password}`);
        console.log(`   Role: doctor`);
        console.log(`   ID: ${doctor.id}`);
        console.log(`   Specialization: ${doctor.specialization}`);
        console.log(`   License: ${doctor.licenseNumber}`);
        console.log(`   Phone: ${doctor.phone}`);
        console.log(`   Available: ${doctor.isAvailable ? 'Yes' : 'No'}`);
      });

      console.log('\n' + '=' * 60);
      console.log('🔐 LOGIN TEST COMMANDS:');
      console.log('=' * 60);
      
      createdDoctors.forEach((doctor, index) => {
        console.log(`\n# Test ${index + 1}: Login as ${doctor.name}`);
        console.log(`POST http://localhost:3000/api/auth/login`);
        console.log(`Content-Type: application/json`);
        console.log(`{`);
        console.log(`  "email": "${doctor.email}",`);
        console.log(`  "password": "${doctor.password}"`);
        console.log(`}`);
      });

      console.log('\n' + '=' * 60);
      console.log('✅ Doctor credentials created successfully!');
      console.log(`📊 Total doctors created: ${createdDoctors.length}`);

      // Step 4: Test getting all doctors
      console.log('\n3. Testing GET /api/doctors...');
      const doctorsResponse = await axios.get(`${BASE_URL}/api/doctors/`);
      
      if (doctorsResponse.data.success) {
        console.log('✅ Retrieved doctors successfully!');
        console.log('📊 Total doctors in system:', doctorsResponse.data.data.length);
      } else {
        console.log('❌ Failed to retrieve doctors:', doctorsResponse.data);
      }

    } else {
      console.log('❌ Admin login failed:', loginResponse.data);
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

// Run the script
createDoctorCredentials();
