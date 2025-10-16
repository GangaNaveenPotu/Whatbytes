const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');

const User = {
  // Create a new user with role-specific data
  async create({ name, email, password, role = 'patient', ...rest }) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Validate role
      if (!['admin', 'doctor', 'patient'].includes(role)) {
        throw new Error('Invalid role. Must be one of: admin, doctor, patient');
      }

      // Check if user already exists
      const existingUser = await this.findByEmail(email);
      if (existingUser) {
        throw new Error('Email already in use');
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Insert into users table
      const userQuery = `
        INSERT INTO users (name, email, password, role) 
        VALUES ($1, $2, $3, $4) 
        RETURNING id, name, email, role, created_at`;
      
      const userValues = [name, email, hashedPassword, role];
      const userResult = await client.query(userQuery, userValues);
      const user = userResult.rows[0];

      // Handle role-specific data
      if (role === 'patient') {
        const { dateOfBirth, phone, address, bloodType } = rest;
        if (!dateOfBirth || !phone) {
          throw new Error('Date of birth and phone are required for patients');
        }
        
        const patientQuery = `
          INSERT INTO patients 
            (user_id, date_of_birth, phone, address, blood_type)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING *`;
          
        const patientValues = [
          user.id, 
          dateOfBirth, 
          phone, 
          address || null, 
          bloodType || null
        ];
        
        await client.query(patientQuery, patientValues);
        
      } else if (role === 'doctor') {
        const { specialization, licenseNumber, phone, isAvailable = true } = rest;
        if (!specialization || !licenseNumber || !phone) {
          throw new Error('Specialization, license number, and phone are required for doctors');
        }
        
        const doctorQuery = `
          INSERT INTO doctors 
            (user_id, specialization, license_number, phone, is_available)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING *`;
          
        const doctorValues = [user.id, specialization, licenseNumber, phone, isAvailable];
        await client.query(doctorQuery, doctorValues);
      }

      await client.query('COMMIT');
      return user;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  // Find user by email with role-specific data
  async findByEmail(email, includeDetails = false) {
    try {
      const userQuery = 'SELECT * FROM users WHERE email = $1';
      const userResult = await pool.query(userQuery, [email]);
      
      if (!userResult.rows.length) return null;
      
      const user = userResult.rows[0];
      
      if (includeDetails) {
        if (user.role === 'patient') {
          const patientQuery = 'SELECT * FROM patients WHERE user_id = $1';
          const patientResult = await pool.query(patientQuery, [user.id]);
          user.patientDetails = patientResult.rows[0] || null;
        } else if (user.role === 'doctor') {
          const doctorQuery = 'SELECT * FROM doctors WHERE user_id = $1';
          const doctorResult = await pool.query(doctorQuery, [user.id]);
          user.doctorDetails = doctorResult.rows[0] || null;
        }
      }
      
      return user;
    } catch (error) {
      throw error;
    }
  },

  // Find user by ID with optional role-specific data
  async findById(id, includeDetails = false) {
    try {
      const userQuery = 'SELECT * FROM users WHERE id = $1';
      const userResult = await pool.query(userQuery, [id]);
      
      if (!userResult.rows.length) return null;
      
      const user = userResult.rows[0];
      
      if (includeDetails) {
        if (user.role === 'patient') {
          const patientQuery = 'SELECT * FROM patients WHERE user_id = $1';
          const patientResult = await pool.query(patientQuery, [user.id]);
          user.patientDetails = patientResult.rows[0] || null;
        } else if (user.role === 'doctor') {
          const doctorQuery = 'SELECT * FROM doctors WHERE user_id = $1';
          const doctorResult = await pool.query(doctorQuery, [user.id]);
          user.doctorDetails = doctorResult.rows[0] || null;
        }
      }
      
      return user;
    } catch (error) {
      throw error;
    }
  },

  // Update user profile
  async updateProfile(userId, updates) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const { name, email, ...roleUpdates } = updates;
      const updateFields = [];
      const values = [];
      let paramCount = 1;
      
      if (name) {
        updateFields.push(`name = $${paramCount++}`);
        values.push(name);
      }
      
      if (email) {
        // Check if email is already taken by another user
        const existingUser = await this.findByEmail(email);
        if (existingUser && existingUser.id !== userId) {
          throw new Error('Email already in use');
        }
        updateFields.push(`email = $${paramCount++}`);
        values.push(email);
      }
      
      if (updateFields.length > 0) {
        const updateQuery = `
          UPDATE users 
          SET ${updateFields.join(', ')}
          WHERE id = $${paramCount++}
          RETURNING id, name, email, role, created_at`;
          
        values.push(userId);
        const result = await client.query(updateQuery, values);
        const user = result.rows[0];
        
        // Update role-specific data if needed
        if (user.role === 'patient' && (roleUpdates.dateOfBirth || roleUpdates.phone || roleUpdates.address || roleUpdates.bloodType)) {
          const patientUpdates = [];
          const patientValues = [];
          let patientParamCount = 1;
          
          if (roleUpdates.dateOfBirth) {
            patientUpdates.push(`date_of_birth = $${patientParamCount++}`);
            patientValues.push(roleUpdates.dateOfBirth);
          }
          
          if (roleUpdates.phone) {
            patientUpdates.push(`phone = $${patientParamCount++}`);
            patientValues.push(roleUpdates.phone);
          }
          
          if (roleUpdates.address !== undefined) {
            patientUpdates.push(`address = $${patientParamCount++}`);
            patientValues.push(roleUpdates.address);
          }
          
          if (roleUpdates.bloodType) {
            patientUpdates.push(`blood_type = $${patientParamCount++}`);
            patientValues.push(roleUpdates.bloodType);
          }
          
          if (roleUpdates.medicalHistory !== undefined) {
            patientUpdates.push(`medical_history = $${patientParamCount++}`);
            patientValues.push(roleUpdates.medicalHistory);
          }
          
          if (roleUpdates.allergies !== undefined) {
            patientUpdates.push(`allergies = $${patientParamCount++}`);
            patientValues.push(roleUpdates.allergies);
          }
          
          if (patientUpdates.length > 0) {
            patientValues.push(userId);
            const patientQuery = `
              UPDATE patients 
              SET ${patientUpdates.join(', ')}
              WHERE user_id = $${patientParamCount}
              RETURNING *`;
              
            await client.query(patientQuery, patientValues);
          }
        } else if (user.role === 'doctor' && (roleUpdates.specialization || roleUpdates.licenseNumber || roleUpdates.phone)) {
          const doctorUpdates = [];
          const doctorValues = [];
          let doctorParamCount = 1;
          
          if (roleUpdates.specialization) {
            doctorUpdates.push(`specialization = $${doctorParamCount++}`);
            doctorValues.push(roleUpdates.specialization);
          }
          
          if (roleUpdates.licenseNumber) {
            // Check if license number is already taken by another doctor
            const existingDoctor = await this.findByLicenseNumber(roleUpdates.licenseNumber);
            if (existingDoctor && existingDoctor.user_id !== userId) {
              throw new Error('License number already in use');
            }
            doctorUpdates.push(`license_number = $${doctorParamCount++}`);
            doctorValues.push(roleUpdates.licenseNumber);
          }
          
          if (roleUpdates.phone) {
            doctorUpdates.push(`phone = $${doctorParamCount++}`);
            doctorValues.push(roleUpdates.phone);
          }
          
          if (roleUpdates.isAvailable !== undefined) {
            doctorUpdates.push(`is_available = $${doctorParamCount++}`);
            doctorValues.push(roleUpdates.isAvailable);
          }
          
          if (doctorUpdates.length > 0) {
            doctorValues.push(userId);
            const doctorQuery = `
              UPDATE doctors 
              SET ${doctorUpdates.join(', ')}
              WHERE user_id = $${doctorParamCount}
              RETURNING *`;
              
            await client.query(doctorQuery, doctorValues);
          }
        }
        
        await client.query('COMMIT');
        return await this.findById(userId, true);
      }
      
      return await this.findById(userId, true);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  // Find doctor by license number
  async findByLicenseNumber(licenseNumber) {
    try {
      const { rows } = await pool.query(
        'SELECT * FROM doctors WHERE license_number = $1',
        [licenseNumber]
      );
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  },

  // Compare password
  async comparePassword(candidatePassword, hashedPassword) {
    return await bcrypt.compare(candidatePassword, hashedPassword);
  },
  
  // Change password
  async changePassword(userId, currentPassword, newPassword) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Get current user with hashed password
      const userResult = await client.query(
        'SELECT id, password FROM users WHERE id = $1',
        [userId]
      );
      
      if (!userResult.rows.length) {
        throw new Error('User not found');
      }
      
      const user = userResult.rows[0];
      
      // Verify current password
      const isMatch = await this.comparePassword(currentPassword, user.password);
      if (!isMatch) {
        throw new Error('Current password is incorrect');
      }
      
      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      
      // Update password
      await client.query(
        'UPDATE users SET password = $1 WHERE id = $2',
        [hashedPassword, userId]
      );
      
      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },
  
  // List all users (admin only)
  async listUsers(role = null) {
    try {
      let query = 'SELECT id, name, email, role, created_at FROM users';
      const values = [];
      
      if (role) {
        query += ' WHERE role = $1';
        values.push(role);
      }
      
      query += ' ORDER BY created_at DESC';
      
      const { rows } = await pool.query(query, values);
      return rows;
    } catch (error) {
      throw error;
    }
  },
  
  // Delete user (admin only)
  async deleteUser(userId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // First, get user role to determine if we need to delete from role-specific table
      const userResult = await client.query(
        'SELECT role FROM users WHERE id = $1',
        [userId]
      );
      
      if (!userResult.rows.length) {
        throw new Error('User not found');
      }
      
      const { role } = userResult.rows[0];
      
      // Delete from role-specific table first due to foreign key constraints
      if (role === 'patient') {
        await client.query('DELETE FROM patients WHERE user_id = $1', [userId]);
      } else if (role === 'doctor') {
        // First delete any patient-doctor mappings
        await client.query('DELETE FROM patient_doctor_mapping WHERE doctor_id IN (SELECT id FROM doctors WHERE user_id = $1)', [userId]);
        await client.query('DELETE FROM doctors WHERE user_id = $1', [userId]);
      }
      
      // Finally, delete the user
      await client.query('DELETE FROM users WHERE id = $1', [userId]);
      
      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
};

module.exports = User;
