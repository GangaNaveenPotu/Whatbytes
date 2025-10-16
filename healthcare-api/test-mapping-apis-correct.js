const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testMappingAPIsCorrect() {
  console.log('🔗 Testing Patient-Doctor Mapping APIs (Corrected)...\n');

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

      // Step 2: Get existing patients and doctors
      console.log('\n2. Getting existing patients and doctors...');
      
      // Get all patients
      const patientsResponse = await axios.get(`${BASE_URL}/api/patients/`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });

      let patientId;
      if (patientsResponse.data.success && patientsResponse.data.data.length > 0) {
        patientId = patientsResponse.data.data[0].id;
        console.log('✅ Found patient with ID:', patientId);
        console.log('👤 Patient name:', patientsResponse.data.data[0].name);
      } else {
        console.log('❌ No patients found');
        return;
      }

      // Get all doctors
      const doctorsResponse = await axios.get(`${BASE_URL}/api/doctors/`);
      let doctorId;
      if (doctorsResponse.data.success && doctorsResponse.data.data.length > 0) {
        doctorId = doctorsResponse.data.data[0].id;
        console.log('✅ Found doctor with ID:', doctorId);
        console.log('👨‍⚕️ Doctor name:', doctorsResponse.data.data[0].name);
      } else {
        console.log('❌ No doctors found');
        return;
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
          console.log('📝 Notes:', assignResponse.data.data.notes);
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
          if (allMappingsResponse.data.data.length > 0) {
            console.log('📋 Sample mapping:', {
              id: allMappingsResponse.data.data[0].id,
              patient: allMappingsResponse.data.data[0].patient_name,
              doctor: allMappingsResponse.data.data[0].doctor_name,
              assigned_at: allMappingsResponse.data.data[0].assigned_at
            });
          }
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
          console.log('📊 Number of doctors assigned:', patientDoctorsResponse.data.data.length);
          if (patientDoctorsResponse.data.data.length > 0) {
            console.log('👨‍⚕️ Assigned doctors:', patientDoctorsResponse.data.data.map(d => ({
              id: d.id,
              name: d.doctor_name,
              specialization: d.specialization
            })));
          }
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

        console.log('\n🎉 All Patient-Doctor Mapping APIs tested successfully!');

      } else {
        console.log('❌ Could not find patient or doctor for testing');
      }

    } else {
      console.log('❌ Admin login failed:', loginResponse.data);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testMappingAPIsCorrect();
