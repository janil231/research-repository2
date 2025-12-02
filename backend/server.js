// backend/server.js

const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const cors = require('cors');

// Load environment variables from .env if present
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/research-repo', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('MongoDB connected');
}).catch((err) => {
  console.error('MongoDB connection error:', err);
});

// API routes (must come before static files to avoid conflicts)
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/research', require('./routes/research'));
app.use('/api/statistics', require('./routes/statistics'));
app.use('/api/reset', require('./routes/reset'));

// Serve uploaded files (e.g., PDFs) - must come before frontend static
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
  setHeaders: (res, filePath) => {
    // Set proper content type for PDFs
    if (filePath.endsWith('.pdf')) {
      res.setHeader('Content-Type', 'application/pdf');
    }
  }
}));

// Serve frontend files statically
app.use(express.static(path.join(__dirname, '../frontend')));

// Serve frontend for non-API routes (exclude /uploads and /api)
app.get(/^(?!\/api\/|\/uploads\/).*$/, (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler (only for routes that haven't been handled)
app.use((req, res) => {
  // Don't handle if response was already sent
  if (res.headersSent) return;
  res.status(404).json({ message: 'Route not found' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
  console.log(`Accessible from network at: http://<your-ip>:${PORT}`);
});
