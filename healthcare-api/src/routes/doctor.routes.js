const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { auth, authorize } = require('../middleware/auth');
const Doctor = require('../models/doctor.model');
const {
  createDoctor,
  getAllDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor
} = require('../controllers/doctor.controller');

// @route   POST api/doctors
// @desc    Create a new doctor (Admin only)
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
      check('specialization', 'Specialization is required').not().isEmpty(),
      check('licenseNumber', 'License number is required').not().isEmpty(),
      check('phone', 'Phone number is required').not().isEmpty()
    ]
  ],
  createDoctor
);

// @route   GET api/doctors
// @desc    Get all doctors
// @access  Public
router.get('/', getAllDoctors);

// @route   GET api/doctors/:id
// @desc    Get doctor by ID
// @access  Public
router.get(
  '/:id',
  async (req, res, next) => {
    try {
      const doctor = await Doctor.findById(req.params.id, true);
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
  },
  getDoctorById
);

// @route   PUT api/doctors/:id
// @desc    Update doctor (Admin only)
// @access  Private/Admin
router.put(
  '/:id',
  [
    auth,
    authorize('admin'),
    async (req, res, next) => {
      try {
        const doctor = await Doctor.findById(req.params.id);
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
    },
    [
      check('name', 'Name is required').optional().not().isEmpty(),
      check('email', 'Please include a valid email').optional().isEmail(),
      check('specialization', 'Specialization is required').optional().not().isEmpty(),
      check('licenseNumber', 'License number is required').optional().not().isEmpty(),
      check('phone', 'Phone number is required').optional().not().isEmpty(),
      check('isAvailable', 'isAvailable must be a boolean').optional().isBoolean()
    ]
  ],
  updateDoctor
);

// @route   DELETE api/doctors/:id
// @desc    Delete doctor (Admin only)
// @access  Private/Admin
router.delete(
  '/:id',
  [
    auth,
    authorize('admin'),
    async (req, res, next) => {
      try {
        const doctor = await Doctor.findById(req.params.id);
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
  deleteDoctor
);

module.exports = router;

