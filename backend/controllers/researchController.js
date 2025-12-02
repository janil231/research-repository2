const Research = require('../models/Research');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const unzipper = require('unzipper');

// Configure multer for PDF uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/research';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'research-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'), false);
  }
};

const upload = multer({ 
  storage: storage, 
  fileFilter: fileFilter,
  limits: { fileSize: 200 * 1024 * 1024 } // 200MB limit
});

// Multer for backup ZIP uploads
const backupZipStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const backupDir = 'uploads/backups';
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    cb(null, backupDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'backup-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const zipFileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const isZip = file.mimetype === 'application/zip' || file.mimetype === 'application/x-zip-compressed' || ext === '.zip';
  if (isZip) {
    cb(null, true);
  } else {
    cb(new Error('Only ZIP files are allowed'), false);
  }
};

const uploadBackupZip = multer({
  storage: backupZipStorage,
  fileFilter: zipFileFilter,
  limits: { fileSize: 2 * 1024 * 1024 * 1024 } // 2GB limit
});

// Export multer handler for backup ZIP: field name 'backup'
exports.uploadBackupZip = uploadBackupZip.single('backup');

/**
 * Upload new research paper
 */
exports.uploadResearch = async (req, res) => {
  try {
    const { title, authors, adviser, department, year, semester, keywords } = req.body;
    
    // Debug logging
    console.log('Received form data:', {
      title, authors, adviser, department, year, semester, keywords,
      hasFile: !!req.file,
      fileName: req.file ? req.file.originalname : 'No file'
    });
    
    // Validate required fields
    if (!title || !authors || !adviser || !department || !year || !semester) {
      console.log('Validation failed - missing fields:', {
        title: !!title,
        authors: !!authors,
        adviser: !!adviser,
        department: !!department,
        year: !!year,
        semester: !!semester
      });
      return res.status(400).json({ message: 'All fields are required.' });
    }

    // Validate field lengths
    if (title.length < 5) {
      return res.status(400).json({ message: 'Title must be at least 5 characters long.' });
    }
    
    // Abstract optional

    // Validate year
    const yearNum = parseInt(year);
    if (isNaN(yearNum) || yearNum < 1900 || yearNum > new Date().getFullYear() + 1) {
      return res.status(400).json({ message: 'Invalid year.' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'PDF file is required.' });
    }

    // Parse authors and keywords
    const authorsArray = authors.split(',').map(author => author.trim());
    const keywordsArray = keywords ? keywords.split(',').map(keyword => keyword.trim()) : [];

    // Auto-approve teacher and admin uploads, set student uploads to pending
    const userRole = req.user.role;
    const initialStatus = (userRole === 'teacher' || userRole === 'admin') ? 'approved' : 'pending';

    const research = new Research({
      title,
      authors: authorsArray,
      adviser,
      department,
      year: parseInt(year),
      semester,
      keywords: keywordsArray,
      pdfFilePath: req.file.path,
      status: initialStatus,
      uploadedBy: req.user.id
    });

    await research.save();
    
    // Send notification to admins if student upload
    if (userRole === 'student') {
      // TODO: Implement notification system
      console.log(`New research uploaded by student ${req.user.firstName} ${req.user.lastName} - requires admin approval`);
    } else if (userRole === 'admin') {
      console.log(`Research uploaded by admin ${req.user.firstName} ${req.user.lastName} - auto-approved`);
    }
    
    return res.status(201).json({ message: 'Research uploaded successfully.', research });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

/**
 * Get all research papers
 */
exports.getResearch = async (req, res) => {
  try {
    const research = await Research.find({ 
      status: { 
        $nin: ['archived', 'pending', 'rejected'] 
      } 
    }).sort({ createdAt: -1 });
    return res.json(research);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

/**
 * Get pending research papers (admin only)
 */
exports.getPendingResearch = async (req, res) => {
  try {
    const pendingResearch = await Research.find({ status: 'pending' })
      .populate('uploadedBy', 'firstName lastName schoolId department')
      .sort({ createdAt: -1 });
    return res.json(pendingResearch);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

/**
 * Approve research paper (admin only)
 */
exports.approveResearch = async (req, res) => {
  try {
    const { id } = req.params;
    const research = await Research.findByIdAndUpdate(
      id,
      { status: 'approved' },
      { new: true }
    ).populate('uploadedBy', 'firstName lastName schoolId department');
    
    if (!research) {
      return res.status(404).json({ message: 'Research not found.' });
    }
    
    return res.json({ message: 'Research approved successfully.', research });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

/**
 * Reject research paper (admin only)
 */
exports.rejectResearch = async (req, res) => {
  try {
    const { id } = req.params;
    const research = await Research.findByIdAndUpdate(
      id,
      { status: 'rejected' },
      { new: true }
    ).populate('uploadedBy', 'firstName lastName schoolId department');
    
    if (!research) {
      return res.status(404).json({ message: 'Research not found.' });
    }
    
    return res.json({ message: 'Research rejected successfully.', research });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};


/**
 * Archive research paper (soft-delete via status)
 */
exports.archiveResearch = async (req, res) => {
  try {
    const { id } = req.params;
    const research = await Research.findByIdAndUpdate(
      id,
      { status: 'archived' },
      { new: true }
    );

    if (!research) {
      return res.status(404).json({ message: 'Research not found.' });
    }

    return res.json({ message: 'Research archived successfully.', research });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

/**
 * Delete research paper
 */
exports.deleteResearch = async (req, res) => {
  try {
    const { id } = req.params;
    const research = await Research.findById(id);
    
    if (!research) {
      return res.status(404).json({ message: 'Research not found.' });
    }

    // Delete the PDF file
    if (research.pdfFilePath && fs.existsSync(research.pdfFilePath)) {
      fs.unlinkSync(research.pdfFilePath);
    }

    await Research.findByIdAndDelete(id);
    return res.json({ message: 'Research deleted successfully.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

/**
 * Get archived research (admin)
 */
exports.getArchivedResearch = async (req, res) => {
  try {
    const archived = await Research.find({ status: 'archived' }).sort({ updatedAt: -1 });
    return res.json(archived);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

/**
 * Get archived research count (admin)
 */
exports.getArchivedResearchCount = async (req, res) => {
  try {
    const count = await Research.countDocuments({ status: 'archived' });
    return res.json({ count });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// Search research papers with enhanced accuracy
exports.searchResearch = async (req, res) => {
  try {
    const { keyword, author, year, department, semester, status, keywords, sortBy = 'newest', page = 1, limit = 20, qTags } = req.query;

    let query = {};
    let searchConditions = [];
    // collect keyword blocks to later combine with OR across all tokens
    let keywordBlocks = [];

    const addKeywordConditions = (kw) => {
      const kwRegexEsc = kw.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const conds = [
        { title: { $regex: kwRegexEsc, $options: 'i' } },
        { abstract: { $regex: kwRegexEsc, $options: 'i' } },
        { keywords: { $regex: kwRegexEsc, $options: 'i' } },
        { adviser: { $regex: kwRegexEsc, $options: 'i' } },
        { department: { $regex: kwRegexEsc, $options: 'i' } },
        { authors: { $regex: kwRegexEsc, $options: 'i' } },
        { semester: { $regex: kwRegexEsc, $options: 'i' } },
      ];
      const yearNum = parseInt(kw.trim(), 10);
      if (!Number.isNaN(yearNum) && String(yearNum).length >= 2) {
        conds.push({ year: yearNum });
      }
      keywordBlocks.push({ $or: conds });
    };

    if (keyword) addKeywordConditions(keyword);

    if (qTags) {
      const tags = String(qTags).split(',').map(t => t.trim()).filter(Boolean);
      tags.forEach(t => addKeywordConditions(t));
    }

    if (author) {
      const authorRegex = author.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      searchConditions.push({
        $or: [
          { authors: { $regex: authorRegex, $options: 'i' } },
          { 'authors': { $elemMatch: { $regex: authorRegex, $options: 'i' } } }
        ]
      });
    }

    if (keywords) {
      const keywordsRegex = keywords.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      searchConditions.push({ keywords: { $regex: keywordsRegex, $options: 'i' } });
    }

    if (year) {
      const yearNum = parseInt(year);
      if (!isNaN(yearNum)) {
        searchConditions.push({ year: yearNum });
      }
    }

    if (department) {
      console.log('Department filter received:', department);
      // Normalize: strip parentheses/acronym from filter and match both base + (acronym) and base alone
      const baseDept = department.replace(/\s*\([^)]*\)/, '').trim();
      console.log('Base department after normalization:', baseDept);
      searchConditions.push({
        $or: [
          { department: { $regex: `^${baseDept}(\\s*\\([^)]*\\))?$`, $options: 'i' } },
          { department: { $regex: `^${department.trim()}$`, $options: 'i' } }
        ]
      });
      console.log('Department search conditions:', searchConditions[searchConditions.length - 1]);
    }

    if (semester) {
      searchConditions.push({ semester: { $regex: `^${semester.trim()}$`, $options: 'i' } });
    }

    if (status) {
      searchConditions.push({ status: status });
    }

    // Exclude archived, pending, and rejected for student dashboard and open APIs unless explicitly requested
    if (!status) {
      searchConditions.push({ 
        status: { 
          $nin: ['archived', 'pending', 'rejected'] 
        } 
      });
    }

    // Combine keyword blocks with OR across tokens, and AND with other filters
    const andConditions = [...searchConditions];
    if (keywordBlocks.length > 0) {
      andConditions.push({ $or: keywordBlocks });
    }
    if (andConditions.length > 0) {
      query = { $and: andConditions };
    }

    const pageNum = Math.max(1, parseInt(page) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(limit) || 20));
    let sort = { createdAt: -1 };
    if (sortBy === 'oldest') sort = { createdAt: 1 };
    if (sortBy === 'alpha') sort = { title: 1 };

    const collation = { locale: 'en', strength: 1 };

    console.log('Final query:', JSON.stringify(query, null, 2));
    const total = await Research.countDocuments(query).collation(collation);
    console.log('Total documents found:', total);
    const research = await Research.find(query)
      .populate('uploadedBy', 'firstName lastName')
      .sort(sort)
      .skip((pageNum - 1) * pageSize)
      .limit(pageSize)
      .collation(collation);

    console.log('Research results count:', research.length);
    if (research.length > 0) {
      console.log('Sample result department:', research[0].department);
    }

    res.json({
      data: research,
      pagination: {
        page: pageNum,
        limit: pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Server error during search' });
  }
};

// Helper function to calculate relevance score
function calculateRelevanceScore(paper, keyword) {
  let score = 0;
  const keywordLower = keyword.toLowerCase();
  
  // Title exact match gets highest score
  if (paper.title.toLowerCase().includes(keywordLower)) {
    score += 10;
    // Exact word boundary match gets bonus
    if (new RegExp(`\\b${keywordLower}\\b`, 'i').test(paper.title)) {
      score += 5;
    }
  }
  
  // Abstract match gets medium score
  if (paper.abstract && paper.abstract.toLowerCase().includes(keywordLower)) {
    score += 5;
    if (paper.abstract && new RegExp(`\\b${keywordLower}\\b`, 'i').test(paper.abstract)) {
      score += 2;
    }
  }
  
  // Keywords match gets medium score
  if (paper.keywords && paper.keywords.some(k => k.toLowerCase().includes(keywordLower))) {
    score += 3;
  }
  
  // Author match gets lower score
  if (paper.authors && paper.authors.some(a => a.toLowerCase().includes(keywordLower))) {
    score += 2;
  }
  
  // Adviser match gets lower score
  if (paper.adviser && paper.adviser.toLowerCase().includes(keywordLower)) {
    score += 1;
  }
  
  return score;
}

// Export multer upload middleware
exports.upload = upload.single('file');

/**
 * Serve PDF file for a research paper
 */
exports.servePDF = async (req, res) => {
  try {
    const { id } = req.params;
    const research = await Research.findById(id);
    
    if (!research) {
      return res.status(404).json({ message: 'Research not found.' });
    }
    
    if (!research.pdfFilePath) {
      return res.status(404).json({ message: 'PDF file not found for this research.' });
    }
    
    // Check if file exists
    const filePath = path.isAbsolute(research.pdfFilePath) 
      ? research.pdfFilePath 
      : path.join(__dirname, '..', research.pdfFilePath);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'PDF file does not exist on server.' });
    }
    
    // Set proper headers and send file
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${path.basename(filePath)}"`);
    res.sendFile(path.resolve(filePath));
  } catch (err) {
    console.error('Error serving PDF:', err);
    return res.status(500).json({ message: 'Error serving PDF file.' });
  }
};

exports.incrementView = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Research.findOneAndUpdate({ _id: id, status: { $nin: ['archived', 'pending', 'rejected'] } }, { $inc: { views: 1 } }, { new: true });
    if (!updated) return res.status(404).json({ message: 'Research not found' });
    res.json({ views: updated.views });
  } catch (e) {
    res.status(500).json({ message: 'Failed to increment view' });
  }
};

exports.incrementDownload = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Research.findOneAndUpdate({ _id: id, status: { $nin: ['archived', 'pending', 'rejected'] } }, { $inc: { downloads: 1 } }, { new: true });
    if (!updated) return res.status(404).json({ message: 'Research not found' });
    res.json({ downloads: updated.downloads });
  } catch (e) {
    res.status(500).json({ message: 'Failed to increment download' });
  }
};

/**
 * Backup all research PDF files as ZIP
 */
exports.backupResearch = async (req, res) => {
  try {
    const archiver = require('archiver');
    // Include ALL research statuses (approved, pending, rejected, archived)
    const research = await Research.find({}).sort({ createdAt: -1 });
    
    // Create a ZIP archive
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    });

    // Set headers for ZIP file download
    const filename = `research_backup_${new Date().toISOString().split('T')[0]}.zip`;
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Pipe archive data to the response
    archive.pipe(res);

    // Add each PDF file to the archive
    for (const paper of research) {
      if (paper.pdfFilePath && fs.existsSync(paper.pdfFilePath)) {
        // Create a safe filename from the title
        const safeTitle = paper.title.replace(/[^a-z0-9]/gi, '_').substring(0, 50);
        const originalFilename = path.basename(paper.pdfFilePath);
        const fileExtension = path.extname(paper.pdfFilePath);
        
        // Add file with descriptive name: Title_Year_ID.pdf
        const archiveName = `${safeTitle}_${paper.year}_${paper._id}${fileExtension}`;
        archive.file(paper.pdfFilePath, { name: archiveName });
      }
    }

    // Add a metadata file
    const metadata = {
      exportDate: new Date().toISOString(),
      totalRecords: research.length,
      researchPapers: research.map(r => ({
        _id: r._id,
        title: r.title,
        authors: r.authors,
        adviser: r.adviser,
        department: r.department,
        year: r.year,
        semester: r.semester,
        keywords: r.keywords,
        abstract: r.abstract,
        status: r.status,
        views: r.views,
        downloads: r.downloads,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        uploadedBy: r.uploadedBy,
        pdfFilePath: r.pdfFilePath
      }))
    };
    
    archive.append(JSON.stringify(metadata, null, 2), { name: 'metadata.json' });

    // Finalize the archive
    await archive.finalize();
    
  } catch (err) {
    console.error('Backup error:', err);
    return res.status(500).json({ message: 'Failed to create backup.' });       
  }
};

/**
 * Restore research and PDFs from a backup ZIP
 * Expects field name: 'backup' (multipart/form-data)
 */
exports.restoreFromBackup = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Backup ZIP file is required.' });
    }

    const uploadsDir = 'uploads/research';
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const zipPath = req.file.path;
    const directory = await unzipper.Open.file(zipPath);

    const metadataEntry = directory.files.find(f => f.path === 'metadata.json');
    if (!metadataEntry) {
      return res.status(400).json({ message: 'metadata.json not found in backup.' });
    }

    const metadataContent = await metadataEntry.buffer();
    let metadata;
    try {
      metadata = JSON.parse(metadataContent.toString('utf8'));
    } catch (e) {
      return res.status(400).json({ message: 'Invalid metadata.json.' });
    }

    const filesByName = new Map();
    for (const f of directory.files) {
      if (!f.type || f.type !== 'File') continue;
      filesByName.set(f.path, f);
    }

    let created = 0;
    let updated = 0;
    let skippedNoFile = 0;

    const papers = Array.isArray(metadata.researchPapers) ? metadata.researchPapers : [];

    const toSafeTitle = (title) => title.replace(/[^a-z0-9]/gi, '_').substring(0, 50);

    const saveEntryTo = async (entry, destPath) => {
      await new Promise((resolve, reject) => {
        entry.stream()
          .pipe(fs.createWriteStream(destPath))
          .on('finish', resolve)
          .on('error', reject);
      });
    };

    for (const r of papers) {
      try {
        const safeTitle = toSafeTitle(String(r.title || 'untitled'));
        const ext = path.extname(String(r.pdfFilePath || '') || '.pdf') || '.pdf';
        const idPart = r._id || 'noid';
        const yearPart = r.year || 'yyyy';
        const archiveName = `${safeTitle}_${yearPart}_${idPart}${ext}`;

        const pdfEntry = filesByName.get(archiveName);
        if (!pdfEntry) {
          skippedNoFile += 1;
          continue;
        }

        const destFileName = `restored-${Date.now()}-${Math.round(Math.random() * 1E6)}${ext}`;
        const destPath = path.join(uploadsDir, destFileName);
        await saveEntryTo(pdfEntry, destPath);

        const baseDoc = {
          title: r.title,
          authors: r.authors,
          adviser: r.adviser,
          department: r.department,
          year: r.year,
          semester: r.semester,
          keywords: r.keywords,
          abstract: r.abstract,
          status: r.status || 'approved',
          views: r.views || 0,
          downloads: r.downloads || 0,
          uploadedBy: r.uploadedBy || req.user.id,
          pdfFilePath: destPath
        };

        let doc;
        if (r._id) {
          doc = await Research.findById(r._id);
          if (doc) {
            Object.assign(doc, baseDoc);
            await doc.save();
            updated += 1;
            continue;
          }
        }

        const existing = await Research.findOne({ title: r.title, year: r.year });
        if (existing) {
          Object.assign(existing, baseDoc);
          await existing.save();
          updated += 1;
        } else {
          const createDoc = new Research({ _id: r._id, ...baseDoc });
          await createDoc.save();
          created += 1;
        }
      } catch (e) {
        console.error('Restore item error:', e);
        skippedNoFile += 1;
      }
    }

    return res.json({
      message: 'Restore completed',
      summary: { created, updated, skippedNoFile, totalMetadata: papers.length }
    });
  } catch (err) {
    console.error('Restore error:', err);
    return res.status(500).json({ message: 'Failed to restore from backup.' });
  }
};

// Restore archived research paper
exports.restoreResearch = async (req, res) => {
  try {
    const { id } = req.params;
    const research = await Research.findByIdAndUpdate(
      id,
      { status: 'approved' },
      { new: true }
    );
    if (!research) {
      return res.status(404).json({ message: 'Research not found.' });
    }
    return res.json({ message: 'Research restored successfully.', research });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

/**
 * Clear all research documents and optionally delete uploaded PDF files.
 * Query: keepFiles=true to preserve existing files on disk.
 */
exports.clearAllResearch = async (req, res) => {
  try {
    const keepFiles = String(req.query.keepFiles || 'false').toLowerCase() === 'true';

    const all = await Research.find({});
    let filesDeleted = 0;
    if (!keepFiles) {
      for (const doc of all) {
        if (doc.pdfFilePath && fs.existsSync(doc.pdfFilePath)) {
          try {
            fs.unlinkSync(doc.pdfFilePath);
            filesDeleted += 1;
          } catch (e) {
            console.error('Failed to delete file:', doc.pdfFilePath, e.message);
          }
        }
      }
    }

    const result = await Research.deleteMany({});
    return res.json({
      message: 'All research cleared.',
      deletedCount: result.deletedCount || 0,
      filesDeleted: keepFiles ? 0 : filesDeleted,
      keptFiles: keepFiles
    });
  } catch (err) {
    console.error('Clear all research error:', err);
    return res.status(500).json({ message: 'Failed to clear research.' });
  }
};

/**
 * Seed one realistic pending and one archived research with placeholder PDFs.
 */
exports.seedSampleResearch = async (req, res) => {
  try {
    const uploadDir = 'uploads/research';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const writeMinimalPdf = (filePath, titleText) => {
      const minimalPdf = `%PDF-1.4\n%âãÏÓ\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 44 >>\nstream\nBT /F1 24 Tf 72 720 Td (${titleText}) Tj ET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000015 00000 n \n0000000074 00000 n \n0000000135 00000 n \n0000000224 00000 n \ntrailer\n<< /Root 1 0 R /Size 5 >>\nstartxref\n320\n%%EOF`;
      fs.writeFileSync(filePath, minimalPdf);
    };

    const pendingPdfPath = path.join(uploadDir, `sample-pending-${Date.now()}.pdf`);
    const archivedPdfPath = path.join(uploadDir, `sample-archived-${Date.now()}.pdf`);
    writeMinimalPdf(pendingPdfPath, 'Sample Pending Research');
    writeMinimalPdf(archivedPdfPath, 'Sample Archived Research');

    const pendingDoc = new Research({
      title: 'AI-Assisted Study Planner for First-Year Students',
      authors: ['Jane Dela Cruz', 'Mark Santos'],
      adviser: 'Dr. Ana Reyes',
      department: 'Information Systems',
      year: new Date().getFullYear(),
      semester: '1st Semester',
      keywords: ['AI', 'Study Habits', 'Educational Tech'],
      abstract: 'This study explores an AI-assisted planner that adapts to student behavior and schedules to improve time management and academic performance.',
      status: 'pending',
      views: 0,
      downloads: 0,
      uploadedBy: req.user && req.user.id,
      pdfFilePath: pendingPdfPath
    });

    const archivedDoc = new Research({
      title: 'Legacy System Migration Strategies in SMEs',
      authors: ['Carlo Mendoza', 'Ella Garcia'],
      adviser: 'Prof. Luis Ramos',
      department: 'Computer Science',
      year: new Date().getFullYear() - 2,
      semester: '2nd Semester',
      keywords: ['Migration', 'Cloud', 'Refactoring'],
      abstract: 'An analysis of cost-effective legacy system migration approaches suitable for small to medium enterprises.',
      status: 'archived',
      views: 25,
      downloads: 7,
      uploadedBy: req.user && req.user.id,
      pdfFilePath: archivedPdfPath
    });

    await pendingDoc.save();
    await archivedDoc.save();

    return res.json({
      message: 'Seeded pending and archived research successfully.',
      pending: pendingDoc,
      archived: archivedDoc
    });
  } catch (err) {
    console.error('Seed sample research error:', err);
    return res.status(500).json({ message: 'Failed to seed sample research.' });
  }
};
