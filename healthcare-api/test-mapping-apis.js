const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testMappingAPIs() {
  console.log('🔗 Testing Patient-Doctor Mapping APIs...\n');

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

      // Step 2: Create a patient and doctor for testing
      console.log('\n2. Creating test patient and doctor...');
      
      // Create patient
      const patientData = {
        name: 'Test Patient',
        email: 'test.patient@example.com',
        password: 'patient123',
        dateOfBirth: '1990-01-01',
        phone: '1234567890',
        address: '123 Test Street',
        bloodType: 'O+'
      };

      const patientResponse = await axios.post(`${BASE_URL}/api/auth/register/patient`, patientData, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });

      let patientId;
      if (patientResponse.data.success) {
        console.log('✅ Patient created successfully');
        patientId = patientResponse.data.user.id;
      }

      // Create doctor
      const doctorData = {
        name: 'Dr. Test Doctor',
        email: 'test.doctor@example.com',
        password: 'doctor123',
        specialization: 'General Medicine',
        licenseNumber: 'TEST123456',
        phone: '+14155559999',
        isAvailable: true
      };

      const doctorResponse = await axios.post(`${BASE_URL}/api/doctors/`, doctorData, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });

      let doctorId;
      if (doctorResponse.data.success) {
        console.log('✅ Doctor created successfully');
        doctorId = doctorResponse.data.data.id;
      }

      if (patientId && doctorId) {
        // Step 3: Test POST /api/mappings/ (Assign doctor to patient)
        console.log('\n3. Testing POST /api/mappings/ (Assign doctor to patient)...');
        const mappingData = {
          patientId: patientId,
          doctorId: doctorId,
          notes: 'Initial consultation assignment'
        };

        const assignResponse = await axios.post(`${BASE_URL}/api/mappings/`, mappingData, {
          headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
          }
        });

        let mappingId;
        if (assignResponse.data.success) {
          console.log('✅ Doctor assigned to patient successfully');
          mappingId = assignResponse.data.data.id;
          console.log('🔗 Mapping ID:', mappingId);
        } else {
          console.log('❌ Failed to assign doctor to patient:', assignResponse.data);
        }

        // Step 4: Test GET /api/mappings/ (Get all mappings)
        console.log('\n4. Testing GET /api/mappings/ (Get all mappings)...');
        const allMappingsResponse = await axios.get(`${BASE_URL}/api/mappings/`, {
          headers: {
            'Authorization': `Bearer ${adminToken}`
          }
        });

        if (allMappingsResponse.data.success) {
          console.log('✅ Retrieved all mappings successfully');
          console.log('📊 Total mappings:', allMappingsResponse.data.data.length);
          console.log('📋 Mappings:', allMappingsResponse.data.data.map(m => ({
            id: m.id,
            patient: m.patient_name,
            doctor: m.doctor_name,
            assigned_at: m.assigned_at
          })));
        } else {
          console.log('❌ Failed to retrieve mappings:', allMappingsResponse.data);
        }

        // Step 5: Test GET /api/mappings/patient/:patientId (Get doctors for specific patient)
        console.log('\n5. Testing GET /api/mappings/patient/:patientId...');
        const patientDoctorsResponse = await axios.get(`${BASE_URL}/api/mappings/patient/${patientId}`, {
          headers: {
            'Authorization': `Bearer ${adminToken}`
          }
        });

        if (patientDoctorsResponse.data.success) {
          console.log('✅ Retrieved doctors for patient successfully');
          console.log('👨‍⚕️ Doctors assigned to patient:', patientDoctorsResponse.data.data.map(d => ({
            id: d.id,
            name: d.doctor_name,
            specialization: d.specialization
          })));
        } else {
          console.log('❌ Failed to retrieve doctors for patient:', patientDoctorsResponse.data);
        }

        // Step 6: Test DELETE /api/mappings/:id (Remove doctor from patient)
        if (mappingId) {
          console.log('\n6. Testing DELETE /api/mappings/:id (Remove doctor from patient)...');
          const removeResponse = await axios.delete(`${BASE_URL}/api/mappings/${mappingId}`, {
            headers: {
              'Authorization': `Bearer ${adminToken}`
            }
          });

          if (removeResponse.data.success) {
            console.log('✅ Doctor removed from patient successfully');
            console.log('🗑️ Message:', removeResponse.data.message);
          } else {
            console.log('❌ Failed to remove doctor from patient:', removeResponse.data);
          }

          // Step 7: Verify removal
          console.log('\n7. Verifying doctor removal...');
          const verifyResponse = await axios.get(`${BASE_URL}/api/mappings/patient/${patientId}`, {
            headers: {
              'Authorization': `Bearer ${adminToken}`
            }
          });

          if (verifyResponse.data.success) {
            console.log('✅ Verification successful');
            console.log('📊 Doctors remaining for patient:', verifyResponse.data.data.length);
          }
        }

      } else {
        console.log('❌ Failed to create patient or doctor for testing');
      }

    } else {
      console.log('❌ Admin login failed:', loginResponse.data);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testMappingAPIs();
