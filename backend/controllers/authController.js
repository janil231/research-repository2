const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

// Secret key for admin registration (should be in .env)
const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY || 'adminsecret';

/**
 * Generate TOTP secret and QR code for admin
 */
function generateTOTPSecret(username) {
  const secret = speakeasy.generateSecret({
    name: `Research Repository (${username})`,
    issuer: 'Research Repository'
  });
  return secret;
}

/**
 * Generate QR code data URL from TOTP secret
 */
async function generateQRCode(otpauthUrl) {
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);
    return qrCodeDataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
}

/**
 * Register a new user (Student or Admin)
 */
exports.register = async (req, res) => {
  try {
    const { role } = req.body;
    
    // Validate role
    if (!role || !['student', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Must be "student" or "admin".' });
    }
    
    if (role === 'student') {
      const { firstName, lastName, schoolId, department, password } = req.body;
      // Check required fields
      if (!firstName || !lastName || !schoolId || !department || !password) {
        return res.status(400).json({ message: 'All fields are required.' });
      }
      
      // Validate password strength
      if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
      }
      // Check uniqueness
      const existing = await User.findOne({ schoolId });
      if (existing) {
        return res.status(400).json({ message: 'School ID already registered.' });
      }
      // Create student user (pending approval)
      const user = new User({
        firstName,
        lastName,
        schoolId,
        department,
        password,
        role: 'student',
        status: 'pending'
      });
      await user.save();
      return res.status(201).json({ message: 'Student registration submitted. Waiting for admin approval.' });
    } else if (role === 'admin') {
      const { firstName, lastName, username, password, secretKey, favoriteColor } = req.body;
      if (!firstName || !lastName || !username || !password || !secretKey) {
        return res.status(400).json({ message: 'First name, last name, username, password, and secret key are required.' });
      }
      
      // Validate password strength
      if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
      }
      
      // Validate username format
      if (username.length < 3) {
        return res.status(400).json({ message: 'Username must be at least 3 characters long.' });
      }
      
      if (secretKey !== ADMIN_SECRET_KEY) {
        return res.status(403).json({ message: 'Invalid admin secret key.' });
      }
      // Check uniqueness
      const existing = await User.findOne({ username });
      if (existing) {
        return res.status(400).json({ message: 'Username already registered.' });
      }
      
      // Generate TOTP secret for Google Authenticator
      const totpSecret = generateTOTPSecret(username);
      const otpauthUrl = speakeasy.otpauthURL({
        secret: totpSecret.base32,
        label: username,
        issuer: 'Research Repository',
        encoding: 'base32'
      });
      
      // Generate QR code
      const qrCodeDataUrl = await generateQRCode(otpauthUrl);
      
      // Create admin user
      const user = new User({
        firstName,
        lastName,
        username,
        password,
        favoriteColor: favoriteColor ? favoriteColor.toLowerCase().trim() : undefined, // Optional, kept for backward compatibility
        auth_secret: totpSecret.base32,
        role: 'admin',
      });
      await user.save();
      
      return res.status(201).json({ 
        message: 'Admin registered successfully. Please scan the QR code with Google Authenticator.',
        qrCode: qrCodeDataUrl,
        secret: totpSecret.base32 // Include for manual entry if needed
      });
    } else {
      return res.status(400).json({ message: 'Invalid role.' });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

/**
 * Login for Student or Admin
 */
exports.login = async (req, res) => {
  try {
    const { loginId, password } = req.body;
    console.log('Login attempt:', { loginId });
    let user;
    
    // Try to find user by either schoolId (student) or username (admin)
    user = await User.findOne({
      $or: [
        { schoolId: loginId },
        { username: loginId }
      ]
    });
    
    console.log('User found:', user ? { 
      id: user._id, 
      role: user.role, 
      status: user.status,
      username: user.username,
      schoolId: user.schoolId
    } : 'No user found');
    
    if (!user) {
      return res.status(400).json({ message: 'User not found.' });
    }
    
    // Check if user is approved (only for students, admins are always approved)
    if (user.role === 'student' && user.status !== 'approved') {
      return res.status(403).json({ message: 'Account is pending approval. Please wait for admin approval.' });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }
    // Create JWT
    const token = jwt.sign(
      { 
        id: user._id, 
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username
      },
      process.env.JWT_SECRET || 'jwtsecret',
      { expiresIn: '1d' }
    );
    return res.json({ 
      token, 
      user: { 
        id: user._id, 
        role: user.role, 
        firstName: user.firstName, 
        lastName: user.lastName,
        username: user.username,
        schoolId: user.schoolId,
        department: user.department,
        createdAt: user.createdAt
      },
      message: 'Login successful'
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ 
      message: 'Server error during login.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

/**
 * Change password for logged-in user
 */
exports.changePassword = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    const { currentPassword, newPassword } = req.body || {};

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required.' });
    }
    if (String(newPassword).length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters.' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect.' });
    }

    user.password = newPassword; // will be hashed by pre-save hook
    await user.save();

    return res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

/**
 * Get all users (Admin only)
 */
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({}, { password: 0 }); // Exclude password field
    return res.json(users);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

/**
 * Delete a user (Admin only)
 */
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    return res.json({ message: 'User deleted successfully.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

/**
 * Create new admin (Admin only)
 */
exports.createAdmin = async (req, res) => {
  try {
    const { firstName, lastName, username, password, favoriteColor } = req.body;
    
    // Check required fields (favoriteColor is now optional since we use TOTP)
    if (!firstName || !lastName || !username || !password) {
      return res.status(400).json({ message: 'First name, last name, username, and password are required.' });
    }
    
    // Check uniqueness
    const existing = await User.findOne({ username });
    if (existing) {
      return res.status(400).json({ message: 'Username already exists.' });
    }
    
    // Generate TOTP secret for Google Authenticator
    const totpSecret = generateTOTPSecret(username);
    const otpauthUrl = speakeasy.otpauthURL({
      secret: totpSecret.base32,
      label: username,
      issuer: 'Research Repository',
      encoding: 'base32'
    });
    
    // Generate QR code
    const qrCodeDataUrl = await generateQRCode(otpauthUrl);
    
    // Create admin user
    const user = new User({
      firstName,
      lastName,
      username,
      password,
      favoriteColor: favoriteColor ? favoriteColor.toLowerCase().trim() : undefined, // Optional, kept for backward compatibility
      auth_secret: totpSecret.base32,
      role: 'admin',
    });
    
    await user.save();
    return res.status(201).json({ 
      message: 'Admin created successfully. Please scan the QR code with Google Authenticator.',
      qrCode: qrCodeDataUrl,
      secret: totpSecret.base32 // Include for manual entry if needed
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

/**
 * Get QR code for existing admin (Admin only)
 */
exports.getAdminQRCode = async (req, res) => {
  try {
    const { username } = req.params;
    
    const user = await User.findOne({ username, role: 'admin' });
    if (!user) {
      return res.status(404).json({ message: 'Admin not found.' });
    }
    
    // If admin doesn't have a secret yet, generate one
    if (!user.auth_secret) {
      const totpSecret = generateTOTPSecret(username);
      user.auth_secret = totpSecret.base32;
      await user.save();
    }
    
    const otpauthUrl = speakeasy.otpauthURL({
      secret: user.auth_secret,
      label: username,
      issuer: 'Research Repository',
      encoding: 'base32'
    });
    
    const qrCodeDataUrl = await generateQRCode(otpauthUrl);
    
    return res.json({ 
      qrCode: qrCodeDataUrl,
      secret: user.auth_secret
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

/**
 * Approve/Reject student registration (Admin only)
 */
exports.approveStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be "approved" or "rejected".' });
    }

    const user = await User.findByIdAndUpdate(
      id, 
      { status }, 
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    
    if (user.role !== 'student') {
      return res.status(400).json({ message: 'Can only approve/reject student accounts.' });
    }

    return res.json({ message: `Student registration ${status} successfully.`, user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

