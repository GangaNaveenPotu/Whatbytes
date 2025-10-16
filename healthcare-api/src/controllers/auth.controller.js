const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

// Generate JWT Token
const generateToken = (user) => {
  return jwt.sign(
    { user: { id: user.id, role: user.role } },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};

// @desc    Register a new user (Admin only)
// @route   POST /api/auth/register
// @access  Public (but only allows admin role)
const register = async (req, res) => {
  try {
    const { name, email, password, role = 'admin', ...rest } = req.body;
    
    // Debug logging
    console.log('Registration request body:', req.body);
    console.log('Role:', role);
    console.log('Rest fields:', rest);

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide name, email, and password' });
    }

    // Only allow admin role for basic registration
    if (role !== 'admin') {
      return res.status(400).json({ message: 'Only admin role is allowed for basic registration. Use /register/patient or /register/doctor for other roles.' });
    }

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user (admin only)
    const userData = { name, email, password, role };
    const user = await User.create(userData);

    // Generate token
    const token = generateToken(user);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({ message: 'Email already in use' });
    }
    res.status(500).json({ 
      message: 'Server error during registration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Register a new patient (Admin only)
// @route   POST /api/auth/register/patient
// @access  Private/Admin
const registerPatient = async (req, res) => {
  try {
    const { name, email, password, dateOfBirth, phone, address, bloodType } = req.body;
    
    // Validate required fields
    if (!name || !email || !password || !dateOfBirth || !phone) {
      return res.status(400).json({ message: 'Name, email, password, date of birth, and phone are required for patients' });
    }

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new patient
    const userData = { 
      name, 
      email, 
      password, 
      role: 'patient', 
      dateOfBirth, 
      phone, 
      address, 
      bloodType 
    };
    const user = await User.create(userData);

    res.status(201).json({
      success: true,
      message: 'Patient registered successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Patient registration error:', error);
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({ message: 'Email already in use' });
    }
    res.status(500).json({ 
      message: 'Server error during patient registration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Register a new doctor (Admin only)
// @route   POST /api/auth/register/doctor
// @access  Private/Admin
const registerDoctor = async (req, res) => {
  try {
    const { name, email, password, specialization, licenseNumber, phone, isAvailable = true } = req.body;
    
    // Validate required fields
    if (!name || !email || !password || !specialization || !licenseNumber || !phone) {
      return res.status(400).json({ message: 'Name, email, password, specialization, license number, and phone are required for doctors' });
    }

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new doctor
    const userData = { 
      name, 
      email, 
      password, 
      role: 'doctor', 
      specialization, 
      licenseNumber, 
      phone, 
      isAvailable 
    };
    const user = await User.create(userData);

    res.status(201).json({
      success: true,
      message: 'Doctor registered successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Doctor registration error:', error);
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({ message: 'Email or license number already in use' });
    }
    res.status(500).json({ 
      message: 'Server error during doctor registration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await User.comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  register,
  registerPatient,
  registerDoctor,
  login,
  getMe
};
