const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testDoctorOperations() {
  console.log('🧪 Testing Doctor PUT and DELETE Operations...\n');

  try {
    // Step 1: Login as admin
    console.log('1. Logging in as admin...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'test.admin@example.com',
      password: 'admin123'
    });

    if (loginResponse.data.success) {
      console.log('✅ Admin login successful');
      const adminToken = loginResponse.data.token;

      // Step 2: Create a doctor firstimage.png
      console.log('\n2. Creating a test doctor...');
      const doctorData = {
        name: 'Dr. Test Doctor',
        email: 'test.doctor@healthcare.com',
        password: 'test123',
        specialization: 'General Medicine',
        licenseNumber: 'TEST123456',
        phone: '+14155559999'
      };

      const createResponse = await axios.post(`${BASE_URL}/api/doctors/`, doctorData, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (createResponse.data.success) {
        console.log('✅ Doctor created successfully');
        const doctorId = createResponse.data.data.id;
        console.log(`👨‍⚕️ Doctor ID: ${doctorId}`);

        // Step 3: Test PUT (Update) operation
        console.log('\n3. Testing PUT operation...');
        const updateData = {
          name: 'Dr. Updated Test Doctor',
          specialization: 'Updated Specialization',
          phone: '+14155558888'
        };

        const updateResponse = await axios.put(`${BASE_URL}/api/doctors/${doctorId}`, updateData, {
          headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (updateResponse.data.success) {
          console.log('✅ Doctor updated successfully');
          console.log('📝 Updated data:', updateResponse.data.data);
        } else {
          console.log('❌ Doctor update failed:', updateResponse.data);
        }

        // Step 4: Test DELETE operation
        console.log('\n4. Testing DELETE operation...');
        const deleteResponse = await axios.delete(`${BASE_URL}/api/doctors/${doctorId}`, {
          headers: {
            'Authorization': `Bearer ${adminToken}`
          }
        });

        if (deleteResponse.data.success) {
          console.log('✅ Doctor deleted successfully');
          console.log('🗑️ Message:', deleteResponse.data.message);
        } else {
          console.log('❌ Doctor deletion failed:', deleteResponse.data);
        }

        // Step 5: Verify doctor is deleted
        console.log('\n5. Verifying doctor is deleted...');
        try {
          const getResponse = await axios.get(`${BASE_URL}/api/doctors/${doctorId}`);
          console.log('❌ Doctor still exists (should be deleted)');
        } catch (error) {
          if (error.response?.status === 404) {
            console.log('✅ Doctor successfully deleted (404 Not Found)');
          } else {
            console.log('❌ Unexpected error:', error.response?.data);
          }
        }

      } else {
        console.log('❌ Doctor creation failed:', createResponse.data);
      }

    } else {
      console.log('❌ Admin login failed:', loginResponse.data);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testDoctorOperations();
