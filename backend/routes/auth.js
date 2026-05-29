const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { auth, adminOnly } = require('../middleware/auth');

// Register route
router.post('/register', authController.register);

// Login route
router.post('/login', authController.login);

// Change password (authenticated user)
router.post('/change-password', auth, authController.changePassword);

// User management routes (Admin only)
router.get('/users', auth, adminOnly, authController.getUsers);
router.delete('/users/:id', auth, adminOnly, authController.deleteUser);

// Admin creation route (Admin only)
router.post('/admin/create', auth, adminOnly, authController.createAdmin);

// Get QR code for admin (Admin only)
router.get('/admin/:username/qrcode', auth, adminOnly, authController.getAdminQRCode);

// Student approval route (Admin only)
router.put('/users/:id/approve', auth, adminOnly, authController.approveStudent);

module.exports = router;

