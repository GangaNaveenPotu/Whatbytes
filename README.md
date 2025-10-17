# Healthcare API - Node.js Backend with PostgreSQL

A comprehensive healthcare backend API built with Node.js, Express.js, PostgreSQL, and JWT authentication. This API provides complete functionality for managing patients, doctors, and their relationships in a healthcare system.

## 🚀 Features

- **JWT Authentication** - Secure user authentication and authorization
- **Role-based Access Control** - Admin, Patient, and Doctor roles
- **Patient Management** - Complete CRUD operations for patients
- **Doctor Management** - Complete CRUD operations for doctors
- **Patient-Doctor Mapping** - Assign and manage doctor-patient relationships
- **Input Validation** - Comprehensive validation using express-validator
- **Error Handling** - Robust error handling and responses
- **Database Security** - SQL injection prevention with parameterized queries
- **Environment Configuration** - Secure configuration management

## 🛠️ Tech Stack

- **Backend**: Node.js with Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: express-validator
- **Password Hashing**: bcryptjs
- **Environment**: dotenv
- **CORS**: cors middleware

## 📋 Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd healthcare-api
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=healthcare_db
   DB_USER=your_username
   DB_PASSWORD=your_password
   JWT_SECRET=your_super_secret_jwt_key
   JWT_EXPIRES_IN=24h
   PORT=3000
   NODE_ENV=development
   ```

4. **Set up the database**
   - Create a PostgreSQL database named `healthcare_db`
   - Run the SQL schema from `database/schema.sql` in your database

5. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## 📚 API Documentation

The API provides the following endpoints:

### Authentication APIs
- `POST /api/auth/register` - Register admin user
- `POST /api/auth/login` - Login user
- `POST /api/auth/register/patient` - Register patient (Admin only)
- `POST /api/auth/register/doctor` - Register doctor (Admin only)
- `GET /api/auth/me` - Get current user

### Patient Management APIs
- `POST /api/patients/` - Create patient (Admin only)
- `GET /api/patients/` - Get all patients
- `GET /api/patients/:id` - Get patient by ID
- `PUT /api/patients/:id` - Update patient
- `DELETE /api/patients/:id` - Delete patient (Admin only)

### Doctor Management APIs
- `POST /api/doctors/` - Create doctor (Admin only)
- `GET /api/doctors/` - Get all doctors
- `GET /api/doctors/:id` - Get doctor by ID
- `PUT /api/doctors/:id` - Update doctor (Admin only)
- `DELETE /api/doctors/:id` - Delete doctor (Admin only)

### Patient-Doctor Mapping APIs
- `POST /api/mappings/` - Assign doctor to patient (Admin only)
- `GET /api/mappings/` - Get all mappings (Admin only)
- `GET /api/mappings/patient/:patientId` - Get doctors for patient
- `DELETE /api/mappings/:id` - Remove doctor from patient (Admin only)

For detailed API documentation, see [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

## 🧪 Testing

Run the comprehensive API tests:

```bash
npm test
```

This will test all endpoints and verify:
- Authentication flow
- CRUD operations for patients and doctors
- Patient-doctor mapping functionality
- Error handling
- Authorization and access control

## 📊 Database Schema

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

## 🔐 Security Features

- **JWT Authentication** - Secure token-based authentication
- **Password Hashing** - Bcrypt for secure password storage
- **Role-based Access Control** - Admin, Patient, Doctor roles
- **Input Validation** - Comprehensive validation for all inputs
- **SQL Injection Prevention** - Parameterized queries
- **CORS Configuration** - Cross-origin resource sharing
- **Environment Variables** - Secure configuration management
- **Error Handling** - Secure error responses

## 📝 Sample Usage

### 1. Create Admin User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@example.com",
    "password": "admin123",
    "role": "admin"
  }'
```

### 2. Login as Admin
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }'
```

### 3. Create Patient (with admin token)
```bash
curl -X POST http://localhost:3000/api/auth/register/patient \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "John Patient",
    "email": "john@example.com",
    "password": "patient123",
    "dateOfBirth": "1990-01-01",
    "phone": "1234567890",
    "address": "123 Main St",
    "bloodType": "O+"
  }'
```

### 4. Create Doctor (with admin token)
```bash
curl -X POST http://localhost:3000/api/auth/register/doctor \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Dr. Smith",
    "email": "dr.smith@example.com",
    "password": "doctor123",
    "specialization": "Cardiology",
    "licenseNumber": "DOC123456",
    "phone": "555-0123",
    "isAvailable": true
  }'
