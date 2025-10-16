const { check, validationResult } = require('express-validator');
const User = require('../models/user.model');
const Doctor = require('../models/doctor.model');
const jwt = require('jsonwebtoken');

// @desc    Create a new doctor (Admin only)
// @route   POST /api/doctors/
// @access  Private/Admin
exports.createDoctor = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { 
      name, 
      email, 
      password, 
      specialization, 
      licenseNumber, 
      phone,
      isAvailable = true
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: 'User already exists with this email' 
      });
    }

    // Create user with doctor role
    const user = await User.create({
      name,
      email,
      password,
      role: 'doctor',
      specialization,
      licenseNumber,
      phone,
      isAvailable
    });

    res.status(201).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error creating doctor:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get all doctors
// @route   GET /api/doctors
// @access  Public
exports.getAllDoctors = async (req, res) => {
  try {
    const { 
      specialization, 
      isAvailable,
      page = 1, 
      limit = 10, 
      search = '' 
    } = req.query;
    
    const result = await Doctor.findAll({ 
      specialization, 
      isAvailable: isAvailable ? isAvailable === 'true' : undefined,
      limit: parseInt(limit), 
      offset: (page - 1) * limit,
      search
    });

    res.status(200).json({
      success: true,
      count: result.data.length,
      pagination: result.pagination,
      data: result.data
    });
  } catch (error) {
    console.error('Error getting doctors:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get doctor by ID
// @route   GET /api/doctors/:id
// @access  Public
exports.getDoctorById = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id, true);
    
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    res.status(200).json({
      success: true,
      data: doctor
    });
  } catch (error) {
    console.error('Error getting doctor:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Update doctor
// @route   PUT /api/doctors/:id
// @access  Private/Admin
exports.updateDoctor = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const doctor = await Doctor.findById(req.params.id);
    
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    // Only admin can update doctor profiles
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update doctor profiles'
      });
    }

    const updates = req.body;
    const updatedDoctor = await Doctor.update(doctor.user.id, updates);

    res.status(200).json({
      success: true,
      data: updatedDoctor
    });
  } catch (error) {
    console.error('Error updating doctor:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Delete doctor (Admin only)
// @route   DELETE /api/doctors/:id
// @access  Private/Admin
exports.deleteDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    // Only admin can delete doctors
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete doctors'
      });
    }

    await Doctor.delete(doctor.user.id);

    res.status(200).json({
      success: true,
      message: 'Doctor deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting doctor:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Register a new doctor
// @route   POST /api/doctors/register
// @access  Public
exports.registerDoctor = async (req, res) => {
  try {
    const { 
      name, 
      email, 
      password, 
      specialization, 
      licenseNumber, 
      hospital, 
      experience, 
      consultationFee 
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: 'User already exists with this email' 
      });
    }

    // Create user with doctor role
    const user = await User.create({
      name,
      email,
      password,
      role: 'doctor'
    });

    // Create doctor profile
    const doctor = await Doctor.create({
      userId: user.id,
      specialization,
      licenseNumber,
      hospital,
      experience,
      consultationFee
    });

    // Generate token
    const token = generateToken(user);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        doctorProfile: doctor
      }
    });
  } catch (error) {
    console.error('Doctor registration error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error during doctor registration' 
    });
  }
};

// @desc    Get doctor profile
// @route   GET /api/doctors/me
// @access  Private (Doctor only)
exports.getDoctorProfile = async (req, res) => {
  try {
    if (req.user.role !== 'doctor') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only doctors can access this resource.'
      });
    }

    const doctor = await Doctor.findByUserId(req.user.id);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found'
      });
    }

    res.json({
      success: true,
      data: doctor
    });
  } catch (error) {
    console.error('Get doctor profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update doctor profile
// @route   PUT /api/doctors/me
// @access  Private (Doctor only)
exports.updateDoctorProfile = async (req, res) => {
  try {
    if (req.user.role !== 'doctor') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only doctors can access this resource.'
      });
    }

    const updates = {
      specialization: req.body.specialization,
      licenseNumber: req.body.licenseNumber,
      hospital: req.body.hospital,
      experience: req.body.experience,
      consultationFee: req.body.consultationFee
    };

    const updatedDoctor = await Doctor.update(req.user.id, updates);
    
    if (!updatedDoctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    res.json({
      success: true,
      data: updatedDoctor
    });
  } catch (error) {
    console.error('Update doctor profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete doctor account
// @route   DELETE /api/doctors/me
// @access  Private (Doctor only)
exports.deleteDoctorAccount = async (req, res) => {
  try {
    if (req.user.role !== 'doctor') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only doctors can access this resource.'
      });
    }

    // Delete doctor profile
    await Doctor.delete(req.user.id);
    
    // Delete user account
    await User.delete(req.user.id);

    res.json({
      success: true,
      message: 'Doctor account deleted successfully'
    });
  } catch (error) {
    console.error('Delete doctor account error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Helper function to generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { user: { id: user.id, role: user.role } },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};
