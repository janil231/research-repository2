const express = require('express');
const router = express.Router();
const { auth, adminOnly } = require('../middleware/auth');
const User = require('../models/User');
const ResetRequest = require('../models/ResetRequest');
const bcrypt = require('bcryptjs');
const speakeasy = require('speakeasy');

// Submit reset request (Student only)
router.post('/request-reset', async (req, res) => {
  try {
    const { schoolId } = req.body;
    
    if (!schoolId) {
      return res.status(400).json({ message: 'School ID is required.' });
    }
    
    // Find user by school ID
    const user = await User.findOne({ schoolId });
    if (!user) {
      return res.status(404).json({ message: 'No account found with this School ID.' });
    }

    // Check if user already has a pending reset request
    const existingRequest = await ResetRequest.findOne({ 
      userId: user._id,
      status: 'pending'
    });
    
    if (existingRequest) {
      return res.status(400).json({ 
        message: 'You already have a pending reset request. Please wait for admin approval.' 
      });
    }

    // Create new reset request
    const resetRequest = new ResetRequest({
      userId: user._id
    });
    await resetRequest.save();

    res.json({ 
      message: 'Password reset request submitted successfully. Please wait for admin approval.' 
    });
  } catch (error) {
    console.error('Reset request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin password reset (immediate reset with TOTP verification)
router.post('/admin-reset', async (req, res) => {
  try {
    const { username, totpCode, newPassword } = req.body;
    
    if (!username || !totpCode || !newPassword) {
      return res.status(400).json({ message: 'Username, TOTP code, and new password are required.' });
    }
    
    // Validate password strength
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }
    
    // Validate TOTP code format (6 digits)
    if (!/^\d{6}$/.test(totpCode)) {
      return res.status(400).json({ message: 'TOTP code must be 6 digits.' });
    }
    
    // Find admin user by username
    const user = await User.findOne({ username, role: 'admin' });
    if (!user) {
      return res.status(404).json({ message: 'No admin account found with this username.' });
    }
    
    // Check if account is locked due to too many failed attempts
    if (user.totpLockedUntil && user.totpLockedUntil > new Date()) {
      const minutesLeft = Math.ceil((user.totpLockedUntil - new Date()) / 60000);
      return res.status(403).json({ 
        message: `Too many incorrect verification attempts. Please try again in ${minutesLeft} minute(s).` 
      });
    }
    
    // Check if admin has TOTP secret set up
    if (!user.auth_secret) {
      return res.status(400).json({ 
        message: 'TOTP is not set up for this admin account. Please contact an administrator.' 
      });
    }
    
    // Verify TOTP code
    const verified = speakeasy.totp.verify({
      secret: user.auth_secret,
      encoding: 'base32',
      token: totpCode,
      window: 2 // Allow 2 time steps (60 seconds) before/after current time
    });
    
    if (!verified) {
      // Increment failed attempts
      user.totpAttempts = (user.totpAttempts || 0) + 1;
      
      // Lock account after 5 failed attempts for 15 minutes
      if (user.totpAttempts >= 5) {
        const lockUntil = new Date();
        lockUntil.setMinutes(lockUntil.getMinutes() + 15);
        user.totpLockedUntil = lockUntil;
        await user.save();
        return res.status(401).json({ 
          message: 'Too many incorrect verification attempts. Account locked for 15 minutes.' 
        });
      }
      
      await user.save();
      const attemptsLeft = 5 - user.totpAttempts;
      return res.status(401).json({ 
        message: `Incorrect TOTP code. ${attemptsLeft} attempt(s) remaining.` 
      });
    }
    
    // Reset failed attempts on successful verification
    user.totpAttempts = 0;
    user.totpLockedUntil = null;
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update user's password and reset TOTP attempts
    await User.findByIdAndUpdate(user._id, { 
      password: hashedPassword,
      totpAttempts: 0,
      totpLockedUntil: null
    });
    
    res.json({ 
      message: 'Password reset successfully. You can now login with your new password.' 
    });
  } catch (error) {
    console.error('Admin reset error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Probe identifier - determine if admin or student
router.post('/probe-identifier', async (req, res) => {
  try {
    const { identifier } = req.body;
    if (!identifier) return res.status(400).json({ message: 'Identifier required.' });
    // Try username (admin)
    let user = await User.findOne({ username: identifier });
    if (user && user.role === 'admin') return res.json({ role: 'admin' });
    // Try schoolId (student)
    user = await User.findOne({ schoolId: identifier });
    if (user && user.role === 'student') return res.json({ role: 'student' });
    // Not found, fallback to student for UI
    return res.json({ role: 'student' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all reset requests (admin only)
router.get('/reset-requests', [auth, adminOnly], async (req, res) => {
  try {
    const requests = await ResetRequest.find()
      .populate('userId', 'firstName lastName schoolId department')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    console.error('Get reset requests error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Handle reset request (admin only)
router.put('/reset-request/:id', [auth, adminOnly], async (req, res) => {
  try {
    const { id } = req.params;
    const { status, newPassword } = req.body;

    const resetRequest = await ResetRequest.findById(id);
    if (!resetRequest) {
      return res.status(404).json({ message: 'Reset request not found.' });
    }

    if (status === 'approved') {
      if (!newPassword) {
        return res.status(400).json({ message: 'New password is required for approval.' });
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      // Update user's password
      await User.findByIdAndUpdate(resetRequest.userId, { password: hashedPassword });
      
      // Update reset request status
      resetRequest.status = 'approved';
      await resetRequest.save();
      
      res.json({ 
        message: 'Reset request approved. Password has been reset to School ID.',
        status: 'approved'
      });
    } else {
      // Update request status for rejection
      resetRequest.status = status;
      await resetRequest.save();
      
      res.json({ 
        message: 'Reset request rejected',
        status: 'rejected'
      });
    }
  } catch (error) {
    console.error('Handle reset request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;