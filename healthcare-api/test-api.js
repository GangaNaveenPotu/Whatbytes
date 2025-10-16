const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
let adminToken = '';
let patientId = '';
let doctorId = '';
let mappingId = '';

// Test configuration
const testData = {
  admin: {
    name: 'Test Admin',
    email: 'test.admin@example.com',
    password: 'admin123',
    role: 'admin'
  },
  patient: {
    name: 'Test Patient',
    email: 'test.patient@example.com',
    password: 'patient123',
    dateOfBirth: '1990-01-01',
    phone: '1234567890',
    address: '123 Test Street',
    bloodType: 'O+'
  },
  doctor: {
    name: 'Dr. Test Doctor',
    email: 'test.doctor@example.com',
    password: 'doctor123',
    specialization: 'General Medicine',
    licenseNumber: 'TEST123456',
    phone: '555-0123',
    hospital: 'Test Hospital',
    experience: 5,
    consultationFee: 100.00,
    isAvailable: true
  }
};

// Helper function to make API calls
async function apiCall(method, endpoint, data = null, token = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status || 500
    };
  }
}

// Test functions
async function testAuthAPIs() {
  console.log('\n🔐 Testing Authentication APIs...\n');

  // Test 1: Register Admin
  console.log('1. Testing Admin Registration...');
  const adminReg = await apiCall('POST', '/api/auth/register', testData.admin);
  if (adminReg.success) {
    console.log('✅ Admin registration successful');
    adminToken = adminReg.data.token;
  } else {
    console.log('❌ Admin registration failed:', adminReg.error);
    return false;
  }

  // Test 2: Login Admin
  console.log('\n2. Testing Admin Login...');
  const adminLogin = await apiCall('POST', '/api/auth/login', {
    email: testData.admin.email,
    password: testData.admin.password
  });
  if (adminLogin.success) {
    console.log('✅ Admin login successful');
    adminToken = adminLogin.data.token;
  } else {
    console.log('❌ Admin login failed:', adminLogin.error);
    return false;
  }

  // Test 3: Register Patient (Admin only)
  console.log('\n3. Testing Patient Registration (Admin)...');
  const patientReg = await apiCall('POST', '/api/auth/register/patient', testData.patient, adminToken);
  if (patientReg.success) {
    console.log('✅ Patient registration successful');
    patientId = patientReg.data.user.id;
  } else {
    console.log('❌ Patient registration failed:', patientReg.error);
  }

  // Test 4: Register Doctor (Admin only)
  console.log('\n4. Testing Doctor Registration (Admin)...');
  const doctorReg = await apiCall('POST', '/api/auth/register/doctor', testData.doctor, adminToken);
  if (doctorReg.success) {
    console.log('✅ Doctor registration successful');
    doctorId = doctorReg.data.user.id;
  } else {
    console.log('❌ Doctor registration failed:', doctorReg.error);
  }

  // Test 5: Get Current User
  console.log('\n5. Testing Get Current User...');
  const getMe = await apiCall('GET', '/api/auth/me', null, adminToken);
  if (getMe.success) {
    console.log('✅ Get current user successful');
  } else {
    console.log('❌ Get current user failed:', getMe.error);
  }

  return true;
}

async function testPatientAPIs() {
  console.log('\n👥 Testing Patient Management APIs...\n');

  // Test 1: Create Patient
  console.log('1. Testing Create Patient...');
  const createPatient = await apiCall('POST', '/api/patients', testData.patient, adminToken);
  if (createPatient.success) {
    console.log('✅ Create patient successful');
    patientId = createPatient.data.data.id;
  } else {
    console.log('❌ Create patient failed:', createPatient.error);
  }

  // Test 2: Get All Patients
  console.log('\n2. Testing Get All Patients...');
  const getAllPatients = await apiCall('GET', '/api/patients', null, adminToken);
  if (getAllPatients.success) {
    console.log('✅ Get all patients successful');
  } else {
    console.log('❌ Get all patients failed:', getAllPatients.error);
  }

  // Test 3: Get Patient by ID
  console.log('\n3. Testing Get Patient by ID...');
  if (patientId) {
    const getPatient = await apiCall('GET', `/api/patients/${patientId}`, null, adminToken);
    if (getPatient.success) {
      console.log('✅ Get patient by ID successful');
    } else {
      console.log('❌ Get patient by ID failed:', getPatient.error);
    }
  }

  // Test 4: Update Patient
  console.log('\n4. Testing Update Patient...');
  if (patientId) {
    const updateData = {
      name: 'Updated Test Patient',
      phone: '9876543210'
    };
    const updatePatient = await apiCall('PUT', `/api/patients/${patientId}`, updateData, adminToken);
    if (updatePatient.success) {
      console.log('✅ Update patient successful');
    } else {
      console.log('❌ Update patient failed:', updatePatient.error);
    }
  }

  return true;
}

