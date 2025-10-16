const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { auth, authorize, isOwnerOrAdmin } = require('../middleware/auth');
const Patient = require('../models/patient.model');
const {
  createPatient,
  getAllPatients,
  getPatientById,
  updatePatient,
  deletePatient
} = require('../controllers/patient.controller');

// @route   POST api/patients
// @desc    Create a new patient (Admin only)
// @access  Private/Admin
router.post(
  '/',
  [
    auth,
    authorize('admin'),
    [
      check('name', 'Name is required').not().isEmpty(),
      check('email', 'Please include a valid email').isEmail(),
      check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
      check('dateOfBirth', 'Date of birth is required').not().isEmpty(),
      check('phone', 'Phone number is required').not().isEmpty()
    ]
  ],
  createPatient
);

// @route   GET api/patients
// @desc    Get patients
// @access  Private
// Behavior: Admins get all patients; others get only their own patient record
router.get('/', auth, async (req, res, next) => {
  try {
    if (req.user.role === 'admin') {
      return getAllPatients(req, res);
    }

    const patient = await Patient.findByUserId(req.user.id, true);
    return res.status(200).json({
      success: true,
      count: patient ? 1 : 0,
      data: patient ? [patient] : []
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET api/patients/:id
// @desc    Get patient by ID
// @access  Private (patient can access own profile, admin can access all)
router.get(
  '/:id',
  auth,
  async (req, res, next) => {
    try {
      const patient = await Patient.findById(req.params.id);
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
          message: 'Not authorized to access this patient'
        });
      }
      
      next();
    } catch (error) {
      next(error);
    }
  },
  getPatientById
);

// @route   PUT api/patients/:id
// @desc    Update patient (patient can update own profile, admin can update any)
// @access  Private
router.put(
  '/:id',
  [
    auth,
    async (req, res, next) => {
      try {
        const patient = await Patient.findById(req.params.id);
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
            message: 'Not authorized to update this patient'
          });
        }
        
        next();
      } catch (error) {
        next(error);
      }
    },
    [
      check('name', 'Name is required').optional().not().isEmpty(),
      check('email', 'Please include a valid email').optional().isEmail(),
      check('password', 'Please enter a password with 6 or more characters').optional().isLength({ min: 6 })
    ]
  ],
  updatePatient
);

// @route   DELETE api/patients/:id
// @desc    Delete patient (Admin only)
// @access  Private/Admin
router.delete('/:id', auth, authorize('admin'), deletePatient);

module.exports = router;
