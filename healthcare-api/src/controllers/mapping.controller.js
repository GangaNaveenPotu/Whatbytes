const Patient = require('../models/patient.model');
const Doctor = require('../models/doctor.model');
const { pool } = require('../config/db');

// @desc    Assign a doctor to a patient
// @route   POST /api/mappings/
// @access  Private
exports.assignDoctorToPatient = async (req, res) => {
  try {
    const { patientId, doctorId, notes } = req.body;
    
    // Verify patient exists
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    // Verify doctor exists
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    
    // Check if mapping already exists
    const existingMapping = await Patient.isDoctorAssigned(patientId, doctorId);
    if (existingMapping) {
      return res.status(400).json({ message: 'Doctor is already assigned to this patient' });
    }
    
    // Create the mapping
    const mapping = await Patient.assignDoctor(patientId, doctorId, notes);
    
    res.status(201).json({
      success: true,
      data: mapping
    });
  } catch (error) {
    console.error('Error assigning doctor to patient:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get all patient-doctor mappings
// @route   GET /api/mappings/
// @access  Private/Admin
exports.getAllMappings = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const limitNum = parseInt(limit);
    const offsetNum = (parseInt(page) - 1) * limitNum;

    const query = {
      text: `
        SELECT 
          pdm.id,
          pdm.patient_id,
          pdm.doctor_id,
          pdm.is_active,
          pdm.notes,
          pdm.assigned_at,
          pdm.updated_at,
          -- patient user
          pu.id   AS patient_user_id,
          pu.name AS patient_name,
          pu.email AS patient_email,
          -- doctor user
          du.id   AS doctor_user_id,
          du.name AS doctor_name,
          du.email AS doctor_email,
          d.specialization,
          COUNT(*) OVER() as total_count
        FROM patient_doctor_mapping pdm
        JOIN patients p ON pdm.patient_id = p.id
        JOIN users pu ON p.user_id = pu.id
        JOIN doctors d ON pdm.doctor_id = d.id
        JOIN users du ON d.user_id = du.id
        ORDER BY pdm.assigned_at DESC
        LIMIT $1 OFFSET $2
      `,
      values: [limitNum, offsetNum]
    };

    const { rows } = await pool.query(query);
    const totalCount = rows.length > 0 ? parseInt(rows[0].total_count) : 0;

    const data = rows.map(r => {
      const { total_count, ...rest } = r;
      return rest;
    });

    res.status(200).json({
      success: true,
      count: data.length,
      pagination: {
        total: totalCount,
        limit: limitNum,
        offset: offsetNum,
        hasMore: offsetNum + data.length < totalCount
      },
      data
    });
  } catch (error) {
    console.error('Error getting mappings:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get all doctors for a specific patient
// @route   GET /api/mappings/patient/:patientId
// @access  Private
exports.getPatientDoctors = async (req, res) => {
  try {
    const { patientId } = req.params;
    
    // Verify patient exists
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    // Get all doctors for this patient
    const doctors = await Patient.getAssignedDoctors(patientId);
    
    res.status(200).json({
      success: true,
      count: doctors.length,
      data: doctors
    });
  } catch (error) {
    console.error('Error getting patient doctors:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Remove a doctor from a patient
// @route   DELETE /api/mappings/:mappingId
// @access  Private
exports.removeDoctorFromPatient = async (req, res) => {
  try {
    const { mappingId } = req.params;

    // Verify mapping exists
    const { rows } = await pool.query(
      'SELECT id FROM patient_doctor_mapping WHERE id = $1',
      [mappingId]
    );

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: 'Mapping not found'
      });
    }

    // Delete mapping
    await pool.query('DELETE FROM patient_doctor_mapping WHERE id = $1', [mappingId]);

    res.status(200).json({
      success: true,
      message: 'Mapping removed successfully'
    });
  } catch (error) {
    console.error('Error removing doctor from patient:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