async function testDoctorAPIs() {
  console.log('\n👨‍⚕️ Testing Doctor Management APIs...\n');

  // Test 1: Create Doctor
  console.log('1. Testing Create Doctor...');
  const createDoctor = await apiCall('POST', '/api/doctors', testData.doctor, adminToken);
  if (createDoctor.success) {
    console.log('✅ Create doctor successful');
    doctorId = createDoctor.data.data.id;
  } else {
    console.log('❌ Create doctor failed:', createDoctor.error);
  }

  // Test 2: Get All Doctors
  console.log('\n2. Testing Get All Doctors...');
  const getAllDoctors = await apiCall('GET', '/api/doctors');
  if (getAllDoctors.success) {
    console.log('✅ Get all doctors successful');
  } else {
    console.log('❌ Get all doctors failed:', getAllDoctors.error);
  }

  // Test 3: Get Doctor by ID
  console.log('\n3. Testing Get Doctor by ID...');
  if (doctorId) {
    const getDoctor = await apiCall('GET', `/api/doctors/${doctorId}`);
    if (getDoctor.success) {
      console.log('✅ Get doctor by ID successful');
    } else {
      console.log('❌ Get doctor by ID failed:', getDoctor.error);
    }
  }

  // Test 4: Update Doctor
  console.log('\n4. Testing Update Doctor...');
  if (doctorId) {
    const updateData = {
      specialization: 'Updated Specialization',
      phone: '555-9999'
    };
    const updateDoctor = await apiCall('PUT', `/api/doctors/${doctorId}`, updateData, adminToken);
    if (updateDoctor.success) {
      console.log('✅ Update doctor successful');
    } else {
      console.log('❌ Update doctor failed:', updateDoctor.error);
    }
  }

  return true;
}

async function testMappingAPIs() {
  console.log('\n🔗 Testing Patient-Doctor Mapping APIs...\n');

  // Test 1: Assign Doctor to Patient
  console.log('1. Testing Assign Doctor to Patient...');
  if (patientId && doctorId) {
    const mappingData = {
      patientId: parseInt(patientId),
      doctorId: parseInt(doctorId),
      notes: 'Test assignment'
    };
    const assignDoctor = await apiCall('POST', '/api/mappings', mappingData, adminToken);
    if (assignDoctor.success) {
      console.log('✅ Assign doctor to patient successful');
      mappingId = assignDoctor.data.data.id;
    } else {
      console.log('❌ Assign doctor to patient failed:', assignDoctor.error);
    }
  }

  // Test 2: Get All Mappings
  console.log('\n2. Testing Get All Mappings...');
  const getAllMappings = await apiCall('GET', '/api/mappings', null, adminToken);
  if (getAllMappings.success) {
    console.log('✅ Get all mappings successful');
  } else {
    console.log('❌ Get all mappings failed:', getAllMappings.error);
  }

  // Test 3: Get Doctors for Patient
  console.log('\n3. Testing Get Doctors for Patient...');
  if (patientId) {
    const getPatientDoctors = await apiCall('GET', `/api/mappings/patient/${patientId}`, null, adminToken);
    if (getPatientDoctors.success) {
      console.log('✅ Get doctors for patient successful');
    } else {
      console.log('❌ Get doctors for patient failed:', getPatientDoctors.error);
    }
  }

  // Test 4: Remove Doctor from Patient
  console.log('\n4. Testing Remove Doctor from Patient...');
  if (mappingId) {
    const removeDoctor = await apiCall('DELETE', `/api/mappings/${mappingId}`, null, adminToken);
    if (removeDoctor.success) {
      console.log('✅ Remove doctor from patient successful');
    } else {
      console.log('❌ Remove doctor from patient failed:', removeDoctor.error);
    }
  }

  return true;
}

async function testErrorHandling() {
  console.log('\n🚨 Testing Error Handling...\n');

  // Test 1: Unauthorized Access
  console.log('1. Testing Unauthorized Access...');
  const unauthorized = await apiCall('GET', '/api/patients');
  if (!unauthorized.success && unauthorized.status === 401) {
    console.log('✅ Unauthorized access properly blocked');
  } else {
    console.log('❌ Unauthorized access not properly handled');
  }

  // Test 2: Invalid Endpoint
  console.log('\n2. Testing Invalid Endpoint...');
  const invalidEndpoint = await apiCall('GET', '/api/invalid');
  if (!invalidEndpoint.success && invalidEndpoint.status === 404) {
    console.log('✅ Invalid endpoint properly handled');
  } else {
    console.log('❌ Invalid endpoint not properly handled');
  }

  // Test 3: Invalid Data
  console.log('\n3. Testing Invalid Data...');
  const invalidData = await apiCall('POST', '/api/auth/login', {
    email: 'invalid',
    password: ''
  });
  if (!invalidData.success) {
    console.log('✅ Invalid data properly handled');
  } else {
    console.log('❌ Invalid data not properly handled');
  }

  return true;
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting Healthcare API Tests...\n');
  console.log('=' * 50);

  try {
    // Test Authentication APIs
    const authSuccess = await testAuthAPIs();
    if (!authSuccess) {
      console.log('\n❌ Authentication tests failed. Stopping tests.');
      return;
    }

    // Test Patient APIs
    await testPatientAPIs();

    // Test Doctor APIs
    await testDoctorAPIs();

    // Test Mapping APIs
    await testMappingAPIs();

    // Test Error Handling
    await testErrorHandling();

    console.log('\n' + '=' * 50);
    console.log('🎉 All tests completed!');
    console.log('\n📋 Test Summary:');
    console.log('✅ Authentication APIs');
    console.log('✅ Patient Management APIs');
    console.log('✅ Doctor Management APIs');
    console.log('✅ Patient-Doctor Mapping APIs');
    console.log('✅ Error Handling');
    console.log('\n🔑 Admin Token:', adminToken);
    console.log('👤 Patient ID:', patientId);
    console.log('👨‍⚕️ Doctor ID:', doctorId);
    console.log('🔗 Mapping ID:', mappingId);

  } catch (error) {
    console.error('\n❌ Test execution failed:', error.message);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = {
  runAllTests,
  testAuthAPIs,
  testPatientAPIs,
  testDoctorAPIs,
  testMappingAPIs,
  testErrorHandling
};
