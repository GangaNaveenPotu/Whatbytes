const { pool } = require('../config/db');

const Doctor = {
  // Create a new doctor
  async create({ userId, specialization, licenseNumber, phone, isAvailable = true }) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      if (!specialization || !licenseNumber || !phone) {
        throw new Error('Specialization, license number, and phone are required');
      }

      const { rows } = await client.query(
        `INSERT INTO doctors 
         (user_id, specialization, license_number, phone, is_available)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [userId, specialization, licenseNumber, phone, isAvailable]
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

  // Find doctor by user ID
  async findByUserId(userId, includeUserDetails = true) {
    try {
      let query = `
        SELECT d.*
        FROM doctors d
        WHERE d.user_id = $1`;
      
      if (includeUserDetails) {
        query = `
          SELECT d.*, 
                 u.name, u.email, u.role, u.created_at as user_created_at,
                 json_build_object(
                   'id', u.id,
                   'name', u.name,
                   'email', u.email,
                   'role', u.role,
                   'createdAt', u.created_at
                 ) as user
          FROM doctors d
          JOIN users u ON d.user_id = u.id
          WHERE d.user_id = $1`;
      }
      
      const { rows } = await pool.query(query, [userId]);
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  },

  // Find doctor by doctor ID
  async findById(doctorId, includeUserDetails = true) {
    try {
      let query = `
        SELECT d.*
        FROM doctors d
        WHERE d.id = $1`;
      
      if (includeUserDetails) {
        query = `
          SELECT d.*, 
                 u.name, u.email, u.role, u.created_at as user_created_at,
                 json_build_object(
                   'id', u.id,
                   'name', u.name,
                   'email', u.email,
                   'role', u.role,
                   'createdAt', u.created_at
                 ) as user
          FROM doctors d
          JOIN users u ON d.user_id = u.id
          WHERE d.id = $1`;
      }
      
      const { rows } = await pool.query(query, [doctorId]);
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  },

  // Find doctor by license number
  async findByLicenseNumber(licenseNumber, includeUserDetails = true) {
    try {
      let query = `
        SELECT d.*
        FROM doctors d
        WHERE d.license_number = $1`;
      
      if (includeUserDetails) {
        query = `
          SELECT d.*, 
                 u.name, u.email, u.role, u.created_at as user_created_at,
                 json_build_object(
                   'id', u.id,
                   'name', u.name,
                   'email', u.email,
                   'role', u.role,
                   'createdAt', u.created_at
                 ) as user
          FROM doctors d
          JOIN users u ON d.user_id = u.id
          WHERE d.license_number = $1`;
      }
      
      const { rows } = await pool.query(query, [licenseNumber]);
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  },

  // Get all doctors with pagination and filtering
  async findAll({ 
    limit = 10, 
    offset = 0, 
    search = '',
    specialization = null,
    isAvailable = null,
    minExperience = null,
    maxExperience = null
  } = {}) {
    try {
      const conditions = [];
      const values = [];
      let paramCount = 1;
      
      // Add search condition if search term is provided
      if (search && search.trim() !== '') {
        conditions.push(`(u.name ILIKE $${paramCount} OR u.email ILIKE $${paramCount} OR d.license_number ILIKE $${paramCount})`);
        values.push(`%${search}%`);
        paramCount++;
      }

      if (specialization) {
        conditions.push(`d.specialization = $${paramCount++}`);
        values.push(specialization);
      }
      
      if (isAvailable !== null) {
        conditions.push(`d.is_available = $${paramCount++}`);
        values.push(isAvailable);
      }
      
      if (minExperience !== null) {
        conditions.push(`d.experience_years >= $${paramCount++}`);
        values.push(minExperience);
      }
      
      if (maxExperience !== null) {
        conditions.push(`d.experience_years <= $${paramCount++}`);
        values.push(maxExperience);
      }

      values.push(limit, offset);
      const whereClause = conditions.length > 0 ? conditions.join(' AND ') : 'TRUE';
      
      const query = {
        text: `
          SELECT d.*, 
                 u.name, u.email, u.role, u.created_at as user_created_at,
                 COUNT(*) OVER() as total_count
          FROM doctors d
          JOIN users u ON d.user_id = u.id
          WHERE ${whereClause}
          ORDER BY d.created_at DESC
          LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
        values
      };
      
      const { rows } = await pool.query(query);
      
      // Extract total count from the first row if it exists
      const totalCount = rows.length > 0 ? parseInt(rows[0].total_count) : 0;
      
      return {
        data: rows.map(row => {
          const { total_count, ...doctorData } = row;
          return doctorData;
        }),
        pagination: {
          total: totalCount,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: offset + rows.length < totalCount
        },
        filters: {
          specializations: await this.getSpecializations()
        }
      };
    } catch (error) {
      throw error;
    }
  },

  // Get all unique specializations
  async getSpecializations() {
    try {
      const { rows } = await pool.query(
        'SELECT DISTINCT specialization FROM doctors ORDER BY specialization'
      );
      return rows.map(row => row.specialization);
    } catch (error) {
      throw error;
    }
  },

  // Update doctor
  async update(userId, updates) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const { specialization, licenseNumber, phone, isAvailable, experienceYears, bio } = updates;
      const updateFields = [];
      const values = [];
      let paramCount = 1;

      if (specialization) {
        updateFields.push(`specialization = $${paramCount++}`);
        values.push(specialization);
      }
      
      if (licenseNumber) {
        // Check if license number is already taken by another doctor
        const existingDoctor = await this.findByLicenseNumber(licenseNumber);
        if (existingDoctor && existingDoctor.user_id !== userId) {
          throw new Error('License number already in use');
        }
        updateFields.push(`license_number = $${paramCount++}`);
        values.push(licenseNumber);
      }
      
      if (phone) {
        updateFields.push(`phone = $${paramCount++}`);
        values.push(phone);
      }
      
      if (isAvailable !== undefined) {
        updateFields.push(`is_available = $${paramCount++}`);
        values.push(isAvailable);
      }
      
      if (experienceYears !== undefined) {
        updateFields.push(`experience_years = $${paramCount++}`);
        values.push(experienceYears);
      }
      
      if (bio !== undefined) {
        updateFields.push(`bio = $${paramCount++}`);
        values.push(bio);
      }

      if (updateFields.length > 0) {
        values.push(userId);
        const { rows } = await client.query(
          `UPDATE doctors 
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

  // Delete doctor
  async delete(userId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // First, delete any patient-doctor mappings
      await client.query(
        'DELETE FROM patient_doctor_mapping WHERE doctor_id IN (SELECT id FROM doctors WHERE user_id = $1)',
        [userId]
      );
      
      // Then delete the doctor
      const { rowCount } = await client.query(
        'DELETE FROM doctors WHERE user_id = $1 RETURNING id',
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
  
  // Get all patients assigned to a doctor with optional filtering
  async getAssignedPatients(doctorId, { status = 'active' } = {}) {
    try {
      let condition = 'pdm.doctor_id = $1';
      const values = [doctorId];
      
      if (status === 'active') {
        condition += ' AND pdm.is_active = true';
      } else if (status === 'inactive') {
        condition += ' AND pdm.is_active = false';
      }
      
      const query = `
        SELECT 
          p.*, 
          u.name, u.email, u.role,
          pdm.assigned_at, pdm.is_active, pdm.notes
        FROM patient_doctor_mapping pdm
        JOIN patients p ON pdm.patient_id = p.id
        JOIN users u ON p.user_id = u.id
        WHERE ${condition}
        ORDER BY pdm.assigned_at DESC`;
      
      const { rows } = await pool.query(query, values);
      return rows;
    } catch (error) {
      throw error;
    }
  },
  
  // Get doctor's schedule
  async getSchedule(doctorId, { startDate, endDate } = {}) {
    try {
      let query = `
        SELECT * FROM doctor_schedules 
        WHERE doctor_id = $1`;
      
      const values = [doctorId];
      
      if (startDate) {
        query += ` AND schedule_date >= $${values.length + 1}`;
        values.push(startDate);
      }
      
      if (endDate) {
        query += ` AND schedule_date <= $${values.length + 1}`;
        values.push(endDate);
      }
      
      query += ' ORDER BY schedule_date, start_time';
      
      const { rows } = await pool.query(query, values);
      return rows;
    } catch (error) {
      throw error;
    }
  },
  
  // Update doctor's schedule
  async updateSchedule(doctorId, scheduleUpdates) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // First, delete existing schedules for the date range if needed
      if (scheduleUpdates.clearExisting) {
        await client.query(
          'DELETE FROM doctor_schedules WHERE doctor_id = $1 AND schedule_date >= $2 AND schedule_date <= $3',
          [doctorId, scheduleUpdates.startDate, scheduleUpdates.endDate]
        );
      }
      
      // Insert new schedules
      const insertPromises = scheduleUpdates.slots.map(slot => {
        return client.query(
          `INSERT INTO doctor_schedules 
           (doctor_id, schedule_date, start_time, end_time, max_appointments, is_available)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (doctor_id, schedule_date, start_time) 
           DO UPDATE SET 
             end_time = EXCLUDED.end_time,
             max_appointments = EXCLUDED.max_appointments,
             is_available = EXCLUDED.is_available,
             updated_at = NOW()
           RETURNING *`,
          [
            doctorId,
            slot.date,
            slot.startTime,
            slot.endTime,
            slot.maxAppointments || 1,
            slot.isAvailable !== false // Default to true if not specified
          ]
        );
      });
      
      const results = await Promise.all(insertPromises);
      const schedules = results.map(result => result.rows[0]);
      
      await client.query('COMMIT');
      return schedules;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },
  
  // Get doctor's appointments
  async getAppointments(doctorId, { startDate, endDate, status = 'upcoming' } = {}) {
    try {
      let query = `
        SELECT a.*, 
               p.id as patient_id, u.name as patient_name, u.email as patient_email,
               d.specialization, u2.name as doctor_name
        FROM appointments a
        JOIN doctors d ON a.doctor_id = d.id
        JOIN patients p ON a.patient_id = p.id
        JOIN users u ON p.user_id = u.id
        JOIN users u2 ON d.user_id = u2.id
        WHERE a.doctor_id = $1`;
      
      const values = [doctorId];
      let paramCount = 2;
      
      if (status === 'upcoming') {
        query += ` AND (a.status = 'scheduled' OR a.status = 'confirmed') 
                  AND (a.appointment_date > NOW() OR 
                      (a.appointment_date = CURRENT_DATE AND a.end_time > CURRENT_TIME))`;
      } else if (status === 'completed') {
        query += ` AND (a.status = 'completed' OR 
                      (a.appointment_date < CURRENT_DATE OR 
                      (a.appointment_date = CURRENT_DATE AND a.end_time < CURRENT_TIME)))`;
      } else if (status) {
        query += ` AND a.status = $${paramCount++}`;
        values.push(status);
      }
      
      if (startDate) {
        query += ` AND a.appointment_date >= $${paramCount++}`;
        values.push(startDate);
      }
      
      if (endDate) {
        query += ` AND a.appointment_date <= $${paramCount++}`;
        values.push(endDate);
      }
      
      query += ' ORDER BY a.appointment_date, a.start_time';
      
      const { rows } = await pool.query(query, values);
      return rows;
    } catch (error) {
      throw error;
    }
  },
  
  // Update appointment status
  async updateAppointmentStatus(doctorId, appointmentId, status, notes = null) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const { rows } = await client.query(
        `UPDATE appointments 
         SET status = $1, doctor_notes = COALESCE($2, doctor_notes), updated_at = NOW()
         WHERE id = $3 AND doctor_id = $4
         RETURNING *`,
        [status, notes, appointmentId, doctorId]
      );
      
      await client.query('COMMIT');
      return rows[0] || null;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
};

module.exports = Doctor;
