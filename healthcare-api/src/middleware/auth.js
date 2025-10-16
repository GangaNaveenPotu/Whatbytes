const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

/**
 * Authentication middleware to verify JWT token
 */
const auth = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false,
        message: 'No token provided, authorization denied' 
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from database with role information
      const { rows } = await pool.query(
        `SELECT u.*, 
                p.id as patient_id, d.id as doctor_id
         FROM users u
         LEFT JOIN patients p ON u.id = p.user_id
         LEFT JOIN doctors d ON u.id = d.user_id
         WHERE u.id = $1`,
        [decoded.user.id]
      );

      if (rows.length === 0) {
        return res.status(401).json({ 
          success: false,
          message: 'User not found' 
        });
      }

      const user = rows[0];
      
      // Add user and role information to request object
      req.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        patientId: user.patient_id,
        doctorId: user.doctor_id
      };
      
      next();
    } catch (err) {
      console.error('Token verification error:', err);
      if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ 
          success: false,
          message: 'Invalid token' 
        });
      } else if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          success: false,
          message: 'Token has expired' 
        });
      }
      throw err;
    }
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Server error during authentication',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

/**
 * Role-based access control middleware
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }

    next();
  };
};

/**
 * Middleware to check if the user is the owner of the resource or an admin
 */
const isOwnerOrAdmin = (resourceUserId) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Allow if user is admin or owns the resource
    if (req.user.role === 'admin' || req.user.id === resourceUserId) {
      return next();
    }

    res.status(403).json({
      success: false,
      message: 'Not authorized to access this resource'
    });
  };
};

module.exports = {
  auth,
  authorize,
  isOwnerOrAdmin
};
