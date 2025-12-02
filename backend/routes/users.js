const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { auth, adminOnly } = require('../middleware/auth');

// GET /api/users - Get all users (Admin only)
router.get('/', auth, adminOnly, authController.getUsers);

// DELETE /api/users/:id - Delete a user (Admin only)
router.delete('/:id', auth, adminOnly, authController.deleteUser);

// PUT /api/users/:id/approve - Approve/reject student registration (Admin only)
router.put('/:id/approve', auth, adminOnly, authController.approveStudent);

module.exports = router;
