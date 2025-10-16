const { pool } = require('../config/db');

const Patient = {
  // Create a new patient
  async create({ userId, dateOfBirth, phone, address, bloodType, medicalHistory, allergies }) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      if (!dateOfBirth || !phone) {
        throw new Error('Date of birth and phone are required');
      }

      const { rows } = await client.query(
        `INSERT INTO patients 
         (user_id, date_of_birth, phone, address, blood_type, medical_history, allergies)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [userId, dateOfBirth, phone, address || null, bloodType || null, 
         medicalHistory || null, allergies || null]
      );
      
      await client.query('COMMIT');
      return rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  // Find patient by user ID
  async findByUserId(userId, includeUserDetails = true) {
    try {
      let query = `
        SELECT p.*
        FROM patients p
        WHERE p.user_id = $1`;
      
      if (includeUserDetails) {
        query = `
          SELECT p.*, 
                 u.name, u.email, u.role, u.created_at as user_created_at,
                 json_build_object(
                   'id', u.id,
                   'name', u.name,
                   'email', u.email,
                   'role', u.role,
                   'createdAt', u.created_at
                 ) as user
          FROM patients p
          JOIN users u ON p.user_id = u.id
          WHERE p.user_id = $1`;
      }
      
      const { rows } = await pool.query(query, [userId]);
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  },

  // Find patient by patient ID
  async findById(patientId, includeUserDetails = true) {
    try {
      let query = `
        SELECT p.*
        FROM patients p
        WHERE p.id = $1`;
      
      if (includeUserDetails) {
        query = `
          SELECT p.*, 
                 u.name, u.email, u.role, u.created_at as user_created_at,
                 json_build_object(
                   'id', u.id,
                   'name', u.name,
                   'email', u.email,
                   'role', u.role,
                   'createdAt', u.created_at
                 ) as user
          FROM patients p
          JOIN users u ON p.user_id = u.id
          WHERE p.id = $1`;
      }
      
      const { rows } = await pool.query(query, [patientId]);
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  },

  // Get all patients with pagination and filtering
  async findAll({ limit = 10, offset = 0, search = '' } = {}) {
    try {
      const query = {
        text: `
          SELECT p.*, 
                 u.name, u.email, u.role, u.created_at as user_created_at,
                 json_build_object(
                   'id', u.id,
                   'name', u.name,
                   'email', u.email,
                   'role', u.role,
                   'createdAt', u.created_at
                 ) as user,
                 COUNT(*) OVER() as total_count
          FROM patients p
          JOIN users u ON p.user_id = u.id
          WHERE ($1 = '' OR u.name ILIKE $1 OR u.email ILIKE $1 OR p.phone ILIKE $1)
          ORDER BY p.created_at DESC
          LIMIT $2 OFFSET $3`,
        values: [`%${search}%`, limit, offset]
      };
      
      const { rows } = await pool.query(query);
      
      // Extract total count from the first row if it exists
      const totalCount = rows.length > 0 ? parseInt(rows[0].total_count) : 0;
      
      return {
        data: rows.map(row => {
          const { total_count, ...patientData } = row;
          return patientData;
        }),
        pagination: {
          total: totalCount,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: offset + rows.length < totalCount
        }
      };
    } catch (error) {
      throw error;
    }
  },

  // Update patient
  async update(userId, updates) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const { dateOfBirth, phone, address, bloodType, medicalHistory, allergies } = updates;
      const updateFields = [];
      const values = [];
      let paramCount = 1;

      if (dateOfBirth) {
        updateFields.push(`date_of_birth = $${paramCount++}`);
        values.push(dateOfBirth);
      }
      
      if (phone) {
        updateFields.push(`phone = $${paramCount++}`);
        values.push(phone);
      }
      
      if (address !== undefined) {
        updateFields.push(`address = $${paramCount++}`);
        values.push(address);
      }
      
      if (bloodType !== undefined) {
        updateFields.push(`blood_type = $${paramCount++}`);
        values.push(bloodType);
      }
      
      if (medicalHistory !== undefined) {
        updateFields.push(`medical_history = $${paramCount++}`);
        values.push(medicalHistory);
      }
      
      if (allergies !== undefined) {
        updateFields.push(`allergies = $${paramCount++}`);
        values.push(allergies);
      }

      if (updateFields.length > 0) {
        values.push(userId);
        const { rows } = await client.query(
          `UPDATE patients 
           SET ${updateFields.join(', ')} 
           WHERE user_id = $${paramCount}
           RETURNING *`,
          values
        );
        
        await client.query('COMMIT');
        return rows[0] || null;
      }
      
      return null;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  // Delete patient
  async delete(userId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Delete the patient (mapping table doesn't exist yet)
      const { rowCount } = await client.query(
        'DELETE FROM patients WHERE user_id = $1 RETURNING id',
        [userId]
      );
      
      await client.query('COMMIT');
      return rowCount > 0;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },
  
  // Get all doctors assigned to a patient
  async getAssignedDoctors(patientId) {
    try {
      const query = `
        SELECT d.*, u.name, u.email,
               pdm.assigned_at, pdm.is_active, pdm.notes
        FROM patient_doctor_mapping pdm
        JOIN doctors d ON pdm.doctor_id = d.id
        JOIN users u ON d.user_id = u.id
        WHERE pdm.patient_id = $1
        ORDER BY pdm.assigned_at DESC`;
      
      const { rows } = await pool.query(query, [patientId]);
      return rows;
    } catch (error) {
      throw error;
    }
  },
  
  // Check if a doctor is assigned to a patient
  async isDoctorAssigned(patientId, doctorId) {
    try {
      const { rows } = await pool.query(
        `SELECT 1 FROM patient_doctor_mapping 
         WHERE patient_id = $1 AND doctor_id = $2 AND is_active = true`,
        [patientId, doctorId]
      );
      return rows.length > 0;
    } catch (error) {
      throw error;
    }
  },
  
  // Assign a doctor to a patient
  async assignDoctor(patientId, doctorId, notes = null) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Check if the assignment already exists
      const existing = await client.query(
        `SELECT id FROM patient_doctor_mapping 
         WHERE patient_id = $1 AND doctor_id = $2`,
        [patientId, doctorId]
      );
      
      let result;
      
      if (existing.rows.length > 0) {
        // Update existing assignment
        result = await client.query(
          `UPDATE patient_doctor_mapping 
           SET is_active = true, notes = $1, updated_at = NOW()
           WHERE patient_id = $2 AND doctor_id = $3
           RETURNING *`,
          [notes, patientId, doctorId]
        );
      } else {
        // Create new assignment
        result = await client.query(
          `INSERT INTO patient_doctor_mapping 
           (patient_id, doctor_id, notes)
           VALUES ($1, $2, $3)
           RETURNING *`,
          [patientId, doctorId, notes]
        );
      }
      
      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },
  
  // Remove a doctor from a patient
  async removeDoctor(patientId, doctorId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const { rowCount } = await client.query(
        `DELETE FROM patient_doctor_mapping 
         WHERE patient_id = $1 AND doctor_id = $2
         RETURNING *`,
        [patientId, doctorId]
      );
      
      await client.query('COMMIT');
      return rowCount > 0;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
};

module.exports = Patient;
