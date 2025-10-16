# Healthcare API Documentation

## Overview
A comprehensive Node.js healthcare backend API built with Express.js, PostgreSQL, and JWT authentication. This API provides complete functionality for managing patients, doctors, and their relationships in a healthcare system.

## Tech Stack
- **Backend**: Node.js with Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: express-validator
- **Environment**: dotenv

## Base URL
```
http://localhost:3000
```

## Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## 1. Authentication APIs

### Register Admin User
**POST** `/api/auth/register`

Register a new admin user (for initial setup).

**Request Body:**
```json
{
  "name": "Admin User",
  "email": "admin@example.com",
  "password": "admin123",
  "role": "admin"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "Admin User",
    "email": "admin@example.com",
    "role": "admin"
  }
}
```

### Login User
**POST** `/api/auth/login`

Authenticate a user and receive a JWT token.

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "Admin User",
    "email": "admin@example.com",
    "role": "admin"
  }
}
```

### Register Patient (Admin Only)
**POST** `/api/auth/register/patient`

Create a new patient account (requires admin authentication).

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "John Patient",
  "email": "john.patient@example.com",
  "password": "patient123",
  "dateOfBirth": "1985-05-15",
  "phone": "9876543210",
  "address": "456 Health Street",
  "bloodType": "A+"
}
```

### Register Doctor (Admin Only)
**POST** `/api/auth/register/doctor`

Create a new doctor account (requires admin authentication).

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Dr. Michael Smith",
  "email": "dr.michael.smith@example.com",
  "password": "doctor123",
  "specialization": "Cardiology",
  "licenseNumber": "DOC123456",
  "phone": "555-0123",
  "isAvailable": true
}
```

### Get Current User
**GET** `/api/auth/me`

Get details of the currently authenticated user.

**Headers:**
```
Authorization: Bearer <token>
```

---

## 2. Patient Management APIs

### Create Patient
**POST** `/api/patients/`

Add a new patient (Admin only).

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Jane Patient",
  "email": "jane.patient@example.com",
  "password": "secret123",
  "dateOfBirth": "1990-01-01",
  "phone": "1234567890",
  "address": "123 Main Street",
  "bloodType": "O+"
}
```

### Get All Patients
**GET** `/api/patients/`

Retrieve all patients (Admin sees all, others see only their own).

**Headers:**
```
Authorization: Bearer <token>
```

### Get Patient by ID
**GET** `/api/patients/:id`

Get details of a specific patient.

**Headers:**
```
Authorization: Bearer <token>
```

### Update Patient
**PUT** `/api/patients/:id`

Update patient details.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Jane Updated",
  "phone": "9876543210",
  "address": "456 Updated Street"
}
```

### Delete Patient
**DELETE** `/api/patients/:id`

Delete a patient record (Admin only).

**Headers:**
```
Authorization: Bearer <admin_token>
```

---

## 3. Doctor Management APIs

### Create Doctor
**POST** `/api/doctors/`

Add a new doctor (Admin only).

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Dr. Sarah Johnson",
  "email": "dr.sarah.johnson@example.com",
  "password": "password456",
  "specialization": "Pediatrics",
  "licenseNumber": "DOC789012",
  "phone": "555-0456",
  "hospital": "Children's Medical Center",
  "experience": 8,
  "consultationFee": 120.50,
  "isAvailable": true
}
```

### Get All Doctors
**GET** `/api/doctors/`

Retrieve all doctors (Public endpoint).

### Get Doctor by ID
**GET** `/api/doctors/:id`

Get details of a specific doctor (Public endpoint).

### Update Doctor
**PUT** `/api/doctors/:id`

Update doctor details (Admin only).

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

### Delete Doctor
**DELETE** `/api/doctors/:id`

Delete a doctor record (Admin only).

**Headers:**
```
Authorization: Bearer <admin_token>
```

---

## 4. Patient-Doctor Mapping APIs

### Assign Doctor to Patient
**POST** `/api/mappings/`

Assign a doctor to a patient (Admin only).

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "patientId": 1,
  "doctorId": 1,
  "notes": "Initial consultation"
}
```

### Get All Mappings
**GET** `/api/mappings/`

Retrieve all patient-doctor mappings (Admin only).

**Headers:**
```
Authorization: Bearer <admin_token>
```

### Get Doctors for Patient
**GET** `/api/mappings/patient/:patientId`

Get all doctors assigned to a specific patient.

**Headers:**
```
Authorization: Bearer <token>
```

### Remove Doctor from Patient
**DELETE** `/api/mappings/:mappingId`

Remove a doctor from a patient (Admin only).

**Headers:**
```
Authorization: Bearer <admin_token>
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "msg": "Name is required",
      "param": "name",
      "location": "body"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Access denied. No token provided."
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Access denied. Admin role required."
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Patient not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Server error during registration",
  "error": "Detailed error message in development"
}
```

---

## Database Schema

### Users Table
- `id` (Primary Key)
- `name` (VARCHAR)
- `email` (VARCHAR, UNIQUE)
- `password` (VARCHAR, HASHED)
- `role` (VARCHAR: 'admin', 'patient', 'doctor')
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### Patients Table
- `id` (Primary Key)
- `user_id` (Foreign Key to Users)
- `date_of_birth` (DATE)
- `phone` (VARCHAR)
- `address` (TEXT)
- `blood_type` (VARCHAR)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### Doctors Table
- `id` (Primary Key)
- `user_id` (Foreign Key to Users)
- `specialization` (VARCHAR)
- `license_number` (VARCHAR, UNIQUE)
- `phone` (VARCHAR)
- `is_available` (BOOLEAN)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### Patient-Doctor Mapping Table
- `id` (Primary Key)
- `patient_id` (Foreign Key to Patients)
- `doctor_id` (Foreign Key to Doctors)
- `assigned_at` (TIMESTAMP)
- `is_active` (BOOLEAN)
- `notes` (TEXT)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

---

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Set up Environment Variables
Create a `.env` file:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=healthcare_db
DB_USER=your_username
DB_PASSWORD=your_password
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=24h
PORT=3000
NODE_ENV=development
```

### 3. Set up Database
Run the SQL schema from `database/schema.sql` in your PostgreSQL database.

### 4. Start the Server
```bash
npm run dev
```

### 5. Test the API
Use the provided credentials or create new ones using the registration endpoints.

---

## Sample Workflow

1. **Create Admin User**
   ```bash
   POST /api/auth/register
   ```

2. **Login as Admin**
   ```bash
   POST /api/auth/login
   ```

3. **Create Patients and Doctors**
   ```bash
   POST /api/auth/register/patient
   POST /api/auth/register/doctor
   ```

4. **Assign Doctors to Patients**
   ```bash
   POST /api/mappings/
   ```

5. **Manage Records**
   ```bash
   GET /api/patients/
   GET /api/doctors/
   PUT /api/patients/:id
   DELETE /api/doctors/:id
   ```

---

## Security Features

- ✅ JWT Authentication
- ✅ Password Hashing (bcrypt)
- ✅ Role-based Access Control
- ✅ Input Validation
- ✅ SQL Injection Prevention
- ✅ CORS Configuration
- ✅ Environment Variables for Secrets

---

## Testing

All endpoints can be tested using:
- Postman
- Thunder Client (VS Code extension)
- curl commands
- Any REST API client

The API includes comprehensive error handling and validation for robust operation.
