const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { auth, authorize } = require('../middleware/auth');

// Public routes - only for basic user registration (admin creation)
router.post('/register', (req, res, next) => {
  authController.register(req, res).catch(next);
});

router.post('/login', (req, res, next) => {
  authController.login(req, res).catch(next);
});

// Protected routes for role-specific registration
router.post('/register/patient', auth, authorize('admin'), (req, res, next) => {
  authController.registerPatient(req, res).catch(next);
});

router.post('/register/doctor', auth, authorize('admin'), (req, res, next) => {
  authController.registerDoctor(req, res).catch(next);
});

// Protected route
router.get('/me', auth, (req, res, next) => {
  authController.getMe(req, res).catch(next);
});

module.exports = router;