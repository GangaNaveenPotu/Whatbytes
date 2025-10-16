const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const { auth, authorize } = require('../middleware/auth');
const Patient = require('../models/patient.model');
const Doctor = require('../models/doctor.model');
const {
  assignDoctorToPatient,
  getAllMappings,
  getPatientDoctors,
  removeDoctorFromPatient
} = require('../controllers/mapping.controller');

// @route   POST api/mappings
// @desc    Assign a doctor to a patient (Admin only)
// @access  Private/Admin
router.post(
  '/',
  [
    auth,
    authorize('admin'),
    [
      check('patientId', 'Patient ID is required').isInt(),
      check('doctorId', 'Doctor ID is required').isInt(),
      check('notes', 'Notes must be a string').optional().isString(),
      check('isActive', 'isActive must be a boolean').optional().isBoolean()
    ],
    async (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      try {
        // Verify patient exists
        const patient = await Patient.findById(req.body.patientId);
        if (!patient) {
          return res.status(404).json({
            success: false,
            message: 'Patient not found'
          });
        }

        // Verify doctor exists
        const doctor = await Doctor.findById(req.body.doctorId);
        if (!doctor) {
          return res.status(404).json({
            success: false,
            message: 'Doctor not found'
          });
        }

        next();
      } catch (error) {
        next(error);
      }
    }
  ],
  assignDoctorToPatient
);

// @route   GET api/mappings
// @desc    Get all patient-doctor mappings (Admin only)
// @access  Private/Admin
router.get(
  '/', 
  [
    auth,
    authorize('admin'),
    (req, res, next) => {
      // Validate query parameters
      const { page, limit } = req.query;
      if (page && isNaN(parseInt(page)) || limit && isNaN(parseInt(limit))) {
        return res.status(400).json({
          success: false,
          message: 'Page and limit must be valid numbers'
        });
      }
      next();
    }
  ],
  getAllMappings
);

// @route   GET api/mappings/patient/:patientId
// @desc    Get all doctors for a specific patient
// @access  Private (patient can access own doctors, admin can access all)
router.get(
  '/patient/:patientId',
  [
    auth,
    check('patientId').isInt().withMessage('Patient ID must be a number'),
    async (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      try {
        const patient = await Patient.findById(req.params.patientId);
        if (!patient) {
          return res.status(404).json({
            success: false,
            message: 'Patient not found'
          });
        }

        // Check if the request is from the patient themselves or an admin
        if (req.user.role !== 'admin' && req.user.id !== patient.user.id) {
          return res.status(403).json({
            success: false,
            message: 'Not authorized to access these doctor mappings'
          });
        }

        next();
      } catch (error) {
        next(error);
      }
    }
  ],
  getPatientDoctors
);

// @route   DELETE api/mappings/:mappingId
// @desc    Remove a doctor from a patient (Admin only)
// @access  Private/Admin
router.delete(
  '/:mappingId',
  [
    auth,
    authorize('admin'),
    check('mappingId').isInt().withMessage('Mapping ID must be a number'),
    async (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      next();
    }
  ],
  removeDoctorFromPatient
);

// Error handling middleware
router.use((err, req, res, next) => {
  console.error('Mapping routes error:', err);
  res.status(500).json({
    success: false,
    message: 'Server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

module.exports = router;
