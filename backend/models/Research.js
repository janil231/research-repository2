const mongoose = require('mongoose');

const ResearchSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true 
  },
  abstract: { 
    type: String, 
    required: false 
  },
  authors: [{ 
    type: String, 
    required: true 
  }],
  adviser: { 
    type: String, 
    required: true 
  },
  department: { 
    type: String, 
    required: true 
  },
  year: { 
    type: Number, 
    required: true 
  },
  semester: {
    type: String,
    required: true,
    enum: ['1st Semester', '2nd Semester', 'Summer']
  },
  keywords: [{ 
    type: String 
  }],
  pdfFilePath: { 
    type: String, 
    required: true 
  },
  views: {
    type: Number,
    default: 0
  },
  downloads: {
    type: Number,
    default: 0
  },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected', 'archived'],
    default: 'pending'
  },
  uploadedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User'
  }
}, { 
  timestamps: true 
});

// Add text index for search functionality
ResearchSchema.index({ 
  title: 'text', 
  abstract: 'text', 
  authors: 'text',
  department: 'text',
  keywords: 'text' 
});

module.exports = mongoose.model('Research', ResearchSchema);