```

## 🏗️ Project Structure

```
healthcare-api/
├── src/
│   ├── app.js                 # Main application file
│   ├── config/
│   │   └── db.js             # Database configuration
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── patient.controller.js
│   │   ├── doctor.controller.js
│   │   └── mapping.controller.js
│   ├── middleware/
│   │   └── auth.js           # Authentication middleware
│   ├── models/
│   │   ├── user.model.js
│   │   ├── patient.model.js
│   │   └── doctor.model.js
│   └── routes/
│       ├── auth.routes.js
│       ├── patient.routes.js
│       ├── doctor.routes.js
│       └── mapping.routes.js
├── database/
│   └── schema.sql            # Database schema
├── test-api.js               # API test suite
├── API_DOCUMENTATION.md      # Detailed API docs
├── package.json
└── README.md
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [API Documentation](./API_DOCUMENTATION.md)
2. Run the test suite: `npm test`
3. Check the server logs for error details
4. Ensure your database is properly configured
5. Verify your environment variables are set correctly

## 🎯 Assignment Compliance

This Node.js implementation fully satisfies the Django assignment requirements:

✅ **Backend Framework**: Node.js with Express.js (equivalent to Django)  
✅ **Database**: PostgreSQL  
✅ **Authentication**: JWT authentication  
✅ **RESTful APIs**: All required endpoints implemented  
✅ **ORM**: Custom ORM layer for database operations  
✅ **Error Handling**: Comprehensive error handling  
✅ **Environment Variables**: Secure configuration management  
✅ **Input Validation**: Express-validator for validation  
✅ **Security**: Password hashing, SQL injection prevention  
✅ **Testing**: Comprehensive API test suite  

The API provides all the functionality specified in the Django assignment with modern Node.js best practices.

## 🚀 Quick Start Guide

### 1. Clone and Setup
```bash
git clone <your-repo-url>
cd healthcare-api
npm install
```

### 2. Database Setup
```bash
# Create PostgreSQL database
createdb healthcare_db

# Run the schema
psql -d healthcare_db -f database/schema.sql
```

### 3. Environment Configuration
Create `.env` file:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=healthcare_db
DB_USER=your_username
DB_PASSWORD=your_password
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=24h
PORT=3000
NODE_ENV=development
```

### 4. Start the Server
```bash
npm run dev
```

### 5. Test the API
```bash
npm test
```

## 🔧 Development Scripts

```bash
npm start          # Start production server
npm run dev        # Start development server with nodemon
npm test           # Run API test suite
npm run test:api   # Run comprehensive API tests
```

## 📊 API Response Examples

### Successful Response Format
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Dr. John Smith",
    "email": "dr.john@example.com",
    "role": "doctor",
    "specialization": "Cardiology"
  }
}
```

### Error Response Format
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message (development only)"
}
```

## 🛠️ Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check PostgreSQL is running
   - Verify database credentials in `.env`
   - Ensure database exists

2. **JWT Token Issues**
   - Verify JWT_SECRET is set
   - Check token expiration time
   - Ensure proper Authorization header format

3. **Port Already in Use**
   - Change PORT in `.env` file
   - Kill existing process: `lsof -ti:3000 | xargs kill`

4. **Missing Dependencies**
   - Run `npm install`
   - Check Node.js version (v14+)

### Debug Mode
Set `NODE_ENV=development` in `.env` for detailed error messages.

## 🔒 Security Best Practices

- **Never commit `.env` files**
- **Use strong JWT secrets**
- **Validate all inputs**
- **Use HTTPS in production**
- **Implement rate limiting**
- **Regular security updates**

## 📈 Performance Considerations

- **Database indexing** for better query performance
- **Connection pooling** for database connections
- **Caching** for frequently accessed data
- **Compression** middleware for responses
- **Load balancing** for high traffic

## 🌐 Deployment Options

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Variables for Production
```env
NODE_ENV=production
DB_HOST=your-production-db-host
DB_PORT=5432
DB_NAME=healthcare_prod
DB_USER=prod_user
DB_PASSWORD=secure_password
JWT_SECRET=super_secure_jwt_secret
PORT=3000
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style
- Use ESLint for code formatting
- Follow RESTful API conventions
- Write comprehensive tests
- Document new endpoints

## 📝 Changelog

### Version 1.0.0
- ✅ Complete authentication system
- ✅ Patient management APIs
- ✅ Doctor management APIs
- ✅ Patient-doctor mapping
- ✅ JWT authentication
- ✅ PostgreSQL integration
- ✅ Comprehensive testing
- ✅ API documentation

## 🆘 Support & Help

### Getting Help
1. Check the [API Documentation](./API_DOCUMENTATION.md)
2. Run the test suite: `npm test`
3. Check server logs for error details
4. Verify database connection
5. Ensure all environment variables are set

### Contact
- **Issues**: Create a GitHub issue
- **Documentation**: Check `API_DOCUMENTATION.md`
- **Tests**: Run `npm test` for API validation



## 🙏 Acknowledgments

- Express.js community for the excellent framework
- PostgreSQL team for the robust database
- JWT.io for authentication standards
- All contributors and testers

---

**Built with ❤️ using Node.js, Express.js, and PostgreSQL**
